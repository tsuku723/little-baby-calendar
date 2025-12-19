import "react-native-get-random-values";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { v4 as uuid } from "uuid";

import { Achievement, AchievementType, AchievementStore } from "@/models/dataModels";
import {
  cleanupReplacedPhotoAsync,
  removeAchievementPhotoAsync,
} from "@/services/achievementService";
import { useActiveUser, useAppState } from "@/state/AppStateContext";
import { isIsoDateString, normalizeToUtcDate, toIsoDateString, todayIsoDate } from "@/utils/dateUtils";

// AchievementsContext は AppStateContext の activeUserId を唯一の正とする。
// プロフィールごとに実績を分離するため、storage.ts を直接参照せず AppStateContext 経由で読書きする。

interface AchievementsState {
  loading: boolean;
  store: AchievementStore;
  byDay: Record<string, Achievement[]>;
  monthCounts: Record<string, Record<string, number>>;
  selectedDate: string;
  setSelectedDate: (isoDate: string) => void;

  loadDay: (isoDay: string) => Promise<void>;
  loadMonth: (yyyymm: string) => Promise<void>;

  upsert: (payload: SaveAchievementPayload) => Promise<void>;
  remove: (id: string, isoDay: string) => Promise<void>;
}

const AchievementsContext = createContext<AchievementsState | undefined>(undefined);

export type SaveAchievementPayload = {
  id?: string;
  date: string;
  type: AchievementType;
  title: string;
  memo?: string;
  photoPath?: string | null; // null は「写真を外す」
};

// tag 変換: AppStateContext は growth/effort、Achievement UI は did/tried を使用するため相互変換する。
const toAppStateTag = (type: AchievementType): "growth" | "effort" => (type === "did" ? "growth" : "effort");
const fromAppStateTag = (tag: "growth" | "effort"): AchievementType => (tag === "growth" ? "did" : "tried");

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, addAchievement, updateAchievement, deleteAchievement } = useAppState();
  const user = useActiveUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDateState] = useState<string>(() => todayIsoDate());

  // activeUserId ごとの実績だけを参照する。ほかのプロフィールのデータにはアクセスしない。
  const activeAchievements = useMemo(() => {
    if (!state.activeUserId) return [];
    return state.achievements[state.activeUserId] ?? [];
  }, [state.activeUserId, state.achievements]);

  // AppStateContext の配列を日付キーのマップへ変換（UI 互換の did/tried に揃える）。
  const store = useMemo<AchievementStore>(() => {
    const map: AchievementStore = {};
    activeAchievements.forEach((item) => {
      const dateKey = item.date;
      const converted: Achievement = {
        id: item.id,
        date: dateKey,
        type: fromAppStateTag(item.tag as "growth" | "effort"),
        title: item.title,
        memo: item.memo,
        photoPath: item.photoPath ?? undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt ?? item.createdAt,
      };
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(converted);
    });
    return map;
  }, [activeAchievements]);

  const byDay = useMemo(() => ({ ...store }), [store]);

  const monthCounts = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    Object.entries(store).forEach(([date, list]) => {
      const month = date.slice(0, 7);
      if (!result[month]) result[month] = {};
      result[month][date] = list.length;
    });
    return result;
  }, [store]);

  const setSelectedDate = useCallback((isoDate: string) => {
    if (!isIsoDateString(isoDate)) {
      console.warn("setSelectedDate: invalid isoDate", isoDate);
      return;
    }
    const normalizedDate = normalizeToUtcDate(isoDate);
    if (Number.isNaN(normalizedDate.getTime())) {
      console.warn("setSelectedDate: invalid date value", isoDate);
      return;
    }
    setSelectedDateState(toIsoDateString(normalizedDate));
  }, []);

  const loadDay = useCallback(async (_isoDay: string) => {
    // AppStateContext が単一の真実のソースなので再読込は不要（profileId ごとに分離済み）。
    return Promise.resolve();
  }, []);

  const loadMonth = useCallback(async (_yyyymm: string) => {
    // AppStateContext が単一の真実のソースなので再読込は不要（profileId ごとに分離済み）。
    return Promise.resolve();
  }, []);

  const upsert = useCallback(
    async (payload: SaveAchievementPayload) => {
      if (!user || !state.activeUserId) {
        console.warn("upsert skipped: active user not set");
        return;
      }
      if (!isIsoDateString(payload.date)) {
        console.error(`Invalid date format in upsert: ${payload.date}`);
        return;
      }
      const normalizedDate = toIsoDateString(normalizeToUtcDate(payload.date));
      const now = new Date().toISOString();
      const recordId = payload.id ?? uuid();
      const existing = activeAchievements.find((item) => item.id === recordId);
      const previousPhotoPath = existing?.photoPath ?? undefined;

      // photoPath: undefined=変更なし、string=更新、null=削除
      const nextPhotoPath = payload.photoPath === null
        ? undefined
        : payload.photoPath ?? previousPhotoPath;

      const appStateRecord = {
        id: recordId,
        date: normalizedDate,
        tag: toAppStateTag(payload.type),
        title: payload.title,
        memo: payload.memo,
        photoPath: nextPhotoPath,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setLoading(true);
      try {
        const exists = Boolean(existing);

        if (exists) {
          // 既存実績の更新。profileId ごとのストアを保つため updateAchievement を使用する。
          await updateAchievement(state.activeUserId, recordId, appStateRecord);
        } else {
          // 新規追加。必ず activeUserId に紐づける。
          await addAchievement(state.activeUserId, appStateRecord as any);
        }

        await cleanupReplacedPhotoAsync(previousPhotoPath, payload.photoPath);
      } catch (err) {
        console.error("upsert failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [activeAchievements, addAchievement, state.activeUserId, updateAchievement, user]
  );

  const remove = useCallback(
    async (id: string, _isoDate: string) => {
      if (!state.activeUserId) {
        console.warn("remove skipped: active user not set");
        return;
      }
      const record = Object.values(store).flat().find((item) => item.id === id);
      setLoading(true);
      try {
        // profileId ごとに deleteAchievement を呼ぶことで他プロフィールのデータを触らない。
        await deleteAchievement(state.activeUserId, id);

        if (record?.photoPath) {
          await removeAchievementPhotoAsync(record.photoPath);
        }
      } catch (err) {
        console.error("remove failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [deleteAchievement, state.activeUserId, store]
  );

  const value = useMemo(
    () => ({
      loading,
      store,
      byDay,
      monthCounts,
      selectedDate,
      setSelectedDate,
      loadDay,
      loadMonth,
      upsert,
      remove,
    }),
    [loading, store, byDay, monthCounts, selectedDate, setSelectedDate, loadDay, loadMonth, upsert, remove]
  );

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
};

export const useAchievements = (): AchievementsState => {
  const ctx = useContext(AchievementsContext);
  if (!ctx) {
    throw new Error("useAchievements must be used within AchievementsProvider");
  }
  return ctx;
};
