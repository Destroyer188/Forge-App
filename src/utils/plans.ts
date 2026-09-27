import { ExerciseType, PlanDay, PlanDayType } from '../types';

const warmups = {
  foundation: ['2 min easy movement', 'Scapular / joint circles', '2 easy practice sets'],
  build: ['3 min movement prep', 'Joint circles + activation', '2 ramp sets'],
  peak: ['3 min easy movement', 'Specific skill practice', '2 progressive warm-up sets'],
};

function maxFloor(value: number, floor: number) { return Math.max(floor, Math.floor(value)); }
function makeDay(day: number, phase: PlanDay['phase'], type: PlanDayType, reps: number, accessory: string, rirTarget: number, notes: string): PlanDay {
  return { day, phase, type, workout: type === 'rest' ? null : `${reps} reps`, accessory, warmup: warmups[phase], rirTarget, notes, completed: false };
}

export function generate30DayPlan(type: ExerciseType, current: number, target: number): PlanDay[] {
  if (type === 'custom') {
    return Array.from({ length: 30 }, (_, index) => ({
      day: index + 1, phase: index < 10 ? 'foundation' : index < 20 ? 'build' : 'peak', type: 'workout' as const, workout: null, accessory: '', warmup: [], rirTarget: 2, notes: 'Manual custom-plan day.', completed: false
    }));
  }
  const isStrength = type === 'strength';
  const baseReps = isStrength ? maxFloor(current * 0.8, 1) : maxFloor(current * 0.6, 5);
  const buildReps = isStrength ? maxFloor(current * 1.1, 1) : maxFloor(current * 0.75, 5);
  const peakReps = isStrength ? maxFloor(target * 0.7, 1) : maxFloor(target * 0.5, 5);
  const gtgReps = isStrength ? maxFloor(current * 0.6, 1) : maxFloor(current * 0.5, 5);
  const plan: PlanDay[] = [];
  for (let day = 1; day <= 30; day++) {
    if (day <= 10) {
      if ([2, 5, 8].includes(day)) plan.push(makeDay(day, 'foundation', 'rest', 0, 'Mobility + easy walk', 4, 'Recovery day.'));
      else if (day === 10) plan.push(makeDay(day, 'foundation', 'test', Math.max(1, Math.round(target * 0.9)), 'Light core or mobility', 1, 'Test at about 90% of target intent.'));
      else plan.push(makeDay(day, 'foundation', 'workout', baseReps, '2 x 10–15 easy accessory reps', day % 2 ? 2 : 3, 'Controlled foundation volume.'));
    } else if (day <= 20) {
      if (day === 11) plan.push(makeDay(day, 'build', 'rest', 0, 'Mobility + easy walk', 4, 'Recovery before build phase.'));
      else if (day === 14) plan.push(makeDay(day, 'build', 'gtg', gtgReps, 'Easy technique practice', 3, 'Grease-the-groove style submaximal work.'));
      else if (day === 17) plan.push(makeDay(day, 'build', 'deload', Math.max(1, Math.floor(buildReps * 0.6)), 'Light mobility', 4, 'Deload at roughly 40% reduced volume.'));
      else if (day === 20) plan.push(makeDay(day, 'build', 'test', Math.max(1, Math.round(target * 0.95)), 'Light accessory only', 1, 'Second test day.'));
      else plan.push(makeDay(day, 'build', 'workout', buildReps, '3 x 8–12 accessory reps', day % 3 === 0 ? 2 : 1, 'Build volume and intensity.'));
    } else {
      if (day === 21) plan.push(makeDay(day, 'peak', 'rest', 0, 'Mobility', 4, 'Recovery before peak.'));
      else if (day <= 27) plan.push(makeDay(day, 'peak', 'workout', Math.max(1, Math.round(peakReps * (0.78 + (day - 21) * 0.035))), '2 x 6–10 accessory reps', day < 25 ? 2 : 1, 'Peak intensity.'));
      else if (day <= 29) plan.push(makeDay(day, 'peak', 'deload', Math.max(1, Math.floor(peakReps * 0.45)), 'Easy mobility', 4, 'Taper volume and stay fresh.'));
      else plan.push(makeDay(day, 'peak', 'test', target, 'Recovery only', 0, 'Final 30-day test.'));
    }
  }
  if (isStrength) {
    for (const day of [7, 24]) {
      const d = plan[day - 1];
      if (d && d.workout) d.notes += ' Add controlled negatives after the main work.';
    }
  }
  return plan;
}

export function nextPlanBlock(exercise: { type: ExerciseType; currentLevel: number; targetLevel: number; plan: PlanDay[] }): PlanDay[] {
  const completedMax = Math.max(...exercise.plan.filter(d => d.completed).map(d => d.day), 0);
  const nextCurrent = completedMax >= 30 ? Math.max(exercise.currentLevel, Math.round(exercise.targetLevel * 0.75)) : exercise.currentLevel;
  return generate30DayPlan(exercise.type, nextCurrent, exercise.targetLevel);
}
