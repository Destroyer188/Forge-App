import React from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Screen, useColors } from '../components/ui';
import { useApp } from '../context/AppProvider';
export default function LockScreen() { const { authenticate } = useApp(); const c = useColors(); const unlock = async () => { const ok = await authenticate(); if (!ok) Alert.alert('Unlock failed', 'Use your device biometric method and try again.'); }; return <Screen scroll={false}><View style={{ flex: 1, justifyContent: 'center' }}><Card><Text style={{ fontSize: 36, fontWeight: '900', color: c.text }}>Forge is locked</Text><Text style={{ color: c.muted, lineHeight: 22, marginTop: 8, marginBottom: 20 }}>Your personal logs and progress photos are behind your device biometric lock.</Text><Button title="Unlock with biometrics" onPress={unlock} /></Card></View></Screen>; }
