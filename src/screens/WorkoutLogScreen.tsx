import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Card, Field, Header, Screen, Stepper, useColors } from '../components/ui';
import { useApp } from '../context/AppProvider';
import { LogSet } from '../types';
import { localDate } from '../utils/date';
import { uid } from '../utils/uuid';

export default function WorkoutLogScreen() {
  const route = useRoute<any>(); const nav = useNavigation<any>(); const { profile, state, logExercise, haptic } = useApp(); const c = useColors(state.settings.theme); const ex = profile?.exercises.find(e => e.id === route.params.exerciseId); const day = ex?.plan.find(d => d.day === route.params.day); const [sets, setSets] = useState<LogSet[]>([{ reps: Math.max(0, Number((day?.workout ?? '0').split(' ')[0]) || 0), rir: day?.rirTarget ?? 2 }]); const [notes, setNotes] = useState('');
  const updateSet = (index: number, patch: Partial<LogSet>) => setSets(old => old.map((s, i) => i === index ? { ...s, ...patch } : s));
  const addSet = () => setSets(s => [...s, { reps: s[s.length - 1]?.reps ?? 0, rir: s[s.length - 1]?.rir ?? 2 }]);
  const save = async () => { if (!ex || !day || day.type === 'rest') return Alert.alert('Nothing to log', 'This plan day is a rest day.'); const log = { id: uid('log'), date: localDate(), sets, notes, type: 'calisthenics' as const }; await logExercise(ex.id, day.day, log); haptic('success'); Alert.alert('Logged', 'Workout saved locally.'); nav.goBack(); };
  if (!ex || !day) return <Screen><Header title="Log" /><Text style={{ color: c.text }}>Workout day not found.</Text></Screen>;
  return <Screen theme={state.settings.theme}><Header title={`Day ${day.day} — ${ex.name}`} subtitle={`${day.type} • target RIR ${day.rirTarget}`} /><Card><Text style={{ color: c.muted }}>{day.notes}</Text></Card>{sets.map((s, i) => <Card key={i}><Text style={{ color: c.text, fontSize: 16, fontWeight: '900' }}>Set {i + 1}</Text><View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}><Stepper label="Reps" value={s.reps} min={0} onChange={v => updateSet(i, { reps: v })} /><Stepper label="RIR" value={s.rir} min={0} max={4} onChange={v => updateSet(i, { rir: v })} /></View></Card>)}<Button title="+ Add set" variant="secondary" onPress={addSet} /><Card style={{ marginTop: 12 }}><Field label="Notes" value={notes} onChangeText={setNotes} multiline /></Card><Button title="Save workout" onPress={save} /></Screen>;
}
