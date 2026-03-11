import React from 'react';
import renderer, { act } from 'react-test-renderer';

let mockActiveUser: any = null;

const mockLoadMonth = jest.fn().mockResolvedValue(undefined);
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@/state/AppStateContext', () => ({
  useActiveUser: () => mockActiveUser,
  useAppState: () => ({ updateUser: mockUpdateUser }),
}));

jest.mock('@/state/AchievementsContext', () => ({
  useAchievements: () => ({ monthCounts: {}, loadMonth: mockLoadMonth }),
}));

jest.mock('@/state/DateViewContext', () => ({
  useDateViewContext: () => ({ selectDateFromCalendar: jest.fn() }),
}));

jest.mock('@/components/CalendarGrid', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/CalendarDecorations', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/DatePickerModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/MonthHeader', () => ({
  __esModule: true,
  default: () => null,
}));

const mockNavigation = { push: jest.fn() };
const mockRoute = { params: {} };

describe('CalendarScreen UI (TS-UI-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('user=null: プロフィール未設定プレースホルダを表示', async () => {
    mockActiveUser = null;
    const CalendarScreen = require('../src/screens/CalendarScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(CalendarScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    expect(tree.toJSON()).not.toBeNull();
    // ヘッダーに未設定文言が含まれる
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('プロフィール未設定');
  });

  test('user あり・birthDate あり: 名前と年齢情報を表示しloadMonthを呼ぶ', async () => {
    mockActiveUser = {
      id: 'u1',
      name: 'テストちゃん',
      birthDate: '2024-06-01',
      dueDate: null,
      settings: {
        showCorrectedUntilMonths: 24,
        ageFormat: 'ymd' as const,
        showDaysSinceBirth: true,
        lastViewedMonth: null,
      },
    };
    const CalendarScreen = require('../src/screens/CalendarScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(CalendarScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    expect(tree.toJSON()).not.toBeNull();
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('テストちゃん');
    expect(mockLoadMonth).toHaveBeenCalled();
  });

  test('user あり・birthDate なし: 年齢情報なしプレースホルダを表示', async () => {
    mockActiveUser = {
      id: 'u1',
      name: '名前ちゃん',
      birthDate: '',
      dueDate: null,
      settings: {
        showCorrectedUntilMonths: 24,
        ageFormat: 'md' as const,
        showDaysSinceBirth: false,
        lastViewedMonth: null,
      },
    };
    const CalendarScreen = require('../src/screens/CalendarScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(CalendarScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    expect(tree.toJSON()).not.toBeNull();
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('年齢情報は設定済みのプロフィールで表示されます');
  });

  test('FABボタン（＋記録）が描画される', async () => {
    mockActiveUser = null;
    const CalendarScreen = require('../src/screens/CalendarScreen').default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(CalendarScreen, { navigation: mockNavigation, route: mockRoute })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('＋記録');
  });
});
