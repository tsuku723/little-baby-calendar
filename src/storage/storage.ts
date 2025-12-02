import AsyncStorage from "@react-native-async-storage/async-storage";

import { Achievement, AchievementStore, UserSettings } from "../models/dataModels";
import { normalizeToUtcDate, toIsoDateString } from "../utils/dateUtils";

export const STORAGE_KEYS = {
  userSettings: "little_baby_calendar_user_settings",
  achievementStore: "little_baby_calendar_achievements",
};

const DEFAULT_SETTINGS: UserSettings = {
  birthDate: "",
  dueDate: null,
  showCorrectedUntilMonths: 24,
  ageFormat: "md",
  showDaysSinceBirth: true,
  lastViewedMonth: null,
};

const DEFAULT_ACHIEVEMENTS: AchievementStore = {};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Failed to parse stored JSON", error);
    return fallback;
  }
};

const saveJson = async (key: string, value: unknown): Promise<void> => {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to save key=${key}`, error);
    throw error;
  }
};

export const normalizeDateKey = (isoString: string): string =>
  toIsoDateString(normalizeToUtcDate(isoString));

const normalizeDateKeySafe = (isoString: string): string | null => {
  try {
    return normalizeDateKey(isoString);
  } catch (error) {
    console.warn("normalizeDateKey failed; skipping value", isoString, error);
    return null;
  }
};

const ensureTimestamps = (record: Achievement, now: string): Achievement => {
  const created = record.createdAt ?? now;
  const updated = record.updatedAt ?? now;
  return { ...record, createdAt: created, updatedAt: updated };
};

const isMapFormat = (input: unknown): input is AchievementStore => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  return Object.entries(input as Record<string, unknown>).every(([_, value]) => {
    if (!Array.isArray(value)) return false;
    return value.every((item) => {
      const rec = item as Achievement;
      return typeof rec === "object" && !!rec?.date && typeof rec.date === "string";
    });
  });
};

const migrateToMap = (input: unknown): AchievementStore => {
  const now = new Date().toISOString();

  if (isMapFormat(input)) {
    const normalized: AchievementStore = {};
    Object.entries(input).forEach(([dateKey, list]) => {
      const normalizedKey = normalizeDateKeySafe(dateKey);
      if (!normalizedKey) return;
      normalized[normalizedKey] = (list as Achievement[]).map((rec) => ensureTimestamps(rec, now));
    });
    return normalized;
  }

  if (
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Array.isArray((input as any).achievements)
  ) {
    const list = (input as any).achievements as Achievement[];
    return list.reduce<AchievementStore>((acc, item) => {
      if (!item?.date) return acc;
      const key = normalizeDateKeySafe(item.date);
      if (!key) return acc;
      const rec = ensureTimestamps(item, now);
      acc[key] = acc[key] ? [...acc[key], rec] : [rec];
      return acc;
    }, {});
  }

  if (Array.isArray(input)) {
    return (input as Achievement[]).reduce<AchievementStore>((acc, item) => {
      if (!item?.date) return acc;
      const key = normalizeDateKeySafe(item.date);
      if (!key) return acc;
      const rec = ensureTimestamps(item, now);
      acc[key] = acc[key] ? [...acc[key], rec] : [rec];
      return acc;
    }, {});
  }

  return DEFAULT_ACHIEVEMENTS;
};

export const loadUserSettings = async (): Promise<UserSettings> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userSettings);
  const parsed = safeParse<UserSettings>(raw, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...parsed };
};

export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  await saveJson(STORAGE_KEYS.userSettings, settings);
};

export const loadAchievements = async (): Promise<AchievementStore> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.achievementStore);
  const parsed = safeParse<unknown>(raw, DEFAULT_ACHIEVEMENTS);
  return migrateToMap(parsed);
};

export const saveAchievements = async (store: AchievementStore): Promise<void> => {
  await saveJson(STORAGE_KEYS.achievementStore, store);
};

export const upsertAchievement = async (record: Achievement): Promise<Achievement> => {
  const now = new Date().toISOString();
  const normalized = ensureTimestamps(record, now);
  const key = normalizeDateKey(normalized.date);
  const current = await loadAchievements();
  const list = current[key] ? [...current[key]] : [];
  const index = list.findIndex((a) => a.id === normalized.id);

  if (index >= 0) {
    const existing = list[index];
    list.splice(index, 1, { ...existing, ...normalized, createdAt: existing.createdAt, updatedAt: now });
  } else {
    list.push({ ...normalized, createdAt: now, updatedAt: now });
  }

  const nextStore: AchievementStore = { ...current, [key]: list };
  await saveAchievements(nextStore);
  return { ...normalized, date: key };
};

export const deleteAchievement = async (id: string, isoDate: string): Promise<void> => {
  const key = normalizeDateKey(isoDate);
  const current = await loadAchievements();
  const list = current[key];
  if (!list) return;

  const nextList = list.filter((a) => a.id !== id);
  const nextStore: AchievementStore = { ...current };
  if (nextList.length > 0) {
    nextStore[key] = nextList;
  } else {
    delete nextStore[key];
  }
  await saveAchievements(nextStore);
};

export const listAchievementsByDate = async (isoDate: string): Promise<Achievement[]> => {
  const key = normalizeDateKey(isoDate);
  const current = await loadAchievements();
  return current[key] ?? [];
};
