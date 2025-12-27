import { NavigatorScreenParams } from "@react-navigation/native";

// Navigation type definitions. Keep RootStack in sync with flow requirements.
export type RootStackParamList = {
  MainTabs: undefined;
  CalendarStack: NavigatorScreenParams<CalendarStackParamList>;
  RecordInput:
    | {
        recordId?: string; // edit-only
        isoDate?: string; // initial date for new record
        from?: "today" | "list";
      }
    | undefined;
  RecordDetail:
    | {
        recordId: string;
        isoDate?: string;
        from: "today" | "list";
      }
    | undefined;
};

export type TodayStackParamList = {
  Today: undefined;
  ProfileManager: undefined;
};

export type CalendarStackParamList = {
  Calendar: undefined;
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
  RecordListStack: NavigatorScreenParams<RecordListStackParamList>;
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};
