import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Chip, Field, Header, Screen, useColors } from '../components/ui';
import { useApp } from '../context/AppProvider';
import { ExerciseType, GymTemplate } from '../types';
import { generate30DayPlan } from '../utils/plans';
import { uid } from '../utils/uuid';

export default function ExercisesScreen() {
  const { state, profile, addExercise, updateExercise, deleteExercise, addTemplate, setMode } = useApp(); const c = useColors(state.settings.theme); const navigation = useNavigation<any>();
  const [search, setSearch] = useState(''); const [adding, setAdding] = useState(false); const [name, setName] = useState(''); const [type, setType] = useState<ExerciseType>('endurance'); const [current, setCurrent] = useState('10'); const [target, setTarget] = useState('20'); const [notes, setNotes] = useState('');
  const exercises = useMemo(() => (profile?.exercises ?? []).filter(e => e.name.toLowerCase().includes(search.toLowerCase())), [profile?.exercises, search]);
  const templates = useMemo(() => (profile?.gymTemplates ?? []).filter(t => `${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase())), [profile?.gymTemplates, search]);
  const create = async () => { if (!name.trim()) return Alert.alert('Name required'); await addExercise({ name: name.trim(), type, unit: 'reps', currentLevel: Number(current) || 1, targetLevel: Number(target) || 1, notes, color: '#5B5BD6' }); setName(''); setAdding(false); };
  const clone = async (id: string) => { const src = profile?.exercises.find(e => e.id === id); if (!src) return; await addExercise({ name: `${src.name} Copy`, type: src.type, unit: src.unit, currentLevel: src.currentLevel, targetLevel: src.targetLevel, notes: src.notes, color: src.color }); };
  const deleteIt = (id: string, title: string) => Alert.alert('Delete exercise?', title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteExercise(id) }]);
  const addQuickTemplate = async () => { const starter = profile?.gymTemplates[0]; if (!starter) return; const copy: GymTemplate = { ...starter, id: uid('template'), name: `${starter.name} Copy`, starter: false, createdAt: new Date().toISOString() }; await addTemplate(copy); navigation.navigate('GymTemplateEditor', { templateId: copy.id }); };
  return <Screen theme={state.settings.theme}><Header title={state.lastMode === 'calisthenics' ? 'Exercises' : 'Gym templates'} subtitle="Search everything from one place" />
    <Field label="Global search" value={search} onChangeText={setSearch} placeholder="Exercise, template, day…" />
    {state.lastMode === 'calisthenics' ? <>
      <Button title={adding ? 'Close creator' : '+ Add exercise'} onPress={() => setAdding(!adding)} />
      {adding ? <Card style={{ marginTop: 12 }}><Field label="Name" value={name} onChangeText={setName} placeholder="Pull-up" /><Text style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>Type</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{(['endurance', 'strength', 'custom'] as ExerciseType[]).map(x => <Chip key={x} label={x} selected={type === x} onPress={() => setType(x)} />)}</View><Field label="Current level" value={current} onChangeText={setCurrent} keyboardType="number-pad" /><Field label="Target level" value={target} onChangeText={setTarget} keyboardType="number-pad" /><Field label="Notes" value={notes} onChangeText={setNotes} multiline /><Button title="Generate 30-day plan" onPress={create} /></Card> : null}
      {exercises.map(ex => <Card key={ex.id}><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 10, height: 42, borderRadius: 6, backgroundColor: ex.color, marginRight: 12 }} /><View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>{ex.name}</Text><Text style={{ color: c.muted }}>{ex.type} • {ex.plan.length ? `day ${ex.plan.find(d => !d.completed)?.day ?? 30}/30` : 'manual plan'}</Text></View></View><View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Button title="Open" onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })} style={{ flex: 1 }} /><Button title="Clone" variant="secondary" onPress={() => clone(ex.id)} style={{ flex: 1 }} /><Button title="Delete" variant="danger" onPress={() => deleteIt(ex.id, ex.name)} style={{ flex: 1 }} /></View></Card>)}
      {!exercises.length && !adding ? <Card><Text style={{ color: c.muted }}>No exercises match your search.</Text></Card> : null}
    </> : <>
      <View style={{ flexDirection: 'row', gap: 8 }}><Button title="+ New template" onPress={() => navigation.navigate('GymTemplateEditor')} style={{ flex: 1 }} /><Button title="Clone starter" variant="secondary" onPress={addQuickTemplate} style={{ flex: 1 }} /></View>
      {templates.map(t => <Card key={t.id}><Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{t.name}</Text><Text style={{ color: c.muted, marginTop: 4 }}>{t.description}</Text><Text style={{ color: c.muted, marginTop: 8 }}>{t.days.filter(d => !d.rest).length} workout days</Text><Button title="Edit template" onPress={() => navigation.navigate('GymTemplateEditor', { templateId: t.id })} style={{ marginTop: 12 }} /></Card>)}
    </>}
    <Button title={`Switch to ${state.lastMode === 'gym' ? 'Calisthenics' : 'Gym'} mode`} variant="ghost" onPress={() => setMode(state.lastMode === 'gym' ? 'calisthenics' : 'gym')} style={{ marginTop: 6 }} />
  </Screen>;
}
