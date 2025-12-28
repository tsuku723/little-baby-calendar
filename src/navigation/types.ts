import { NavigatorScreenParams } from "@react-navigation/native";

// Navigation type definitions. Keep RootStack in sync with flow requirements.
export type RootStackParamList = {
  MainTabs: undefined;
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

export type CalendarStackParamList = {
  Calendar: undefined;
  Today: {
    isoDate: string;
  };
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
  CalendarStack: NavigatorScreenParams<CalendarStackParamList>;
  RecordListStack: NavigatorScreenParams<RecordListStackParamList>;
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};
