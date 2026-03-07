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

  test('loadAchievements migrates legacy object.achievements format', async () => {
    const nowSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-03-01T00:00:00.000Z');

    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify({
        achievements: [
          { id: 'b1', date: '2026-03-01', title: 'legacy-1' },
          { id: 'b2', title: 'missing-date' },
        ],
      })
    );

    const data = await loadAchievements();
    expect(Object.keys(data)).toEqual(['2026-03-01']);
    expect(data['2026-03-01'][0]).toMatchObject({
      id: 'b1',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });

    nowSpy.mockRestore();
  });

  test('loadAchievements throws when save on migration fails', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify({
        '2026-03-01': [{ id: 'c1', date: '2026-03-01', title: 'ok' }],
      })
    );
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk-full'));

    await expect(loadAchievements()).rejects.toThrow('disk-full');
    expect(warnSpy).toHaveBeenCalledWith(
      `Failed to save key=${STORAGE_KEYS.achievementStore}`,
      expect.any(Error)
    );

    setItemSpy.mockRestore();
  });

  test('loadAchievements ignores malformed map entries that are not arrays', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify({
        '2026-03-01': { id: 'z1', date: '2026-03-01', title: 'broken' },
      })
    );

    const data = await loadAchievements();
    expect(data).toEqual({});
  });

  test('loadAchievements returns empty store when no raw data exists', async () => {
    const data = await loadAchievements();
    expect(data).toEqual({});
  });

  test('loadAchievements skips array entries without date key', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify([
        { id: 'x1', title: 'missing-date' },
      ])
    );

    const data = await loadAchievements();
    expect(data).toEqual({});
  });

  test('loadAchievements skips empty normalized lists when map entry has no valid records', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify({
        '2026-01-10': [{ title: 'missing-date' }],
      })
    );

    const result = await loadAchievements();
    expect(result).toEqual({});
  });

  test('loadAchievements skips empty map lists and does not create a date key', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.achievementStore,
      JSON.stringify({
        '2026-01-10': [],
      })
    );

    const data = await loadAchievements();
    expect(data).toEqual({});
  });

});
