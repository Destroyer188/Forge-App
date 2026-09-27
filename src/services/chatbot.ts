import { AppState, Mode } from '../types';
import * as SecureStore from 'expo-secure-store';

const KEY = 'forge.coach.apiKey';

export async function saveCoachApiKey(value: string) { if (value.trim()) await SecureStore.setItemAsync(KEY, value.trim()); else await SecureStore.deleteItemAsync(KEY); }
export async function getCoachApiKey() { return SecureStore.getItemAsync(KEY); }

export function ruleBasedReply(message: string, state: AppState, mode: Mode): string {
  const p = state.profiles.find(x => x.id === state.activeProfileId);
  if (!p) return 'Finish onboarding first and I can use your real Forge data.';
  const q = message.toLowerCase();
  const streak = p.completedDates.length;
  if (q.includes('streak')) return `Your current tracked completion history has ${streak} logged day(s). I can also help you plan around the next workout.`;
  if (q.includes('today')) return mode === 'calisthenics' ? 'Open Today to see your active 30-day plan day and log it set by set.' : 'Open Today to see the active gym template day and quick-log your sets.';
  if (q.includes('sore') || q.includes('pain')) return 'Mark the exercise as sore in its detail screen. Forge will expose substitution guidance instead of silently changing your plan.';
  if (q.includes('1rm')) return 'For gym work, Forge uses the Epley estimate: 1RM ≈ weight × (1 + reps / 30).';
  return `I’m your offline Forge coach. I know you have ${p.exercises.length} calisthenics exercise(s) and ${p.gymTemplates.length} gym template(s). Ask about today, streaks, soreness, logging, or 1RM estimates.`;
}
