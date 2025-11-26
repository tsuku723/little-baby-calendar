import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

import { Achievement, AchievementType, AchievementStore } from "@/models/dataModels";
import { loadAchievements, saveAchievements } from "@/storage/storage";
import { normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";

interface AchievementsState {
  loading: boolean;
  store: AchievementStore;
  byDay: Record<string, Achievement[]>;
  monthCounts: Record<string, Record<string, number>>;
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
};

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [store, setStore] = useState<AchievementStore>({ achievements: [] });

  const refresh = useCallback(async () => {
    // 永続ストレージから最新の記録を丸ごと読み込む
    setLoading(true);
    const loaded = await loadAchievements();
    setStore(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byDay = useMemo(() => {
    // 日付ごとに記録をグルーピング（表示用）
    const map: Record<string, Achievement[]> = {};
    for (const item of store.achievements) {
      const key = item.date;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    }
    for (const key of Object.keys(map)) {
      map[key] = map[key].slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return map;
  }, [store]);

  const monthCounts = useMemo(() => {
    // 月ごとの日別件数を集計し、カレンダーの●表示に使う
    const counts: Record<string, Record<string, number>> = {};
    for (const item of store.achievements) {
      const month = item.date.slice(0, 7);
      if (!counts[month]) {
        counts[month] = {};
      }
      counts[month][item.date] = (counts[month][item.date] || 0) + 1;
    }
    return counts;
  }, [store]);

  const loadDay = useCallback(
    async (_isoDay: string) => {
      // Full refresh to keep in sync with storage
      await refresh();
    },
    [refresh]
  );

  const loadMonth = useCallback(
    async (_yyyymm: string) => {
      await refresh();
    },
    [refresh]
  );

  const upsert = useCallback(
    async (payload: SaveAchievementPayload) => {
      // 新規/更新を判定し、作成日時は維持しつつ更新日時を付与
      setLoading(true);
      const normalizedDate = toIsoDateString(normalizeToUtcDate(payload.date));
      let nextStore: AchievementStore = store;
      setStore((prev) => {
        const achievements = [...prev.achievements];
        const now = new Date().toISOString();
        const existingIndex = payload.id ? achievements.findIndex((item) => item.id === payload.id) : -1;
        const existing = existingIndex >= 0 ? achievements[existingIndex] : undefined;
        const record: Achievement = {
          id: payload.id ?? uuid(),
          date: normalizedDate,
          type: payload.type,
          title: payload.title,
          memo: payload.memo,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        if (existingIndex >= 0) {
          achievements.splice(existingIndex, 1, record);
        } else {
          achievements.push(record);
        }
        nextStore = { achievements };
        return nextStore;
      });
      await saveAchievements(nextStore);
      setLoading(false);
    },
    [store]
  );

  const remove = useCallback(async (id: string, _isoDay: string) => {
    // 指定IDの記録を削除し永続化
    setLoading(true);
    let nextStore: AchievementStore = store;
    setStore((prev) => {
      const achievements = prev.achievements.filter((item) => item.id !== id);
      nextStore = { achievements };
      return nextStore;
    });
    await saveAchievements(nextStore);
    setLoading(false);
  }, [store]);

  const value = useMemo(
    () => ({ loading, store, byDay, monthCounts, loadDay, loadMonth, upsert, remove }),
    [loading, store, byDay, monthCounts, loadDay, loadMonth, upsert, remove]
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
