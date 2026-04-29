import React from "react";
import renderer, { act } from "react-test-renderer";

let mockActiveUser: any = null;
let mockStore: any = {};

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

jest.mock("@/state/AppStateContext", () => ({
  useActiveUser: () => mockActiveUser,
}));

jest.mock("@/state/AchievementsContext", () => ({
  useAchievements: () => ({ store: mockStore }),
}));

jest.mock("@/utils/photo", () => ({
  ensureFileExistsAsync: jest.fn().mockResolvedValue(null),
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
};

describe("RecordDetailScreen UI (TS-UI-006)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {};
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

  test("record=null: 記録が見つかりませんを表示", async () => {
    mockStore = {};
    const route = {
      params: { recordId: "nonexistent", isoDate: "2024-06-01", from: "today" },
    };
    const RecordDetailScreen =
      require("../src/screens/RecordDetailScreen").default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(RecordDetailScreen, {
          navigation: mockNavigation,
          route,
        })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("記録が見つかりません");
  });

  test("from=list のとき「戻る」ボタンを表示", async () => {
    mockStore = {};
    const route = {
      params: { recordId: "nonexistent", isoDate: "2024-06-01", from: "list" },
    };
    const RecordDetailScreen =
      require("../src/screens/RecordDetailScreen").default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(RecordDetailScreen, {
          navigation: mockNavigation,
          route,
        })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("戻る");
  });

  test("record あり: 記録詳細を表示", async () => {
    mockStore = {
      "2024-06-01": [
        {
          id: "r1",
          date: "2024-06-01",
          title: "初めての寝返り",
          memo: "とても嬉しかった",
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        },
      ],
    };
    const route = {
      params: { recordId: "r1", isoDate: "2024-06-01", from: "today" },
    };
    const RecordDetailScreen =
      require("../src/screens/RecordDetailScreen").default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(RecordDetailScreen, {
          navigation: mockNavigation,
          route,
        })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("初めての寝返り");
    expect(json).toContain("とても嬉しかった");
    expect(json).toContain("編集");
  });

  test("user.name なし: ヘッダーが「記録」になる", async () => {
    mockActiveUser = null;
    mockStore = {
      "2024-06-01": [
        {
          id: "r1",
          date: "2024-06-01",
          title: "テスト",
          memo: "",
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        },
      ],
    };
    const route = {
      params: { recordId: "r1", isoDate: "2024-06-01", from: "today" },
    };
    const RecordDetailScreen =
      require("../src/screens/RecordDetailScreen").default;
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        React.createElement(RecordDetailScreen, {
          navigation: mockNavigation,
          route,
        })
      );
    });
    const json = JSON.stringify(tree.toJSON());
    // user?.name が null なのでヘッダーは "記録" になる
    expect(json).toContain("記録");
  });
});
