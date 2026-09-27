import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mode } from '../types';
import { useApp } from '../context/AppProvider';
import { useColors } from './ui';
export default function ModeSwitch() { const { state, setMode } = useApp(); const c = useColors(state.settings.theme); return <View style={[styles.wrap, { backgroundColor: c.input, borderColor: c.border }]}><Pressable onPress={() => setMode('calisthenics')} style={[styles.item, state.lastMode === 'calisthenics' && { backgroundColor: c.surface }]} accessibilityRole="tab" accessibilityState={{ selected: state.lastMode === 'calisthenics' }}><Text style={{ color: c.text, fontWeight: '800' }}>Calisthenics</Text></Pressable><Pressable onPress={() => setMode('gym')} style={[styles.item, state.lastMode === 'gym' && { backgroundColor: c.surface }]} accessibilityRole="tab" accessibilityState={{ selected: state.lastMode === 'gym' }}><Text style={{ color: c.text, fontWeight: '800' }}>Gym</Text></Pressable></View>; }
const styles = StyleSheet.create({ wrap: { flexDirection: 'row', borderWidth: 1, padding: 3, borderRadius: 14, marginBottom: 14 }, item: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 } });
