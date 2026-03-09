import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock('../src/services/achievementService', () => ({
  cleanupReplacedPhotoAsync: jest.fn(async () => undefined),
  removeAchievementPhotoAsync: jest.fn(async () => undefined),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'rec-fixed-id'),
}));

import { AppStateProvider, useAppState, UserSettings } from '../src/state/AppStateContext';
import { AchievementsProvider, useAchievements } from '../src/state/AchievementsContext';
import { cleanupReplacedPhotoAsync, removeAchievementPhotoAsync } from '../src/services/achievementService';

const settings: UserSettings = {
  showCorrectedUntilMonths: 24,
  ageFormat: 'ymd',
  showDaysSinceBirth: true,
  lastViewedMonth: null,
};

describe('AchievementsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('useAchievements throws outside provider', () => {
    const Probe = () => {
      useAchievements();
      return <Text>ng</Text>;
    };

    expect(() => render(<Probe />)).toThrow('useAchievements must be used within AchievementsProvider');
  });

  test('upsert warns when active user missing', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(achCtx).not.toBeNull());
    await act(async () => {
      await achCtx!.upsert({ date: '2026-01-10', title: 'x' });
    });

    expect(warnSpy).toHaveBeenCalledWith('upsert skipped: active user not set');
  });

  test('upsert errors when date is invalid', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let appCtx: ReturnType<typeof useAppState> | null = null;
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      appCtx = useAppState();
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(appCtx?.loading).toBe(false));
    await act(async () => {
      await appCtx!.addUser({ name: 'Baby', birthDate: '2025-01-01', dueDate: null, settings, id: 'u1' });
      await appCtx!.setActiveUser('u1');
    });

    await act(async () => {
      await achCtx!.upsert({ date: '2026/01/10', title: 'x' });
    });

    expect(errorSpy).toHaveBeenCalledWith('Invalid date format in upsert: 2026/01/10');
  });

  test('upsert adds new and updates existing; cleanup called including null photo removal', async () => {
    let appCtx: ReturnType<typeof useAppState> | null = null;
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      appCtx = useAppState();
      achCtx = useAchievements();
      return <Text>{achCtx.store['2026-01-10']?.length ?? 0}</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(appCtx?.loading).toBe(false));
    await act(async () => {
      await appCtx!.addUser({ name: 'Baby', birthDate: '2025-01-01', dueDate: null, settings, id: 'u1' });
      await appCtx!.setActiveUser('u1');
    });

    await act(async () => {
      await achCtx!.upsert({ date: '2026-01-10', title: 'new rec', photoPath: '/new.jpg' });
    });

    expect(appCtx!.state.achievements.u1).toHaveLength(1);
    expect(cleanupReplacedPhotoAsync).toHaveBeenNthCalledWith(1, undefined, '/new.jpg');

    await act(async () => {
      await achCtx!.upsert({ id: 'rec-fixed-id', date: '2026-01-10', title: 'updated', photoPath: null });
    });

    expect(appCtx!.state.achievements.u1[0].photoPath).toBeUndefined();
    expect(cleanupReplacedPhotoAsync).toHaveBeenNthCalledWith(2, '/new.jpg', null);
  });

  test('remove warns without active user', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(achCtx).not.toBeNull());
    await act(async () => {
      await achCtx!.remove('id1', '2026-01-10');
    });

    expect(warnSpy).toHaveBeenCalledWith('remove skipped: active user not set');
  });

  test('remove deletes achievement and photo when photo exists', async () => {
    let appCtx: ReturnType<typeof useAppState> | null = null;
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      appCtx = useAppState();
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(appCtx?.loading).toBe(false));
    await act(async () => {
      await appCtx!.addUser({ name: 'Baby', birthDate: '2025-01-01', dueDate: null, settings, id: 'u1' });
      await appCtx!.setActiveUser('u1');
      await appCtx!.addAchievement('u1', {
        id: 'a1',
        date: '2026-01-10',
        title: 'x',
        photoPath: '/photo.jpg',
        createdAt: '2026-01-10T00:00:00.000Z',
      });
    });

    await act(async () => {
      await achCtx!.remove('a1', '2026-01-10');
    });

    expect(appCtx!.state.achievements.u1).toEqual([]);
    expect(removeAchievementPhotoAsync).toHaveBeenCalledWith('/photo.jpg');
  });

  test('loadDay/loadMonth resolve and error branches are handled in upsert/remove failures', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let appCtx: ReturnType<typeof useAppState> | null = null;
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      appCtx = useAppState();
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(appCtx?.loading).toBe(false));
    await achCtx!.loadDay('2026-01-10');
    await achCtx!.loadMonth('2026-01');

    await act(async () => {
      await appCtx!.addUser({ name: 'Baby', birthDate: '2025-01-01', dueDate: null, settings, id: 'u1' });
      await appCtx!.setActiveUser('u1');
    });

    (cleanupReplacedPhotoAsync as jest.Mock).mockRejectedValueOnce(new Error('cleanup-fail'));
    await act(async () => {
      await achCtx!.upsert({ date: '2026-01-10', title: 'will-fail' });
    });
    expect(errorSpy).toHaveBeenCalledWith('upsert failed:', expect.any(Error));

    await act(async () => {
      await appCtx!.addAchievement('u1', {
        id: 'x1',
        date: '2026-01-10',
        title: 'remove-target',
        photoPath: '/remove.jpg',
        createdAt: 't',
      } as any);
    });
    (removeAchievementPhotoAsync as jest.Mock).mockRejectedValueOnce(new Error('remove-fail'));
    await act(async () => {
      await achCtx!.remove('x1', '2026-01-10');
    });
    expect(errorSpy).toHaveBeenCalledWith('remove failed:', expect.any(Error));
  });

  test('derives empty activeAchievements/monthCounts when active bucket is missing and remove skips photo cleanup without photoPath', async () => {
    let appCtx: ReturnType<typeof useAppState> | null = null;
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      appCtx = useAppState();
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(appCtx?.loading).toBe(false));

    await act(async () => {
      await appCtx!.addUser({ name: 'Baby', birthDate: '2025-01-01', dueDate: null, settings, id: 'u1' });
      await appCtx!.setActiveUser('u1');
      await appCtx!.addAchievement('u2', {
        id: 'cross-month-1',
        date: '2026-01-10',
        title: 'x',
        createdAt: 't',
      } as any);
      await appCtx!.addAchievement('u2', {
        id: 'cross-month-2',
        date: '2026-02-11',
        title: 'y',
        createdAt: 't',
      } as any);
    });

    expect(achCtx!.store).toEqual({});
    expect(achCtx!.monthCounts).toEqual({});

    await act(async () => {
      await appCtx!.addAchievement('u1', {
        id: 'no-photo',
        date: '2026-01-10',
        title: 'no-photo',
        createdAt: 't',
      } as any);
    });

    await act(async () => {
      await achCtx!.remove('no-photo', '2026-01-10');
    });

    expect(removeAchievementPhotoAsync).not.toHaveBeenCalledWith(undefined);
  });

  test('monthCounts creates month key once and aggregates multiple day counts for active user', async () => {
    let appCtx: ReturnType<typeof useAppState> | null = null;
    let achCtx: ReturnType<typeof useAchievements> | null = null;

    const Probe = () => {
      appCtx = useAppState();
      achCtx = useAchievements();
      return <Text>ok</Text>;
    };

    render(
      <AppStateProvider>
        <AchievementsProvider>
          <Probe />
        </AchievementsProvider>
      </AppStateProvider>
    );

    await waitFor(() => expect(appCtx?.loading).toBe(false));

    await act(async () => {
      await appCtx!.addUser({ name: 'Baby', birthDate: '2025-01-01', dueDate: null, settings, id: 'u1' });
      await appCtx!.setActiveUser('u1');
      await appCtx!.addAchievement('u1', {
        id: 'a-jan-1',
        date: '2026-01-10',
        title: 'x',
        createdAt: 't',
      } as any);
      await appCtx!.addAchievement('u1', {
        id: 'a-jan-2',
        date: '2026-01-12',
        title: 'y',
        createdAt: 't',
      } as any);
      await appCtx!.addAchievement('u1', {
        id: 'a-feb-1',
        date: '2026-02-11',
        title: 'z',
        createdAt: 't',
      } as any);
    });

    expect(achCtx!.monthCounts).toEqual({
      '2026-01': { '2026-01-10': 1, '2026-01-12': 1 },
      '2026-02': { '2026-02-11': 1 },
    });
  });

});
