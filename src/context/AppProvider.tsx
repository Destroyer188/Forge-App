import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, AppState as RNAppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LocalAuth from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { AppSettings, AppState, Exercise, ExerciseLog, GymLogEntry, GymTemplate, Mode, Profile, Reminder } from '../types';
import { loadAppState, saveAppState } from '../services/storage';
import { configureNotifications, getPermissionStatus, requestPermissionOnce, scheduleBackupReminder, scheduleReminder, cancelReminderNotification, scheduleStreakRisk, scheduleGymDayReminders, scheduleTestDeloadReminder } from '../services/notifications';
import { uid } from '../utils/uuid';
import { localDate } from '../utils/date';
import { generate30DayPlan } from '../utils/plans';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system', unit: 'kg', biometricLock: false,
  notifications: { exerciseReminders: true, streakRisk: true, gymDay: true, restTimer: true, testDeload: true, backup: true, streakRiskHour: 20, gymDayLeadHours: 8 },
  notificationPermission: 'unknown',
};
const DEFAULT_STATE: AppState = { version: 1, onboardingComplete: false, profiles: [], settings: DEFAULT_SETTINGS, lastMode: 'calisthenics', lastTabs: { calisthenics: 'Today', gym: 'Today' } };

type AppContextValue = {
  state: AppState; profile?: Profile; loading: boolean; locked: boolean;
  completeOnboarding: (data: Pick<Profile, 'name' | 'age' | 'height' | 'heightUnit'>) => Promise<void>;
  switchProfile: (id: string) => Promise<void>; addProfile: (data: Pick<Profile, 'name' | 'age' | 'height' | 'heightUnit'>) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  updateNotificationPrefs: (patch: Partial<AppSettings['notifications']>) => Promise<void>;
  setMode: (mode: Mode) => Promise<void>; setTab: (mode: Mode, tab: string) => Promise<void>;
  addExercise: (data: Pick<Exercise, 'name' | 'type' | 'unit' | 'currentLevel' | 'targetLevel' | 'notes' | 'color'>) => Promise<void>;
  updateExercise: (id: string, patch: Partial<Exercise>) => Promise<void>; deleteExercise: (id: string) => Promise<void>;
  logExercise: (exerciseId: string, day: number, log: ExerciseLog) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'profileId'>) => Promise<void>; updateReminder: (id: string, patch: Partial<Reminder>) => Promise<void>; deleteReminder: (id: string) => Promise<void>;
  addTemplate: (template: GymTemplate) => Promise<void>; updateTemplate: (template: GymTemplate) => Promise<void>; deleteTemplate: (id: string) => Promise<void>;
  logGym: (entry: GymLogEntry) => Promise<void>;
  markDateComplete: (date?: string) => Promise<void>;
  markExported: () => Promise<void>; replaceAll: (next: AppState) => Promise<void>;
  authenticate: () => Promise<boolean>; lock: () => void; haptic: (type?: 'success' | 'impact') => void;
};

const Ctx = createContext<AppContextValue | null>(null);

function blankProfile(data: Pick<Profile, 'name' | 'age' | 'height' | 'heightUnit'>): Profile {
  return { ...data, id: uid('profile'), createdAt: new Date().toISOString(), exercises: [], gymTemplates: starterTemplates(), gymLogs: [], reminders: [], achievements: [], completedDates: [], activeGymTemplateId: undefined };
}
function starterTemplates(): GymTemplate[] {
  const mk = (name: string, description: string, split: string[]) => ({
    id: uid('template'), name, description, starter: true, createdAt: new Date().toISOString(),
    days: split.map((dayName, i) => ({ id: uid('gday'), dayOfWeek: (i + 1) % 7, name: dayName, rest: dayName === 'Rest', exercises: dayName === 'Rest' ? [] : [
      { id: uid('gex'), name: i % 2 ? 'Bench Press' : 'Squat', sets: 3, reps: 8, unit: 'reps' as const, restSeconds: 120 },
      { id: uid('gex'), name: i % 2 ? 'Row' : 'Romanian Deadlift', sets: 3, reps: 8, unit: 'reps' as const, restSeconds: 120 }
    ] }))
  });
  return [
    mk('Push / Pull / Legs', 'Classic three-day starter split', ['Push', 'Pull', 'Legs', 'Rest', 'Push', 'Pull', 'Rest']),
    mk('Upper / Lower', 'Four-day beginner split', ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest']),
    mk('Full Body', 'Three full-body sessions', ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest']),
    mk('Starting Strength-style', 'Simple compound-focused split', ['Squat + Press', 'Rest', 'Squat + Pull', 'Rest', 'Squat + Press', 'Rest', 'Rest'])
  ];
}


async function clearScheduledByType(type: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(scheduled.filter(n => (n.content.data as any)?.type === type).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined)));
}

