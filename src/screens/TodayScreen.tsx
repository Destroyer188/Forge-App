import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Header, Screen, Stepper, useColors } from '../components/ui';
import { useApp } from '../context/AppProvider';
import { localDate } from '../utils/date';
import { calculateStreak } from '../utils/stats';
import { cancelNotification, scheduleRestTimer } from '../services/notifications';
import * as Haptics from 'expo-haptics';

function RestTimer() {
  const { state } = useApp(); const c = useColors(state.settings.theme); const [seconds, setSeconds] = useState(0); const [endTime, setEndTime] = useState<number | null>(null); const [notificationId, setNotificationId] = useState<string>();
  useEffect(() => { if (!endTime) return; const id = setInterval(() => { const remain = Math.max(0, Math.ceil((endTime - Date.now()) / 1000)); setSeconds(remain); if (remain <= 0) { clearInterval(id); setEndTime(null); setNotificationId(undefined); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); } }, 250); return () => clearInterval(id); }, [endTime]);
  const start = async (duration: number) => { const end = Date.now() + duration * 1000; setEndTime(end); setSeconds(duration); const id = await scheduleRestTimer(end); setNotificationId(id); };
  const stop = async () => { await cancelNotification(notificationId); setEndTime(null); setSeconds(0); setNotificationId(undefined); };
  return <Card><Text style={{ color: c.muted, fontWeight: '800' }}>REST TIMER</Text><Text style={{ color: c.text, fontSize: 42, fontWeight: '900', marginVertical: 4 }}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</Text><View style={{ flexDirection: 'row', gap: 8 }}><Button title="60s" onPress={() => start(60)} style={{ flex: 1 }} variant="secondary" /><Button title="90s" onPress={() => start(90)} style={{ flex: 1 }} variant="secondary" /><Button title={endTime ? 'Stop' : '120s'} onPress={() => endTime ? stop() : start(120)} style={{ flex: 1 }} /></View></Card>;
}

export default function TodayScreen() {
  const { state, profile } = useApp(); const navigation = useNavigation<any>(); const c = useColors(state.settings.theme);
  const streak = calculateStreak(profile?.completedDates ?? []);
  const today = localDate();
  const [quickReps, setQuickReps] = useState(0);
  const exercise = profile?.exercises.find(e => e.plan.length > 0);
  const exerciseDay = exercise?.plan.find(d => d.day === Math.min(30, ddayFor(exercise))) ?? exercise?.plan[0];
  const gymTemplate = profile?.gymTemplates.find(t => t.id === profile.activeGymTemplateId) ?? profile?.gymTemplates[0];
  const gymDay = gymTemplate?.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const title = state.lastMode === 'calisthenics' ? 'Today' : 'Gym day';
  useEffect(() => { if (exerciseDay?.workout) setQuickReps(parseInt(exerciseDay.workout, 10) || 0); }, [exerciseDay?.day]);
  return <Screen theme={state.settings.theme}><Header title={title} subtitle={`${today} • ${streak}-day streak`} right={<Text style={{ fontSize: 28 }}>🔥</Text>} />
    {state.lastMode === 'calisthenics' ? <>
      {!exercise ? <Card><Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>No plan yet</Text><Text style={{ color: c.muted, marginTop: 6, marginBottom: 14 }}>Create a calisthenics exercise to generate its 30-day plan.</Text><Button title="Go to Exercises" onPress={() => navigation.navigate('Exercises')} /></Card> : <Card style={{ borderLeftWidth: 4, borderLeftColor: exercise.color }}><Text style={{ color: c.muted, fontWeight: '800' }}>DAY {exerciseDay?.day ?? 1} • {exerciseDay?.phase?.toUpperCase()}</Text><Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginVertical: 6 }}>{exercise.name}</Text><Text style={{ color: c.text }}>{exerciseDay?.type === 'rest' ? 'Recovery day' : exerciseDay?.workout ?? 'Manual session'}</Text><Text style={{ color: c.muted, marginTop: 6 }}>{exerciseDay?.notes}</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}><Button title="Log workout" onPress={() => navigation.navigate('WorkoutLog', { exerciseId: exercise.id, day: exerciseDay?.day ?? 1 })} style={{ flex: 1 }} /><Button title="Exercise" variant="secondary" onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })} style={{ flex: 1 }} /></View><View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}><Stepper label="Quick target" value={quickReps} min={0} onChange={setQuickReps} /><View style={{ flex: 1 }} /></View></Card>}
    </> : <>
      {!gymTemplate || !gymDay || gymDay.rest ? <Card><Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>{gymDay?.name ?? 'Rest day'}</Text><Text style={{ color: c.muted, marginTop: 6 }}>No workout scheduled today.</Text></Card> : <Card><Text style={{ color: c.muted, fontWeight: '800' }}>ACTIVE TEMPLATE</Text><Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginVertical: 6 }}>{gymDay.name}</Text><Text style={{ color: c.muted, marginBottom: 14 }}>{gymDay.exercises.length} exercises • {gymTemplate.name}</Text>{gymDay.exercises.slice(0, 5).map(ex => <View key={ex.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border }}><Text style={{ color: c.text, fontWeight: '700' }}>{ex.name}</Text><Text style={{ color: c.muted }}>{ex.sets} × {ex.reps}</Text></View>)}<View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Button title="Start workout" onPress={() => navigation.navigate('GymWorkoutLog', { templateId: gymTemplate.id, dayId: gymDay.id })} style={{ flex: 1 }} /><Button title="Templates" variant="secondary" onPress={() => navigation.navigate('Exercises')} style={{ flex: 1 }} /></View></Card>}
    </>}
    <RestTimer />
    <Card><Text style={{ color: c.muted, fontWeight: '800' }}>COACH</Text><Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginTop: 5 }}>Need a quick answer?</Text><Text style={{ color: c.muted, marginVertical: 8 }}>Ask about today, soreness, logging, progression, or estimated 1RM.</Text><Button title="Open coach" variant="secondary" onPress={() => navigation.navigate('Coach')} /></Card>
  </Screen>;
}
function ddayFor(exercise: any) { const next = exercise.plan.find((d: any) => !d.completed); return next?.day ?? 30; }
