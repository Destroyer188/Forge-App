import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppProvider';
import RootNavigator from './src/navigation/RootNavigator';

function AppShell() { const { state } = useApp(); return <><StatusBar style={state.settings.theme === 'dark' ? 'light' : state.settings.theme === 'light' ? 'dark' : 'auto'} /><RootNavigator /></>; }
export default function App() { return <SafeAreaProvider><AppProvider><AppShell /></AppProvider></SafeAreaProvider>; }
