import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

import { Achievement, DEFAULT_SETTINGS, SETTINGS_ID, UserSettings } from "@/types/models";
import { ensureDayKey } from "@/services/AgeService";
import { monthKey, toUTCDateOnly } from "@/utils/date";

const SETTINGS_KEY = "little-baby-calendar/settings";
const ACHIEVEMENTS_KEY = "little-baby-calendar/achievements";

const readJSON = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Failed to parse storage payload", error);
    return null;
  }
};

const writeJSON = async <T>(key: string, value: T) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const loadSettings = async (): Promise<UserSettings> => {
  const stored = await readJSON<UserSettings>(SETTINGS_KEY);
  if (!stored) {
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...stored, id: SETTINGS_ID };
};

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  await writeJSON(SETTINGS_KEY, settings);
};

const coerceAchievement = (input: Achievement): Achievement => {
  const date = ensureDayKey(input.date);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const updatedAt = input.updatedAt ?? createdAt;
  const yyyymm = input.yyyymm ?? date.slice(0, 7);
  const yyyy_mm_dd = input.yyyy_mm_dd ?? date;
  return {
    ...input,
    date,
    createdAt,
    updatedAt,
    yyyymm,
    yyyy_mm_dd,
  };
};

const readAchievements = async (): Promise<Achievement[]> => {
  const stored = await readJSON<Achievement[]>(ACHIEVEMENTS_KEY);
  if (!stored) {
    return [];
  }
  return stored.map(coerceAchievement);
};

const writeAchievements = async (items: Achievement[]): Promise<void> => {
  await writeJSON(ACHIEVEMENTS_KEY, items);
};

export interface SaveAchievementPayload {
  id?: string;
  date: string;
  type: Achievement["type"];
  comment: string;
  photoUri?: string | null;
}

export const saveAchievement = async (payload: SaveAchievementPayload): Promise<Achievement> => {
  const all = await readAchievements();
  const now = new Date().toISOString();
  const existingIndex = payload.id ? all.findIndex((item) => item.id === payload.id) : -1;

  const normalizedDate = ensureDayKey(payload.date);
  const normalized: Achievement = {
    id: payload.id ?? uuid(),
    date: normalizedDate,
    type: payload.type,
    comment: payload.comment,
    photoUri: payload.photoUri ?? null,
    createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
    updatedAt: now,
    yyyymm: normalizedDate.slice(0, 7),
    yyyy_mm_dd: normalizedDate,
  };

  if (existingIndex >= 0) {
    all.splice(existingIndex, 1, normalized);
  } else {
    all.push(normalized);
  }

  await writeAchievements(all);
  return normalized;
};

export const deleteAchievement = async (id: string): Promise<void> => {
  const all = await readAchievements();
  const next = all.filter((item) => item.id !== id);
  await writeAchievements(next);
};

export const listAchievementsByDay = async (isoDay: string): Promise<Achievement[]> => {
  const all = await readAchievements();
  return all.filter((item) => item.yyyy_mm_dd === ensureDayKey(isoDay)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const listAchievementsByMonth = async (yyyymm: string): Promise<Achievement[]> => {
  const all = await readAchievements();
  return all.filter((item) => item.yyyymm === yyyymm);
};

export const queryMonthCounts = async (yyyymm: string): Promise<Record<string, number>> => {
  const items = await listAchievementsByMonth(yyyymm);
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.yyyy_mm_dd] = (map[item.yyyy_mm_dd] || 0) + 1;
  }
  return map;
};

export const buildAchievement = (date: string, type: Achievement["type"], comment: string, photoUri?: string | null): Achievement => {
  const normalized = ensureDayKey(date);
  const now = new Date().toISOString();
  return {
    id: uuid(),
    date: normalized,
    type,
    comment,
    photoUri: photoUri ?? null,
    createdAt: now,
    updatedAt: now,
    yyyymm: normalized.slice(0, 7),
    yyyy_mm_dd: normalized,
  };
};

export const sortAchievements = (items: Achievement[]): Achievement[] =>
  [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export const ensureMonthKey = (isoDate: string): string => monthKey(toUTCDateOnly(isoDate));
