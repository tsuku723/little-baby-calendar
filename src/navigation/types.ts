import { NavigatorScreenParams } from "@react-navigation/native";

// Navigation 階層ごとの型定義（Phase 1 では骨組みのみ）
export type RootStackParamList = {
  MainTabs: undefined;
  RecordInput: undefined;
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
};

export type TabParamList = {
  TodayStack: NavigatorScreenParams<TodayStackParamList>;
  CalendarStack: NavigatorScreenParams<CalendarStackParamList>;
  RecordListStack: NavigatorScreenParams<RecordListStackParamList>;
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};
