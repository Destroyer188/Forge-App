import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Card, Header, Screen, Stepper, useColors } from '../components/ui';
import { useApp } from '../context/AppProvider';
import { LogSet } from '../types';
import { localDate } from '../utils/date';
import { uid } from '../utils/uuid';
import { epley1RM } from '../utils/stats';

export default function GymWorkoutLogScreen() {
  const { profile, state, logGym, haptic } = useApp(); const c = useColors(state.settings.theme); const nav = useNavigation(); const route = useRoute<any>();
  const template = profile?.gymTemplates.find(t => t.id === route.params?.templateId) ?? profile?.gymTemplates.find(t => t.id === profile?.activeGymTemplateId) ?? profile?.gymTemplates[0];
  const day = template?.days.find(d => d.id === route.params?.dayId) ?? template?.days[(new Date().getDay() + 6) % 7];
  const [values, setValues] = useState<Record<string, LogSet[]>>(() => Object.fromEntries((day?.exercises ?? []).map(ex => [ex.id, [{ reps: ex.reps, rir: 2, weight: ex.weight ?? 0 }]])));
  if (!template || !day) return <Screen><Header title="Gym log" /><Text style={{ color: c.text }}>No gym day found.</Text></Screen>;
  const updateSet = (id: string, index: number, patch: Partial<LogSet>) => setValues(v => ({ ...v, [id]: (v[id] ?? []).map((s, i) => i === index ? { ...s, ...patch } : s) }));
  const addSet = (id: string) => setValues(v => ({ ...v, [id]: [...(v[id] ?? []), { ...(v[id]?.[v[id].length - 1] ?? { reps: 8, rir: 2, weight: 0 }) }] }));
  const save = async () => { for (const ex of day.exercises) { const sets = values[ex.id] ?? []; await logGym({ id: uid('glog'), date: localDate(), templateId: template.id, dayId: day.id, exerciseId: ex.id, sets, notes: '' }); } haptic('success'); Alert.alert('Workout saved', 'Your gym session and sets were stored.'); nav.goBack(); };
  return <Screen theme={state.settings.theme}><Header title={day.name} subtitle={template.name} />{day.exercises.map(ex => { const sets = values[ex.id] ?? []; const last = profile.gymLogs.find(l => l.exerciseId === ex.id); const suggestion = last ? `Last logged: ${last.sets.map(s => `${s.weight ?? 0} × ${s.reps}`).join(', ')}. Apply progression only when the last work was controlled.` : 'Start with a load that leaves the target RIR available.'; return <Card key={ex.id}><Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>{ex.name}</Text><Text style={{ color: c.muted, marginVertical: 5 }}>{ex.sets} × {ex.reps} • {ex.restSeconds}s rest</Text><Text style={{ color: c.muted, lineHeight: 19 }}>{suggestion}</Text>{sets.map((s, i) => <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Stepper label={`Set ${i + 1} kg`} value={s.weight ?? 0} min={0} step={2.5} onChange={v => updateSet(ex.id, i, { weight: v })} /><Stepper label="Reps" value={s.reps} min={0} onChange={v => updateSet(ex.id, i, { reps: v })} /><Stepper label="RIR" value={s.rir} min={0} max={4} onChange={v => updateSet(ex.id, i, { rir: v })} /></View>)}<Button title="+ Add set" variant="secondary" onPress={() => addSet(ex.id)} style={{ marginTop: 12 }} /><Text style={{ color: c.muted, marginTop: 8 }}>Estimated best 1RM: {Math.round(Math.max(0, ...sets.map(s => epley1RM(s.weight ?? 0, s.reps))))} {state.settings.unit}</Text></Card>; })}<Button title="Save gym workout" onPress={save} /></Screen>;
}
