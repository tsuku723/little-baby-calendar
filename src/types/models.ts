export type AgeFormat = "md" | "ymd";

export interface UserSettings {
  id: "settings";
  birthDate: string;
  dueDate: string | null;
  showCorrectedUntilMonths: number;
  ageFormat: AgeFormat;
  lastViewedMonth: string | null;
}

export type AchievementType = "できた" | "がんばった";

export interface Achievement {
  id: string;
  date: string;
  type: AchievementType;
  comment: string;
  photoUri?: string | null;
  createdAt: string;
  updatedAt: string;
  yyyymm: string;
  yyyy_mm_dd: string;
}

export const SETTINGS_ID: UserSettings["id"] = "settings";

export const DEFAULT_SETTINGS: UserSettings = {
  id: SETTINGS_ID,
  birthDate: "",
  dueDate: null,
  showCorrectedUntilMonths: 24,
  ageFormat: "md",
  lastViewedMonth: null,
};

export interface AgeParts {
  y: number;
  m: number;
  d: number;
}

export interface AgeLabels {
  chronological: string;
  corrected?: string;
  suppressed: boolean;
}
