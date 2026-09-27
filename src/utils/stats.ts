import { Exercise, GymLogEntry } from '../types';
import { daysBetween, localDate } from './date';

export function calculateStreak(completedDates: string[], today = localDate()): number {
  const set = new Set(completedDates);
  let cursor = today;
  if (!set.has(cursor)) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    cursor = localDate(yesterday);
  }
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    const d = new Date(`${cursor}T12:00:00`); d.setDate(d.getDate() - 1);
    cursor = localDate(d);
  }
  return streak;
}

export function totalLoggedSets(exercises: Exercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.plan.reduce((s, d) => s + (d.log?.sets.length ?? 0), 0), 0);
}

export function epley1RM(weight: number, reps: number): number { return reps <= 0 ? 0 : weight * (1 + reps / 30); }
export function weeklyVolume(logs: GymLogEntry[], weekStart: string): number {
  return logs.filter(l => daysBetween(weekStart, l.date) >= 0 && daysBetween(weekStart, l.date) < 7)
    .reduce((sum, l) => sum + l.sets.reduce((s, set) => s + set.reps * (set.weight ?? 0), 0), 0);
}
export function milestoneLabel(streak: number): string | null {
  if ([7, 14, 30, 60, 100].includes(streak)) return `${streak}-day streak`;
  return null;
}
