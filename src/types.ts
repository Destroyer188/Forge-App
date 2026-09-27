export type Mode = 'calisthenics' | 'gym';
export type ExerciseType = 'endurance' | 'strength' | 'custom';
export type Unit = 'reps' | 'seconds';
export type RirValue = number;
export type PlanDayType = 'workout' | 'rest' | 'test' | 'deload' | 'gtg';

export interface LogSet { reps: number; rir: number; weight?: number; }
export interface ExerciseLog {
  id: string;
  date: string;
  sets: LogSet[];
  notes: string;
  photoUri?: string;
  type: Mode;
}

export interface PlanDay {
  day: number;
  phase: 'foundation' | 'build' | 'peak';
  type: PlanDayType;
  workout: string | null;
  accessory: string;
  warmup: string[];
  rirTarget: number;
  notes: string;
  completed: boolean;
  log?: ExerciseLog;
}

export interface Reminder {
  id: string;
  profileId: string;
  exerciseId?: string;
  gymDay?: number;
  title: string;
  kind: 'exercise' | 'gym-day' | 'streak-risk' | 'rest-timer' | 'test-deload' | 'backup';
  enabled: boolean;
  time: string;
  date?: string;
  repeat: 'once' | 'daily' | 'weekdays' | 'plan-day';
  weekdays?: number[];
  planDay?: number;
  notificationId?: string; // Can contain comma-separated scheduled IDs for weekday reminders.
  snoozedUntil?: string;
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  unit: Unit;
  currentLevel: number;
  targetLevel: number;
  notes: string;
  color: string;
  createdAt: string;
  plan: PlanDay[];
  sore: boolean;
  pairedWith?: string;
  reminders: string[];
}

export interface GymExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  unit: Unit;
  restSeconds: number;
  pairedWith?: string;
  notes?: string;
}

export interface GymDay {
  id: string;
  dayOfWeek: number;
  name: string;
  exercises: GymExercise[];
  rest: boolean;
}

export interface GymTemplate {
  id: string;
  name: string;
  description: string;
  days: GymDay[];
  starter: boolean;
  createdAt: string;
}

export interface GymLogEntry {
  id: string;
  date: string;
  templateId: string;
  dayId: string;
  exerciseId: string;
  sets: LogSet[];
  notes: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  height: number;
  heightUnit: 'cm' | 'in';
  createdAt: string;
  exercises: Exercise[];
  gymTemplates: GymTemplate[];
  activeGymTemplateId?: string;
  gymLogs: GymLogEntry[];
  reminders: Reminder[];
  achievements: string[];
  completedDates: string[];
  lastExportAt?: string;
  lastBackupReminderAt?: string;
}

export interface NotificationPrefs {
  exerciseReminders: boolean;
  streakRisk: boolean;
  gymDay: boolean;
  restTimer: boolean;
  testDeload: boolean;
  backup: boolean;
  streakRiskHour: number;
  gymDayLeadHours: number;
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  unit: 'kg' | 'lb';
  biometricLock: boolean;
  notifications: NotificationPrefs;
  notificationPermission: 'unknown' | 'granted' | 'denied';
}

export interface AppState {
  version: 1;
  onboardingComplete: boolean;
  activeProfileId?: string;
  profiles: Profile[];
  settings: AppSettings;
  lastMode: Mode;
  lastTabs: Record<Mode, string>;
}
