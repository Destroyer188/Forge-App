import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '../types';

const KEY = 'forge.app.v1';

export async function loadAppState(): Promise<AppState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as AppState : null;
  } catch (error) {
    console.warn('Forge load failed', error);
    return null;
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    throw new Error(`Could not save Forge data: ${error instanceof Error ? error.message : 'unknown storage error'}`);
  }
}

export async function clearAppState(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch (error) { throw new Error('Could not clear Forge data.'); }
}
