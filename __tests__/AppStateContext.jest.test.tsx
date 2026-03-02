import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: any[]) => mockGetItem(...args),
    setItem: (...args: any[]) => mockSetItem(...args),
    removeItem: (...args: any[]) => mockRemoveItem(...args),
  },
}));

const mockLoadUserSettings = jest.fn();
const mockLoadAchievements = jest.fn();

jest.mock('../src/storage/storage', () => ({
  STORAGE_KEYS: {
    userSettings: 'legacy_settings',
    achievementStore: 'legacy_achievements',
  },
  loadUserSettings: (...args: any[]) => mockLoadUserSettings(...args),
  loadAchievements: (...args: any[]) => mockLoadAchievements(...args),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'uuid-fixed'),
}));

import {
  AppStateProvider,
  useAppState,
  useAchievements,
  useActiveUser,
  UserSettings,
} from '../src/state/AppStateContext';

const settings: UserSettings = {
  showCorrectedUntilMonths: 24,
  ageFormat: 'ymd',
  showDaysSinceBirth: true,
  lastViewedMonth: null,
};

describe('AppStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    mockRemoveItem.mockReset();
    mockLoadUserSettings.mockReset();
    mockLoadAchievements.mockReset();
  });

  test('useAppState throws outside provider', () => {
    const Probe = () => {
      useAppState();
      return <Text>ng</Text>;
    };
    expect(() => render(<Probe />)).toThrow('useAppState must be used within AppStateProvider');
  });

  test('initial load uses APP_STATE_KEY JSON and sets loading false', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({
        users: [{ id: 'u1', name: 'A', birthDate: '2025-01-01', dueDate: null, settings, createdAt: '2025-01-01T00:00:00.000Z' }],
        activeUserId: 'u1',
        achievements: { u1: [] },
      })
    );

    let captured: ReturnType<typeof useAppState> | null = null;
    const Probe = () => {
      captured = useAppState();
      return <Text>ok</Text>;
    };

    render(<AppStateProvider><Probe /></AppStateProvider>);

    await waitFor(() => expect(captured?.loading).toBe(false));
    expect(captured?.state.activeUserId).toBe('u1');
    expect(captured?.state.users).toHaveLength(1);
  });

  test('addUser creates achievement list and sets active when null', async () => {
    mockGetItem.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    let captured: ReturnType<typeof useAppState> | null = null;
    const Probe = () => {
      captured = useAppState();
      return <Text>ok</Text>;
    };

    render(<AppStateProvider><Probe /></AppStateProvider>);
    await waitFor(() => expect(captured?.loading).toBe(false));

    await act(async () => {
      await captured!.addUser({
        name: 'Baby',
        birthDate: '2025-01-01',
        dueDate: null,
        settings,
      });
    });

    expect(captured!.state.users.map((u) => u.id)).toContain('uuid-fixed');
    expect(captured!.state.achievements['uuid-fixed']).toEqual([]);
    expect(captured!.state.activeUserId).toBe('uuid-fixed');
  });

  test('setActiveUser ignores unknown user id', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({
        users: [
          { id: 'u1', name: 'A', birthDate: '2025-01-01', dueDate: null, settings, createdAt: 't' },
          { id: 'u2', name: 'B', birthDate: '2025-01-02', dueDate: null, settings, createdAt: 't' },
        ],
        activeUserId: 'u1',
        achievements: { u1: [], u2: [] },
      })
    );

    let captured: ReturnType<typeof useAppState> | null = null;
    const Probe = () => {
      captured = useAppState();
      return <Text>ok</Text>;
    };

    render(<AppStateProvider><Probe /></AppStateProvider>);
    await waitFor(() => expect(captured?.loading).toBe(false));

    await act(async () => {
      await captured!.setActiveUser('missing');
    });

    expect(captured!.state.activeUserId).toBe('u1');
  });

  test('deleteUser switches active to next user or null', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({
        users: [
          { id: 'u1', name: 'A', birthDate: '2025-01-01', dueDate: null, settings, createdAt: 't' },
          { id: 'u2', name: 'B', birthDate: '2025-01-02', dueDate: null, settings, createdAt: 't' },
        ],
        activeUserId: 'u1',
        achievements: { u1: [], u2: [] },
      })
    );

    let captured: ReturnType<typeof useAppState> | null = null;
    const Probe = () => {
      captured = useAppState();
      return <Text>ok</Text>;
    };

    render(<AppStateProvider><Probe /></AppStateProvider>);
    await waitFor(() => expect(captured?.loading).toBe(false));

    await act(async () => {
      await captured!.deleteUser('u1');
    });
    expect(captured!.state.activeUserId).toBe('u2');

    await act(async () => {
      await captured!.deleteUser('u2');
    });
    expect(captured!.state.activeUserId).toBeNull();
  });

  test('legacy migration loads old keys, removes legacy keys, persists app state', async () => {
    mockGetItem
      .mockResolvedValueOnce(null) // APP_STATE_KEY
      .mockResolvedValueOnce('{legacy-settings}')
      .mockResolvedValueOnce('{legacy-achievements}');

    mockLoadUserSettings.mockResolvedValue({
      birthDate: '2025-01-01',
      dueDate: '2025-02-01',
      showCorrectedUntilMonths: 12,
      ageFormat: 'md',
      showDaysSinceBirth: false,
      lastViewedMonth: '2025-01-01',
    });
    mockLoadAchievements.mockResolvedValue({
      '2025-01-10': [
        { id: 'a1', date: '2025-01-10', title: 'x', tag: 'did', createdAt: 'c1' },
      ],
    });

    let captured: ReturnType<typeof useAppState> | null = null;
    const Probe = () => {
      captured = useAppState();
      return <Text>ok</Text>;
    };

    render(<AppStateProvider><Probe /></AppStateProvider>);

    await waitFor(() => expect(captured?.loading).toBe(false));

    expect(mockRemoveItem).toHaveBeenCalledWith('legacy_settings');
    expect(mockRemoveItem).toHaveBeenCalledWith('legacy_achievements');
    expect(mockSetItem).toHaveBeenCalled();
    expect(captured!.state.users[0].id).toBe('uuid-fixed');
    expect(captured!.state.activeUserId).toBe('uuid-fixed');
    expect(captured!.state.achievements['uuid-fixed'][0].category).toBe('growth');
  });

  test('useActiveUser and useAchievements read derived values', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({
        users: [{ id: 'u1', name: 'A', birthDate: '2025-01-01', dueDate: null, settings, createdAt: 't' }],
        activeUserId: 'u1',
        achievements: { u1: [{ id: 'a1', date: '2025-01-10', title: 'x', createdAt: 't' }] },
      })
    );

    let activeUserName = '';
    let achievementCount = -1;

    const Probe = () => {
      const user = useActiveUser();
      const achievements = useAchievements();
      activeUserName = user?.name ?? '';
      achievementCount = achievements.length;
      return <Text>ok</Text>;
    };

    render(<AppStateProvider><Probe /></AppStateProvider>);
    await waitFor(() => expect(achievementCount).toBe(1));
    expect(activeUserName).toBe('A');
  });
});
