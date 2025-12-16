import { NavigatorScreenParams } from "@react-navigation/native";

// Navigation 構成の型定義。Phase 1 ベースを維持しつつ段階的に拡張する。
export type RootStackParamList = {
  MainTabs: undefined;
  RecordInput:
    | {
        recordId?: string; // 編集時のみ使用
        isoDate?: string; // 新規時の初期日付
      }
    | undefined;
  RecordDetail:
    | {
        recordId: string;
        isoDate?: string;
      }
    | undefined;
};

export type TodayStackParamList = {
  Today: { selectedDay?: string; isoDay?: string } | undefined;
  ProfileManager: undefined;
  Setup: undefined;
};

export type CalendarStackParamList = {
  Calendar: { initialSelectedDay?: string } | undefined;
};

export type RecordListStackParamList = {
  AchievementList: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  ProfileManager: undefined;
  ProfileEdit:
    | {
        profileId?: string;
      }
    | undefined;
};

export type TabParamList = {
  TodayStack: NavigatorScreenParams<TodayStackParamList>;
  CalendarStack: NavigatorScreenParams<CalendarStackParamList>;
  RecordListStack: NavigatorScreenParams<RecordListStackParamList>;
  // グラフ導線は記録一覧画面の表示切替に統合したため、タブには含めない
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};
