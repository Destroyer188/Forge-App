import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Screen, useColors } from '../components/ui';
import { useApp } from '../context/AppProvider';
export default function OnboardingScreen() {
  const { completeOnboarding } = useApp(); const c = useColors();
  const [name, setName] = useState(''); const [age, setAge] = useState('18'); const [height, setHeight] = useState('170'); const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const submit = async () => { if (!name.trim() || Number(age) < 1 || Number(height) <= 0) { Alert.alert('Complete your profile', 'Enter a name, valid age, and height.'); return; } await completeOnboarding({ name: name.trim(), age: Number(age), height: Number(height), heightUnit }); };
  return <Screen theme="system"><View style={{ paddingTop: 40 }}><Text style={{ fontSize: 54, fontWeight: '900', color: c.text }}>Forge</Text><Text style={{ fontSize: 18, color: c.muted, marginTop: 6, marginBottom: 30 }}>Train consistently. Track honestly.</Text><Card><Field label="Name" value={name} onChangeText={setName} placeholder="Your name" /><Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" /><Field label="Height" value={height} onChangeText={setHeight} keyboardType="decimal-pad" /><Text style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>Height unit</Text><View style={{ flexDirection: 'row' }}><Chip label="cm" selected={heightUnit === 'cm'} onPress={() => setHeightUnit('cm')} /><Chip label="in" selected={heightUnit === 'in'} onPress={() => setHeightUnit('in')} /></View><Text style={{ color: c.muted, lineHeight: 20, marginBottom: 16 }}>Forge will ask for notification permission next so reminders and rest-timer alerts can work. You can change notification categories later in Settings.</Text><Button title="Create my profile" onPress={submit} /></Card></View></Screen>;
}
