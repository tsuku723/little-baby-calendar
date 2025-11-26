import AsyncStorage from "@react-native-async-storage/async-storage";
import { AchievementStore, UserSettings } from "../models/dataModels";

export const STORAGE_KEYS = {
  userSettings: "little_baby_calendar_user_settings",
  achievementStore: "little_baby_calendar_achievements",
};

// 設定の読み込み（壊れたJSONや未保存の場合は null を返す）
export const loadUserSettings = async (): Promise<UserSettings | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userSettings);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSettings;
  } catch {
    return null;
  }
};

// 設定の保存（全量をJSONで上書き）
export const saveUserSettings = async (
  settings: UserSettings
): Promise<void> => {
  const serialized = JSON.stringify(settings);
  await AsyncStorage.setItem(STORAGE_KEYS.userSettings, serialized);
};

// 記録の読み込み（パース失敗や未保存時は空配列）
export const loadAchievements = async (): Promise<AchievementStore> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.achievementStore);
  if (!raw) {
    return { achievements: [] };
  }
  try {
    return JSON.parse(raw) as AchievementStore;
  } catch {
    return { achievements: [] };
  }
};

export const saveAchievements = async (
  store: AchievementStore
): Promise<void> => {
  const serialized = JSON.stringify(store);
  await AsyncStorage.setItem(STORAGE_KEYS.achievementStore, serialized);
};
