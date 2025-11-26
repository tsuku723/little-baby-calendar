import AsyncStorage from "@react-native-async-storage/async-storage";
import { AchievementStore, UserSettings } from "../models/dataModels";

export const STORAGE_KEYS = {
  userSettings: "little_baby_calendar_user_settings",
  achievementStore: "little_baby_calendar_achievements",
};

export const loadUserSettings = async (): Promise<UserSettings | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userSettings);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSettings;
  } catch {
    return null;
  }
};

export const saveUserSettings = async (
  settings: UserSettings
): Promise<void> => {
  const serialized = JSON.stringify(settings);
  await AsyncStorage.setItem(STORAGE_KEYS.userSettings, serialized);
};

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
