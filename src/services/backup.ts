import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { AppState } from '../types';

export async function exportBackup(state: AppState) {
  try {
    const file = new File(Paths.cache, `forge-backup-${new Date().toISOString().slice(0, 10)}.json`);
    file.create({ overwrite: true });
    file.write(JSON.stringify(state, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Forge backup' });
    return file.uri;
  } catch (error) {
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

export async function importBackup(): Promise<AppState> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled) throw new Error('Import cancelled.');
  try {
    const file = new File(result.assets[0].uri);
    const raw = await file.text();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 1 || !Array.isArray(parsed.profiles) || !parsed.settings) throw new Error('This is not a valid Forge v1 backup.');
    return parsed;
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'invalid backup'}`);
  }
}
