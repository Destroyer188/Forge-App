import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppProvider';
import OnboardingScreen from '../screens/OnboardingScreen';
import LockScreen from '../screens/LockScreen';
import MainTabs from './MainTabs';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import WorkoutLogScreen from '../screens/WorkoutLogScreen';
import GymTemplateEditorScreen from '../screens/GymTemplateEditorScreen';
import GymWorkoutLogScreen from '../screens/GymWorkoutLogScreen';
import CoachScreen from '../screens/CoachScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Lock: undefined;
  Main: undefined;
  ExerciseDetail: { exerciseId: string };
  WorkoutLog: { exerciseId: string; day: number };
  GymTemplateEditor: { templateId?: string };
  GymWorkoutLog: { templateId?: string; dayId?: string };
  Coach: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();

function NotificationBridge() {
  const navigation = useNavigation<any>(); const { profile } = useApp();
  useEffect(() => {
    const go = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (data?.exerciseId && profile?.exercises.some(e => e.id === data.exerciseId)) {
        const exercise = profile.exercises.find(e => e.id === data.exerciseId)!;
        const day = data.day ?? exercise.plan.find(d => !d.completed)?.day ?? 1;
        navigation.navigate('WorkoutLog', { exerciseId: exercise.id, day });
      }
    };
    Notifications.getLastNotificationResponseAsync().then(r => { if (r) go(r); }).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => sub.remove();
  }, [navigation, profile?.id]);
  return null;
}

export default function RootNavigator() {
  const { state, loading, locked } = useApp();
  if (loading) return null;
  return <NavigationContainer linking={{ prefixes: ['forge://'] }}><NotificationBridge /><Stack.Navigator screenOptions={{ headerShown: false }}>
    {!state.onboardingComplete ? <Stack.Screen name="Onboarding" component={OnboardingScreen} /> : locked ? <Stack.Screen name="Lock" component={LockScreen} /> : <>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="WorkoutLog" component={WorkoutLogScreen} />
      <Stack.Screen name="GymTemplateEditor" component={GymTemplateEditorScreen} />
      <Stack.Screen name="GymWorkoutLog" component={GymWorkoutLogScreen} />
      <Stack.Screen name="Coach" component={CoachScreen} />
    </>}
  </Stack.Navigator></NavigationContainer>;
}
