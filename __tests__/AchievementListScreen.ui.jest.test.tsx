import React from "react";
import { render } from "@testing-library/react-native";

let mockActiveUser: any = null;
let mockStore: any = {};
let mockLoading = false;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("@/components/AppText", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, style }: any) =>
      React.createElement(Text, { style }, children),
  };
});

jest.mock("@/components/DatePickerModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/state/AppStateContext", () => ({
  useActiveUser: () => mockActiveUser,
}));

jest.mock("@/state/AchievementsContext", () => ({
  useAchievements: () => ({ loading: mockLoading, store: mockStore }),
}));

const mockNavigation = { navigate: jest.fn() };
const mockRoute = { params: {} };

const renderScreen = () => {
  const AchievementListScreen =
    require("../src/screens/AchievementListScreen").default;
  return render(
    React.createElement(AchievementListScreen, {
      navigation: mockNavigation,
      route: mockRoute,
    })
  );
};

describe("AchievementListScreen UI (TS-UI-007)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {};
    mockLoading = false;
    mockActiveUser = {
      id: "u1",
      name: "テストちゃん",
      birthDate: "2024-01-01",
      dueDate: null,
      settings: {
        showCorrectedUntilMonths: 24,
        ageFormat: "ymd",
        showDaysSinceBirth: true,
        lastViewedMonth: null,
      },
    };
  });

  test("記録なし: まだ記録がありませんを表示", () => {
    const { queryByText } = renderScreen();
    expect(queryByText("まだ記録がありません")).not.toBeNull();
  });

  test("ローディング中: 読み込み中...を表示", () => {
    mockLoading = true;
    const { queryByText } = renderScreen();
    expect(queryByText("読み込み中...")).not.toBeNull();
  });

  test("記録あり: 記録タイトルを表示", () => {
    mockStore = {
      "2024-06-01": [
        {
          id: "r1",
          date: "2024-06-01",
          title: "初めてのつかまり立ち",
          memo: "",
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        },
      ],
    };
    const { queryByText } = renderScreen();
    expect(queryByText("初めてのつかまり立ち")).not.toBeNull();
  });

  test("user=null: プロフィール未設定のヘッダーを表示", () => {
    mockActiveUser = null;
    const { queryByText } = renderScreen();
    expect(queryByText("プロフィール未設定")).not.toBeNull();
  });

  test("FABボタン（＋記録）が描画される", () => {
    const { queryByText } = renderScreen();
    expect(queryByText("＋記録")).not.toBeNull();
  });
});
