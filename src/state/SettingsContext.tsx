import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { UserSettings } from "@/models/dataModels";
import { loadUserSettings, saveUserSettings } from "@/storage/storage";
import { DEFAULT_SETTINGS } from "@/types/models";

interface SettingsContextValue {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (next: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 起動時に永続化された設定を読み込む
    (async () => {
      const stored = await loadUserSettings();
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...stored });
      }
      setLoading(false);
    })();
  }, []);

  const updateSettings = useCallback(async (next: Partial<UserSettings>) => {
    // 差分更新し、そのまま永続化
    let merged: UserSettings = DEFAULT_SETTINGS;
    setSettings((prev) => {
      merged = { ...prev, ...next } as UserSettings;
      return merged;
    });
    await saveUserSettings(merged);
  }, []);

  const resetSettings = useCallback(async () => {
    // 初期値に戻して保存
    setSettings(DEFAULT_SETTINGS);
    await saveUserSettings(DEFAULT_SETTINGS);
  }, []);

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
