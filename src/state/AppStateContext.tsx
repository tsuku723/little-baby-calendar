import "react-native-get-random-values";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

import { STORAGE_KEYS, loadAchievements, loadUserSettings } from "@/storage/storage";

export type UserSettings = {
  showCorrectedUntilMonths: number | null;
  ageFormat: "md" | "ymd";
  showDaysSinceBirth: boolean;
  lastViewedMonth: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  birthDate: string;
  dueDate: string | null;
  settings: UserSettings;
  createdAt: string;
};

export type Achievement = {
  id: string;
  date: string;
  tag: "growth" | "effort";
  title: string;
  memo?: string;
  createdAt: string;
  updatedAt?: string;
};

export type AppState = {
  users: UserProfile[];
  activeUserId: string | null;
  achievements: Record<string, Achievement[]>;
};

type NewUserInput = Omit<UserProfile, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

type AppStateContextValue = {
  state: AppState;
  loading: boolean;
  addUser: (input: NewUserInput) => Promise<void>;
  updateUser: (
    userId: string,
    partial: Partial<Omit<UserProfile, "id">>
  ) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  setActiveUser: (userId: string) => Promise<void>;
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>;
  updateAchievement: (
    userId: string,
    id: string,
    partial: Partial<Achievement>
  ) => Promise<void>;
  deleteAchievement: (userId: string, id: string) => Promise<void>;
};

const APP_STATE_KEY = "little_baby_calendar_app_state";

const EMPTY_STATE: AppState = {
  users: [],
  activeUserId: null,
  achievements: {},
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const persistState = async (nextState: AppState) => {
  try {
    await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(nextState));
  } catch (error) {
    console.warn("Failed to persist AppState", error);
  }
};

const ensureStateIntegrity = (state: AppState): AppState => {
  const nextState: AppState = {
    users: state.users ?? [],
    activeUserId: state.activeUserId ?? null,
    achievements: state.achievements ?? {},
  };

  if (!nextState.activeUserId || !nextState.users.some((u) => u.id === nextState.activeUserId)) {
    nextState.activeUserId = nextState.users[0]?.id ?? null;
  }

  nextState.users.forEach((user) => {
    if (!nextState.achievements[user.id]) {
      nextState.achievements[user.id] = [];
    }
  });

  return nextState;
};

const migrateLegacyState = async (): Promise<AppState | null> => {
  const legacySettingsRaw = await AsyncStorage.getItem(STORAGE_KEYS.userSettings);
  const legacyAchievementsRaw = await AsyncStorage.getItem(STORAGE_KEYS.achievementStore);

  if (!legacySettingsRaw && !legacyAchievementsRaw) return null;

  const legacySettings = legacySettingsRaw ? await loadUserSettings() : null;
  const legacyAchievements = legacyAchievementsRaw ? await loadAchievements() : {};

  const userId = uuid();
  const now = new Date().toISOString();

  const profile: UserProfile = {
    id: userId,
    name: "Baby",
    birthDate: legacySettings?.birthDate ?? "",
    dueDate: legacySettings?.dueDate ?? null,
    settings: {
      showCorrectedUntilMonths: legacySettings?.showCorrectedUntilMonths ?? 24,
      ageFormat: legacySettings?.ageFormat ?? "md",
      showDaysSinceBirth: legacySettings?.showDaysSinceBirth ?? true,
      lastViewedMonth: legacySettings?.lastViewedMonth ?? null,
    },
    createdAt: now,
  };

  const migratedAchievements: Achievement[] = [];
  Object.values(legacyAchievements).forEach((list) => {
    list.forEach((item) => {
      migratedAchievements.push({
        id: (item as any).id ?? uuid(),
        date: (item as any).date ?? "",
        tag: "growth",
        title: (item as any).title ?? "",
        memo: (item as any).memo,
        createdAt: (item as any).createdAt ?? now,
        updatedAt: (item as any).updatedAt,
      });
    });
  });

  const migratedState: AppState = {
    users: [profile],
    activeUserId: userId,
    achievements: { [userId]: migratedAchievements },
  };

  await AsyncStorage.removeItem(STORAGE_KEYS.userSettings);
  await AsyncStorage.removeItem(STORAGE_KEYS.achievementStore);
  await persistState(migratedState);

  return migratedState;
};

