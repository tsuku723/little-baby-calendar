import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { UserSettings } from "@/models/dataModels";
import { DEFAULT_SETTINGS } from "@/types/models";
import { useActiveUser, useAppState } from "@/state/AppStateContext";

// SettingsContext も profileId ごとに設定を分離する。
// birthDate / dueDate は UserProfile に属するため、SettingsContext は AppStateContext 経由でのみ読書きする。

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
    // プロフィール切替時に設定を切り替える。別プロフィールの設定を混在させないため必ず activeUser を参照。
    if (user) {
      setSettings({
        ...DEFAULT_SETTINGS,
        birthDate: user.birthDate,
        dueDate: user.dueDate,
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
      // birthDate / dueDate はプロフィール情報として updateUser に渡す。その他は settings 配下に保持。
      const merged: UserSettings = { ...settings, ...next };
      setSettings(merged);
      await updateUser(user.id, {
        birthDate: merged.birthDate,
        dueDate: merged.dueDate ?? null,
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
      birthDate: DEFAULT_SETTINGS.birthDate,
      dueDate: DEFAULT_SETTINGS.dueDate,
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
