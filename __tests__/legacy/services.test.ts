import AsyncStorage from "@react-native-async-storage/async-storage";

import { computeAgeLabels } from "@/services/AgeService";
import {
  queryMonthCounts,
  saveAchievement,
  listAchievementsByDay,
  loadSettings,
  saveSettings,
} from "@/services/StorageService";
import { DEFAULT_SETTINGS, UserSettings } from "@/types/models";
import { remainingChars } from "@/utils/text";

describe("AgeService", () => {
  const baseSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    birthDate: "2025-10-01",
    dueDate: "2025-12-01",
    showCorrectedUntilMonths: 24,
  };

  it("shows chronological age only when due date missing", () => {
    const labels = computeAgeLabels({ settings: { ...baseSettings, dueDate: null }, isoDay: "2025-11-15" });
    expect(labels.chronological).toBe("1m14d");
    expect(labels.corrected).toBeUndefined();
    expect(labels.suppressed).toBe(true);
  });

  it("keeps corrected age at 0d before due date", () => {
    const labels = computeAgeLabels({ settings: baseSettings, isoDay: "2025-11-15" });
    expect(labels.chronological).toBe("1m14d");
    expect(labels.corrected).toBe("0d");
  });

  it("advances corrected age after due date", () => {
    const labels = computeAgeLabels({ settings: baseSettings, isoDay: "2026-01-15" });
    expect(labels.chronological).toBe("3m14d");
    expect(labels.corrected).toBe("1m14d");
  });

  it("suppresses corrected age beyond limit", () => {
    const labels = computeAgeLabels({ settings: baseSettings, isoDay: "2028-01-01" });
    expect(labels.suppressed).toBe(true);
    expect(labels.corrected).toBeUndefined();
  });
});

describe("StorageService achievements", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("counts achievements per day within a month", async () => {
    await saveAchievement({ date: "2025-11-03", type: "できた", comment: "test" });
    await saveAchievement({ date: "2025-11-03", type: "がんばった", comment: "second" });
    await saveAchievement({ date: "2025-11-12", type: "できた", comment: "third" });
    await saveAchievement({ date: "2025-12-01", type: "できた", comment: "other" });

    const map = await queryMonthCounts("2025-11");
    expect(map).toEqual({
      "2025-11-03": 2,
      "2025-11-12": 1,
    });
  });

  it("lists achievements by day in chronological order", async () => {
    const first = await saveAchievement({ date: "2025-11-05", type: "できた", comment: "first" });
    const second = await saveAchievement({ date: "2025-11-05", type: "がんばった", comment: "second" });

    const list = await listAchievementsByDay("2025-11-05");
    expect(list[0].id).toBe(first.id);
    expect(list[1].id).toBe(second.id);
  });
});

describe("Settings persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("loads default settings when storage empty", async () => {
    const settings = await loadSettings();
    expect(settings.birthDate).toBe("");
  });

  it("persists updated settings", async () => {
    const updated: UserSettings = {
      ...DEFAULT_SETTINGS,
      birthDate: "2025-10-01",
      dueDate: "2025-12-01",
      showCorrectedUntilMonths: 36,
      ageFormat: "ymd",
      lastViewedMonth: "2025-11-01",
    };
    await saveSettings(updated);
    const loaded = await loadSettings();
    expect(loaded).toMatchObject(updated);
  });
});

describe("remainingChars", () => {
  it("counts unicode code points", () => {
    expect(remainingChars("a")).toBe(499);
    expect(remainingChars("😀".repeat(3))).toBe(497);
  });
});
