import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  Achievement,
  deleteAchievement,
  listAchievementsByDay,
  queryMonthCounts,
  saveAchievement,
  SaveAchievementPayload,
} from "@/services/StorageService";

interface AchievementsState {
  loading: boolean;
  byDay: Record<string, Achievement[]>;
  monthCounts: Record<string, Record<string, number>>;
  loadDay: (isoDay: string) => Promise<void>;
  loadMonth: (yyyymm: string) => Promise<void>;
  upsert: (payload: SaveAchievementPayload) => Promise<void>;
  remove: (id: string, isoDay: string) => Promise<void>;
}

const AchievementsContext = createContext<AchievementsState | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [byDay, setByDay] = useState<Record<string, Achievement[]>>({});
  const [monthCounts, setMonthCounts] = useState<Record<string, Record<string, number>>>({});

  const loadDay = useCallback(async (isoDay: string) => {
    setLoading(true);
    const list = await listAchievementsByDay(isoDay);
    setByDay((prev) => ({ ...prev, [isoDay]: list }));
    setLoading(false);
  }, []);

  const loadMonth = useCallback(async (yyyymm: string) => {
    const counts = await queryMonthCounts(yyyymm);
    setMonthCounts((prev) => ({ ...prev, [yyyymm]: counts }));
  }, []);

  const upsert = useCallback(async (payload: SaveAchievementPayload) => {
    const saved = await saveAchievement(payload);
    await loadDay(saved.yyyy_mm_dd);
    await loadMonth(saved.yyyymm);
  }, [loadDay, loadMonth]);

  const remove = useCallback(
    async (id: string, isoDay: string) => {
      await deleteAchievement(id);
      await loadDay(isoDay);
      await loadMonth(isoDay.slice(0, 7));
    },
    [loadDay, loadMonth]
  );

  useEffect(() => {
    const today = new Date();
    void loadMonth(`${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`);
  }, [loadMonth]);

  const value = useMemo(
    () => ({ loading, byDay, monthCounts, loadDay, loadMonth, upsert, remove }),
    [loading, byDay, monthCounts, loadDay, loadMonth, upsert, remove]
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
