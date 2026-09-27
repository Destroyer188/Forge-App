import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Exercise, GymTemplate, Reminder } from '../types';
import { addDays, atLocalTime, nextOccurrence } from '../utils/date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('forge-default', {
      name: 'Forge reminders', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 180, 120, 180], lightColor: '#111111'
    });
  }
}

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'unknown'> {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  if (p.status === 'denied') return 'denied';
  return 'unknown';
}

export async function requestPermissionOnce(): Promise<'granted' | 'denied' | 'unknown'> {
  const current = await getPermissionStatus();
  if (current !== 'unknown') return current;
  const response = await Notifications.requestPermissionsAsync();
  return response.granted ? 'granted' : response.status === 'denied' ? 'denied' : 'unknown';
}

function dateForReminder(reminder: Reminder): Date {
  const [h, m] = reminder.time.split(':').map(Number);
  if (reminder.repeat === 'once' && reminder.date) {
    const d = new Date(`${reminder.date}T00:00:00`); d.setHours(h || 0, m || 0, 0, 0); return d;
  }
  return nextOccurrence(reminder.time, reminder.weekdays);
}

export async function cancelReminderNotification(reminder: Reminder) {
  if (!reminder.notificationId) return;
  const ids = reminder.notificationId.split(',').filter(Boolean);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}

export async function scheduleReminder(reminder: Reminder): Promise<string | undefined> {
  if (!reminder.enabled) return undefined;
  const triggerDate = dateForReminder(reminder);
  if (triggerDate <= new Date()) return undefined;
  const content: Notifications.NotificationContentInput = {
    title: reminder.title,
    body: reminder.kind === 'rest-timer' ? 'Rest timer complete.' : 'Forge reminder',
    data: { reminderId: reminder.id, exerciseId: reminder.exerciseId, day: reminder.planDay },
    sound: 'default',
    ...(Platform.OS === 'android' ? { channelId: 'forge-default' } : {}),
  };
  if (reminder.repeat === 'daily') {
    const id = await Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: triggerDate.getHours(), minute: triggerDate.getMinutes() } });
    return id;
  }
  if (reminder.repeat === 'weekdays' && reminder.weekdays?.length) {
    // Schedule the next 8 occurrences rather than relying on platform-specific weekday semantics.
    let last: Date | null = null; const ids: string[] = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(); d.setDate(d.getDate() + i); const candidate = atLocalTime(d, reminder.time);
      if (!reminder.weekdays.includes(candidate.getDay()) || candidate <= new Date()) continue;
      last = candidate;
      ids.push(await Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: candidate } }));
    }
    return last ? ids.join(',') : undefined;
  }
  if (reminder.repeat === 'plan-day' && reminder.planDay) {
    // A plan-day reminder means the next occurrence of that day in the active block.
    // Caller may replace/reschedule it after a plan block rolls over.
    const d = addDays(new Date(), Math.max(1, reminder.planDay - 1));
    const candidate = atLocalTime(d, reminder.time);
    return Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: candidate } });
  }
  return Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate } });
}

export async function scheduleRestTimer(endTime: number, title = 'Rest complete') {
  const date = new Date(endTime);
  if (date <= new Date()) return undefined;
  return Notifications.scheduleNotificationAsync({
    content: { title, body: 'Your rest timer is finished.', sound: 'default', data: { type: 'rest-timer' }, ...(Platform.OS === 'android' ? { channelId: 'forge-default' } : {}) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function cancelNotification(id?: string) {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}

export async function scheduleBackupReminder(profileId: string) {
  const date = addDays(new Date(), 14); date.setHours(10, 0, 0, 0);
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Back up Forge', body: 'It has been 14 days since your last successful export.', data: { profileId, type: 'backup' }, sound: 'default', ...(Platform.OS === 'android' ? { channelId: 'forge-default' } : {}) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function scheduleGymDayReminders(template: GymTemplate, leadHours = 8) {
  const ids: string[] = [];
  const now = new Date();
  for (const day of template.days) {
    if (day.rest) continue;
    const delta = (day.dayOfWeek - now.getDay() + 7) % 7 || 7;
    const date = addDays(now, delta); date.setHours(9, 0, 0, 0); date.setHours(date.getHours() - leadHours);
    if (date <= now) date.setDate(date.getDate() + 7);
    ids.push(await Notifications.scheduleNotificationAsync({
      content: { title: `Gym day: ${day.name}`, body: 'Your scheduled workout is coming up.', data: { type: 'gym-day', templateId: template.id, gymDayId: day.id }, sound: 'default', ...(Platform.OS === 'android' ? { channelId: 'forge-default' } : {}) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    }));
  }
  return ids;
}

export async function scheduleTestDeloadReminder(exercise: Exercise) {
  const upcoming = exercise.plan.filter(day => (day.type === 'test' || day.type === 'deload') && day.day >= 1).slice(0, 4);
  const ids: string[] = [];
  for (const day of upcoming) {
    const date = addDays(new Date(), Math.max(1, day.day - 1)); date.setHours(9, 0, 0, 0);
    if (date <= new Date()) continue;
    ids.push(await Notifications.scheduleNotificationAsync({
      content: { title: `${day.type === 'test' ? 'Test' : 'Deload'} day tomorrow`, body: `${exercise.name}: day ${day.day}.`, data: { type: 'test-deload', exerciseId: exercise.id, day: day.day } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    }));
  }
  return ids;
}

export async function scheduleStreakRisk(hour = 20) {
  const now = new Date(); const date = new Date(now); date.setHours(hour, 0, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 1);
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Protect your Forge streak', body: 'You have not logged today yet. A quick session still counts.', data: { type: 'streak-risk' }, sound: 'default', ...(Platform.OS === 'android' ? { channelId: 'forge-default' } : {}) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