async function syncSmartNotifications(p: Profile, settings: AppSettings) {
  if (settings.notificationPermission !== 'granted') return;
  if (settings.notifications.streakRisk) {
    await clearScheduledByType('streak-risk');
    const today = localDate();
    if (!p.completedDates.includes(today) && p.completedDates.length > 0) await scheduleStreakRisk(settings.notifications.streakRiskHour).catch(() => undefined);
  } else await clearScheduledByType('streak-risk');
  if (settings.notifications.gymDay) {
    await clearScheduledByType('gym-day');
    const template = p.gymTemplates.find(t => t.id === p.activeGymTemplateId) ?? p.gymTemplates[0];
    if (template) await scheduleGymDayReminders(template, settings.notifications.gymDayLeadHours).catch(() => undefined);
  } else await clearScheduledByType('gym-day');
  if (settings.notifications.testDeload) {
    await clearScheduledByType('test-deload');
    for (const e of p.exercises) await scheduleTestDeloadReminder(e).catch(() => undefined);
  } else await clearScheduledByType('test-deload');
  const reminderCount = p.reminders.filter(r => r.enabled).length;
  const atRisk = settings.notifications.streakRisk && !p.completedDates.includes(localDate()) && p.completedDates.length > 0 ? 1 : 0;
  await Notifications.setBadgeCountAsync(reminderCount + atRisk).catch(() => undefined);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!state.settings.biometricLock) return;
    const sub = RNAppState.addEventListener('change', next => { if (next !== 'active') setLocked(true); });
    return () => sub.remove();
  }, [state.settings.biometricLock]);

  useEffect(() => { (async () => {
    const saved = await loadAppState();
    const merged = saved ? { ...DEFAULT_STATE, ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings, notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.settings?.notifications } } } : DEFAULT_STATE;
    setState(merged);
    await configureNotifications().catch(() => undefined);
    const permission = await getPermissionStatus().catch(() => 'unknown' as const);
    setState(s => ({ ...s, settings: { ...s.settings, notificationPermission: permission } }));
    setLoading(false);
    const active = merged.profiles.find(p => p.id === merged.activeProfileId);
    if (active) await syncSmartNotifications(active, { ...merged.settings, notificationPermission: permission });
    if (merged.settings.biometricLock && merged.onboardingComplete) setLocked(true);
  })(); }, []);

  const persist = async (next: AppState) => { setState(next); try { await saveAppState(next); } catch (error) { Alert.alert('Storage error', error instanceof Error ? error.message : 'Could not save data.'); throw error; } };
  const profile = useMemo(() => state.profiles.find(p => p.id === state.activeProfileId), [state]);

  const completeOnboarding = async (data: Pick<Profile, 'name' | 'age' | 'height' | 'heightUnit'>) => {
    const p = blankProfile(data);
    let next = { ...state, onboardingComplete: true, activeProfileId: p.id, profiles: [p], lastMode: 'calisthenics' as Mode };
    try { const permission = await requestPermissionOnce(); next = { ...next, settings: { ...next.settings, notificationPermission: permission } }; } catch {}
    await persist(next);
  };
  const addProfile = async (data: Pick<Profile, 'name' | 'age' | 'height' | 'heightUnit'>) => { const p = blankProfile(data); await persist({ ...state, profiles: [...state.profiles, p], activeProfileId: p.id }); };
  const switchProfile = async (id: string) => persist({ ...state, activeProfileId: id });
  const updateSettings = async (patch: Partial<AppSettings>) => {
    const settings = { ...state.settings, ...patch };
    if (patch.biometricLock !== undefined) {
      if (patch.biometricLock) {
        const supported = await LocalAuth.hasHardwareAsync() && await LocalAuth.isEnrolledAsync();
        if (!supported) { Alert.alert('Biometrics unavailable', 'This device has no enrolled biometric method.'); return; }
      } else setLocked(false);
    }
    await persist({ ...state, settings });
  };
  const updateNotificationPrefs = async (patch: Partial<AppSettings['notifications']>) => persist({ ...state, settings: { ...state.settings, notifications: { ...state.settings.notifications, ...patch } } });
  const setMode = async (mode: Mode) => persist({ ...state, lastMode: mode });
  const setTab = async (mode: Mode, tab: string) => persist({ ...state, lastMode: mode, lastTabs: { ...state.lastTabs, [mode]: tab } });

  const mutateProfile = async (fn: (p: Profile) => Profile) => { if (!profile) return; const updated = fn(profile); const nextState = { ...state, profiles: state.profiles.map(p => p.id === profile.id ? updated : p) }; await persist(nextState); await syncSmartNotifications(updated, state.settings); return updated; };

  const addExercise = async (data: Pick<Exercise, 'name' | 'type' | 'unit' | 'currentLevel' | 'targetLevel' | 'notes' | 'color'>) => {
    const exercise: Exercise = { ...data, id: uid('ex'), createdAt: new Date().toISOString(), plan: data.type === 'custom' ? [] : generate30DayPlan(data.type, data.currentLevel, data.targetLevel), sore: false, reminders: [] };
    await mutateProfile(p => ({ ...p, exercises: [...p.exercises, exercise] }));
  };
  const updateExercise = async (id: string, patch: Partial<Exercise>) => mutateProfile(p => ({ ...p, exercises: p.exercises.map(e => e.id === id ? { ...e, ...patch } : e) }));
  const deleteExercise = async (id: string) => mutateProfile(p => ({ ...p, exercises: p.exercises.filter(e => e.id !== id), reminders: p.reminders.filter(r => r.exerciseId !== id) }));
  const logExercise = async (exerciseId: string, day: number, log: ExerciseLog) => {
    await mutateProfile(p => ({ ...p, exercises: p.exercises.map(e => e.id !== exerciseId ? e : { ...e, plan: e.plan.map(d => d.day === day ? { ...d, completed: true, log } : d) }) }));
    await markDateComplete(log.date);
  };
  const addReminder = async (input: Omit<Reminder, 'id' | 'profileId'>) => {
    if (!profile) return; const reminder: Reminder = { ...input, id: uid('rem'), profileId: profile.id };
    let notificationId: string | undefined;
    if (state.settings.notificationPermission === 'granted' && state.settings.notifications.exerciseReminders) notificationId = await scheduleReminder(reminder).catch(() => undefined);
    await mutateProfile(p => ({ ...p, reminders: [...p.reminders, { ...reminder, notificationId }] }));
  };
  const updateReminder = async (id: string, patch: Partial<Reminder>) => {
    const current = profile?.reminders.find(r => r.id === id); if (!current) return;
    await cancelReminderNotification(current);
    const merged = { ...current, ...patch };
    const notificationId = merged.enabled && state.settings.notificationPermission === 'granted' ? await scheduleReminder(merged).catch(() => undefined) : undefined;
    await mutateProfile(p => ({ ...p, reminders: p.reminders.map(r => r.id === id ? { ...merged, notificationId } : r) }));
  };
  const deleteReminder = async (id: string) => {
    const r = profile?.reminders.find(x => x.id === id); if (r) await cancelReminderNotification(r);
    await mutateProfile(p => ({ ...p, reminders: p.reminders.filter(x => x.id !== id) }));
  };
  const addTemplate = async (template: GymTemplate) => mutateProfile(p => ({ ...p, gymTemplates: [...p.gymTemplates, template], activeGymTemplateId: template.id }));
  const updateTemplate = async (template: GymTemplate) => mutateProfile(p => ({ ...p, gymTemplates: p.gymTemplates.map(t => t.id === template.id ? template : t) }));
  const deleteTemplate = async (id: string) => mutateProfile(p => ({ ...p, gymTemplates: p.gymTemplates.filter(t => t.id !== id), activeGymTemplateId: p.activeGymTemplateId === id ? p.gymTemplates.find(t => t.id !== id)?.id : p.activeGymTemplateId }));
  const logGym = async (entry: GymLogEntry) => { await mutateProfile(p => ({ ...p, gymLogs: [entry, ...p.gymLogs].slice(0, 2000) })); await markDateComplete(entry.date); };
  const markDateComplete = async (date = localDate()) => mutateProfile(p => ({ ...p, completedDates: Array.from(new Set([...p.completedDates, date])) }));
  const markExported = async () => { if (!profile) return; await mutateProfile(p => ({ ...p, lastExportAt: new Date().toISOString() })); if (state.settings.notificationPermission === 'granted' && state.settings.notifications.backup) { await clearScheduledByType('backup'); await scheduleBackupReminder(profile.id).catch(() => undefined); } };
  const replaceAll = async (next: AppState) => { await persist(next); setLocked(false); };
  const authenticate = async () => { try { const res = await LocalAuth.authenticateAsync({ promptMessage: 'Unlock Forge' }); if (res.success) setLocked(false); return res.success; } catch { return false; } };
  const lock = () => { if (state.settings.biometricLock) setLocked(true); };
  const haptic = (type: 'success' | 'impact' = 'impact') => { if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); };

  return <Ctx.Provider value={{ state, profile, loading, locked, completeOnboarding, switchProfile, addProfile, updateSettings, updateNotificationPrefs, setMode, setTab, addExercise, updateExercise, deleteExercise, logExercise, addReminder, updateReminder, deleteReminder, addTemplate, updateTemplate, deleteTemplate, logGym, markDateComplete, markExported, replaceAll, authenticate, lock, haptic }}>{children}</Ctx.Provider>;
}
export function useApp() { const v = useContext(Ctx); if (!v) throw new Error('useApp must be inside AppProvider'); return v; }