const loadAppState = async (): Promise<AppState> => {
  const raw = await AsyncStorage.getItem(APP_STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AppState;
      return ensureStateIntegrity(parsed);
    } catch (error) {
      console.warn("Failed to parse AppState; resetting", error);
    }
  }

  const migrated = await migrateLegacyState();
  if (migrated) return ensureStateIntegrity(migrated);

  return { ...EMPTY_STATE };
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      const loaded = await loadAppState();
      setState(loaded);
      setLoading(false);
    };
    void bootstrap();
  }, []);

  const updateState = useCallback(async (updater: (prev: AppState) => AppState) => {
    let nextState: AppState = EMPTY_STATE;
    setState((prev) => {
      nextState = ensureStateIntegrity(updater(prev));
      return nextState;
    });
    await persistState(nextState);
  }, []);

  const addUser = useCallback(
    async (input: NewUserInput) => {
      await updateState((prev) => {
        const userId = input.id ?? uuid();
        const createdAt = input.createdAt ?? new Date().toISOString();
        const profile: UserProfile = {
          id: userId,
          name: input.name,
          birthDate: input.birthDate,
          dueDate: input.dueDate,
          settings: input.settings,
          createdAt,
        };

        const nextUsers = [...prev.users, profile];
        const nextAchievements = { ...prev.achievements, [userId]: [] };
        const nextActive = prev.activeUserId ?? userId;

        return {
          users: nextUsers,
          activeUserId: nextActive,
          achievements: nextAchievements,
        };
      });
    },
    [updateState]
  );

  const updateUser = useCallback(
    async (userId: string, partial: Partial<Omit<UserProfile, "id">>) => {
      await updateState((prev) => {
        const nextUsers = prev.users.map((user) =>
          user.id === userId ? { ...user, ...partial, id: user.id } : user
        );
        return { ...prev, users: nextUsers };
      });
    },
    [updateState]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      await updateState((prev) => {
        const nextUsers = prev.users.filter((user) => user.id !== userId);
        const nextAchievements = { ...prev.achievements };
        delete nextAchievements[userId];

        let nextActive: string | null = prev.activeUserId;
        if (prev.activeUserId === userId) {
          nextActive = nextUsers[0]?.id ?? null;
        }

        return {
          users: nextUsers,
          activeUserId: nextActive,
          achievements: nextAchievements,
        };
      });
    },
    [updateState]
  );

  const setActiveUser = useCallback(
    async (userId: string) => {
      await updateState((prev) => {
        if (!prev.users.some((user) => user.id === userId)) return prev;
        return { ...prev, activeUserId: userId };
      });
    },
    [updateState]
  );

  const addAchievement = useCallback(
    async (userId: string, achievement: Achievement) => {
      await updateState((prev) => {
        const current = prev.achievements[userId] ?? [];
        return {
          ...prev,
          achievements: {
            ...prev.achievements,
            [userId]: [...current, achievement],
          },
        };
      });
    },
    [updateState]
  );

  const updateAchievement = useCallback(
    async (userId: string, id: string, partial: Partial<Achievement>) => {
      await updateState((prev) => {
        const current = prev.achievements[userId] ?? [];
        const nextList = current.map((item) =>
          item.id === id ? { ...item, ...partial, id: item.id } : item
        );
        return {
          ...prev,
          achievements: { ...prev.achievements, [userId]: nextList },
        };
      });
    },
    [updateState]
  );

  const deleteAchievement = useCallback(
    async (userId: string, id: string) => {
      await updateState((prev) => {
        const current = prev.achievements[userId] ?? [];
        const nextList = current.filter((item) => item.id !== id);
        return {
          ...prev,
          achievements: { ...prev.achievements, [userId]: nextList },
        };
      });
    },
    [updateState]
  );

  const value = useMemo(
    () => ({
      state,
      loading,
      addUser,
      updateUser,
      deleteUser,
      setActiveUser,
      addAchievement,
      updateAchievement,
      deleteAchievement,
    }),
    [state, loading, addUser, updateUser, deleteUser, setActiveUser, addAchievement, updateAchievement, deleteAchievement]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = (): AppStateContextValue => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
};

export const useActiveUser = (): UserProfile | null => {
  const { state } = useAppState();
  return useMemo(
    () => state.users.find((user) => user.id === state.activeUserId) ?? null,
    [state]
  );
};

export const useAchievements = (): Achievement[] => {
  const { state } = useAppState();
  if (!state.activeUserId) return [];
  return state.achievements[state.activeUserId] ?? [];
};
