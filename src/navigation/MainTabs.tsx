import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TodayScreen from '../screens/TodayScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import RemindersScreen from '../screens/RemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useApp } from '../context/AppProvider';
import ModeSwitch from '../components/ModeSwitch';
import { Button } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../components/ui';

const Tab = createBottomTabNavigator();
const icons: Record<string, string> = { Today: '◉', Exercises: '▦', Progress: '↗', Reminders: '◷', Settings: '⚙' };

export default function MainTabs() {
  const { state, setTab } = useApp(); const c = useColors(state.settings.theme);
  const screenListener = (name: string) => ({ focus: () => { void setTab(state.lastMode, name); } });
  return <View style={{ flex: 1, backgroundColor: c.bg }}><View style={{ paddingTop: 8, paddingHorizontal: 18, backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ flex: 1 }}><ModeSwitch /></View><ButtonLikeSearch /></View><Tab.Navigator key={state.lastMode} initialRouteName={state.lastTabs[state.lastMode] ?? 'Today'} screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: c.text, tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 66, paddingBottom: 8, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '800' }, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{icons[route.name] ?? '•'}</Text> })}>
    <Tab.Screen name="Today" component={TodayScreen} listeners={screenListener('Today')} />
    <Tab.Screen name="Exercises" component={ExercisesScreen} listeners={screenListener('Exercises')} />
    <Tab.Screen name="Progress" component={ProgressScreen} listeners={screenListener('Progress')} />
    <Tab.Screen name="Reminders" component={RemindersScreen} listeners={screenListener('Reminders')} />
    <Tab.Screen name="Settings" component={SettingsScreen} listeners={screenListener('Settings')} />
  </Tab.Navigator></View>;
}

function ButtonLikeSearch() { const navigation = useNavigation<any>(); return <Button title="Search" variant="secondary" onPress={() => navigation.navigate('Exercises')} accessibilityLabel="Open global search" />; }
