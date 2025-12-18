/**
 * ⚠️ IMPORTANT（MVP設計方針）
 *
 * この SettingsContext は、過去の「即時反映」設計の名残として残している。
 *
 * 現在のMVP仕様では：
 * - 表示設定（UserSettings）は ProfileEditScreen で編集し
 * - 「保存」押下時にのみ AppStateContext.updateUser 経由で反映・永続化する
 *
 * そのため、この SettingsContext は
 * ❌ 新規実装では使用してはならない
 * ❌ 画面から直接 updateSettings / resetSettings を呼んではならない
 *
 * 表示設定の参照は必ず
 *   useActiveUser().settings
 * を使用すること。
 *
 * 本 Context は将来の再設計または削除候補である。
 */
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

// NOTE:
// SettingsContext は MVP では使用しない。
// 表示設定の単一の正は AppStateContext.user.settings とする。
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
  /**
   * ⚠️ WARNING
   *
   * このフックは MVP では使用禁止。
   * ProfileEditScreen 以外で表示設定を変更・参照する設計は禁止されている。
   */
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
};
