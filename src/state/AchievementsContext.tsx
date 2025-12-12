import "react-native-get-random-values";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { v4 as uuid } from "uuid";

import {
  Achievement,
  AchievementType,
  AchievementStore,
} from "@/models/dataModels";

import {
  loadAchievements,
  upsertAchievement as storageUpsert,
  deleteAchievement as storageDelete,
} from "@/storage/storage";

import {
  isIsoDateString,
  normalizeToUtcDate,
  toIsoDateString,
  todayIsoDate,
} from "@/utils/dateUtils";

// -----------------------------------------------------
// Context interface
// -----------------------------------------------------

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

const AchievementsContext = createContext<AchievementsState | undefined>(
  undefined
);

// -----------------------------------------------------
// Payload type
// -----------------------------------------------------

export type SaveAchievementPayload = {
  id?: string;
  date: string;
  type: AchievementType;
  title: string;
  memo?: string;
};

// -----------------------------------------------------
// Provider
// -----------------------------------------------------

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [store, setStore] = useState<AchievementStore>({});
  const [selectedDate, setSelectedDateState] = useState<string>(() =>
    todayIsoDate()
  );

  // -------------------------------------------
  // Refresh from storage
  // -------------------------------------------

  const refresh = useCallback(async () => {
    setLoading(true);
    const loaded = await loadAchievements();
    setStore(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // -------------------------------------------
  // byDay & monthCounts
  // -------------------------------------------

  const byDay = useMemo(() => {
    return { ...store }; // shallow copy
  }, [store]);

  const monthCounts = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};

    for (const [date, list] of Object.entries(store)) {
      const month = date.slice(0, 7); // YYYY-MM
      if (!result[month]) {
        result[month] = {};
      }
      result[month][date] = list.length;
    }

    return result;
  }, [store]);

  // -------------------------------------------
  // Selected date shared across screens
  // -------------------------------------------

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

  // -------------------------------------------
  // Day / Month loading
  // -------------------------------------------

  const loadDay = useCallback(
    async (_isoDay: string) => {
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

  // -------------------------------------------
  // Upsert
  // -------------------------------------------

  const upsert = useCallback(
    async (payload: SaveAchievementPayload) => {
      setLoading(true);
      try {
        if (!isIsoDateString(payload.date)) {
          console.error(`Invalid date format in upsert: ${payload.date}`);
          return;
        }

        const normalizedDateObj = normalizeToUtcDate(payload.date);
        if (Number.isNaN(normalizedDateObj.getTime())) {
          console.error(`Invalid date value in upsert: ${payload.date}`);
          return;
        }
        const normalizedDate = toIsoDateString(normalizedDateObj);

        const record: Achievement = {
          id: payload.id ?? uuid(),
          date: normalizedDate,
          type: payload.type,
          title: payload.title,
          memo: payload.memo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await storageUpsert(record);
        await refresh();
      } catch (err) {
        console.error("upsert failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  // -------------------------------------------
  // Remove
  // -------------------------------------------

  const remove = useCallback(
    async (id: string, isoDate: string) => {
      setLoading(true);
      try {
        if (!isIsoDateString(isoDate)) {
          console.error(`Invalid date format in remove: ${isoDate}`);
          return;
        }
        const normalizedDateObj = normalizeToUtcDate(isoDate);
        if (Number.isNaN(normalizedDateObj.getTime())) {
          console.error(`Invalid date value in remove: ${isoDate}`);
          return;
        }
        const normalizedDate = toIsoDateString(normalizedDateObj);

        await storageDelete(id, normalizedDate);
        await refresh();
      } catch (err) {
        console.error("remove failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  // -------------------------------------------
  // Context value
  // -------------------------------------------

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
    [
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
    ]
  );

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
};

// -----------------------------------------------------
// Hook
// -----------------------------------------------------

export const useAchievements = (): AchievementsState => {
  const ctx = useContext(AchievementsContext);
  if (!ctx) {
    throw new Error("useAchievements must be used within AchievementsProvider");
  }
  return ctx;
};
