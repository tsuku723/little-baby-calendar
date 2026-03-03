import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadAchievements, loadUserSettings, STORAGE_KEYS } from '../src/storage/storage';

describe('storage module exports', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  test('loadUserSettings merges defaults with stored partial settings', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.userSettings,
      JSON.stringify({ ageFormat: 'md', birthDate: '2025-01-01' })
    );

    const settings = await loadUserSettings();
    expect(settings.ageFormat).toBe('md');
    expect(settings.showDaysSinceBirth).toBe(true);
    expect(settings.birthDate).toBe('2025-01-01');
  });

  test('loadUserSettings falls back when broken JSON is stored', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await AsyncStorage.setItem(STORAGE_KEYS.userSettings, '{broken-json');

    const settings = await loadUserSettings();
    expect(settings.ageFormat).toBe('ymd');
    expect(warnSpy).toHaveBeenCalled();
  });

  test('loadAchievements migrates legacy array, normalizes keys and writes back', async () => {
    const nowSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-02-01T00:00:00.000Z');

    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify([
        { id: 'a1', date: '2026-2-1', title: 'x' },
        { id: 'a2', date: '2026-02-01', title: 'y', createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'a3', date: 'invalid-date', title: 'z' },
      ])
    );

    const data = await loadAchievements();
    expect(Object.keys(data)).toEqual(['2026-02-01']);
    expect(data['2026-02-01']).toHaveLength(1);
    expect(data['2026-02-01'][0].updatedAt).toBe('2026-02-01T00:00:00.000Z');

    const saved = await AsyncStorage.getItem(STORAGE_KEYS.achievementStore);
    expect(saved).toContain('2026-02-01');

    nowSpy.mockRestore();
  });
});
