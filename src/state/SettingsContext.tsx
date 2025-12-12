import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { UserSettings } from "@/models/dataModels";
import { DEFAULT_SETTINGS } from "@/types/models";
import { useActiveUser, useAppState } from "@/state/AppStateContext";

// SettingsContext は「表示設定のみ」を扱い、出生情報（birthDate / dueDate）は絶対に扱わない。
// プロフィールごとに設定を分離するため、activeUser 経由でのみ値を読み書きする。

interface SettingsContextValue {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (next: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useActiveUser();
  const { updateUser } = useAppState();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // プロフィール切替時に表示設定を切り替える。出生情報は UserProfile に存在するためここでは扱わない。
    if (user) {
      setSettings({
        ...DEFAULT_SETTINGS,
        showCorrectedUntilMonths: user.settings.showCorrectedUntilMonths,
        ageFormat: user.settings.ageFormat,
        showDaysSinceBirth: user.settings.showDaysSinceBirth,
        lastViewedMonth: user.settings.lastViewedMonth,
      });
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
    setLoading(false);
  }, [user]);

  const updateSettings = useCallback(
    async (next: Partial<UserSettings>) => {
      if (!user) {
        console.warn("updateSettings skipped: active user not set");
        return;
      }
      // birthDate / dueDate は UserProfile 側でのみ編集するためここでは扱わない。
      const merged: UserSettings = { ...settings, ...next };
      setSettings(merged);
      await updateUser(user.id, {
        settings: {
          ...user.settings,
          showCorrectedUntilMonths: merged.showCorrectedUntilMonths,
          ageFormat: merged.ageFormat,
          showDaysSinceBirth: merged.showDaysSinceBirth,
          lastViewedMonth: merged.lastViewedMonth,
        },
      });
    },
    [settings, updateUser, user]
  );

  const resetSettings = useCallback(async () => {
    if (!user) {
      console.warn("resetSettings skipped: active user not set");
      return;
    }
    setSettings(DEFAULT_SETTINGS);
    await updateUser(user.id, {
      settings: {
        ...user.settings,
        showCorrectedUntilMonths: DEFAULT_SETTINGS.showCorrectedUntilMonths,
        ageFormat: DEFAULT_SETTINGS.ageFormat,
        showDaysSinceBirth: DEFAULT_SETTINGS.showDaysSinceBirth,
        lastViewedMonth: DEFAULT_SETTINGS.lastViewedMonth,
      },
    });
  }, [updateUser, user]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, loading, updateSettings, resetSettings }),
    [settings, loading, updateSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
};
