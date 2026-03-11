import React from 'react';
import renderer, { act } from 'react-test-renderer';

const mockSetActiveUser = jest.fn().mockResolvedValue(undefined);
let mockAppState: any = { users: [], activeUserId: null };

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/AppText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, style }: any) => React.createElement(Text, { style }, children),
  };
});

jest.mock('@/state/AppStateContext', () => ({
  useAppState: () => ({ state: mockAppState, setActiveUser: mockSetActiveUser }),
}));

const mockNavigation = { navigate: jest.fn() };
const mockRoute = { params: {} };

describe('SettingsScreen UI (TS-UI-008)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('users なし: ベビーを選択セクションを表示', async () => {
    mockAppState = { users: [], activeUserId: null };
    const SettingsScreen = require('../src/screens/SettingsScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(SettingsScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('ベビーを選択');
  });

  test('users あり: ユーザー名を表示', async () => {
    mockAppState = {
      users: [
        {
          id: 'u1',
          name: 'テストちゃん',
          birthDate: '2024-01-01',
          dueDate: null,
          settings: {
            showCorrectedUntilMonths: 24,
            ageFormat: 'ymd',
            showDaysSinceBirth: true,
            lastViewedMonth: null,
          },
        },
      ],
      activeUserId: 'u1',
    };
    const SettingsScreen = require('../src/screens/SettingsScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(SettingsScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('テストちゃん');
    expect(json).toContain('2024-01-01');
  });

  test('アクティブユーザーに✓マークが表示される', async () => {
    mockAppState = {
      users: [
        {
          id: 'u1',
          name: 'テストちゃん',
          birthDate: '2024-01-01',
          dueDate: null,
          settings: {
            showCorrectedUntilMonths: 24,
            ageFormat: 'ymd',
            showDaysSinceBirth: true,
            lastViewedMonth: null,
          },
        },
      ],
      activeUserId: 'u1',
    };
    const SettingsScreen = require('../src/screens/SettingsScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(SettingsScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('✓');
  });

  test('サポートメニューが表示される', async () => {
    mockAppState = { users: [], activeUserId: null };
    const SettingsScreen = require('../src/screens/SettingsScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(SettingsScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('このアプリについて');
    expect(json).toContain('プライバシーポリシー');
    expect(json).toContain('利用規約');
  });
});
