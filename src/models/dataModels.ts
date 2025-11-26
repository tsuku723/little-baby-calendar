export type AgeFormat = "md" | "ymd";

export type UserSettings = {
  birthDate: string; // ISODateString e.g. "2025-10-01"
  dueDate: string | null; // ISODateString or null
  showCorrectedUntilMonths: number | null; // 24 | 36 | null (no limit)
  ageFormat: AgeFormat;
  showDaysSinceBirth: boolean;
  lastViewedMonth: string | null; // ISODateString for first day of month, e.g. "2026-04-01"
};

export type AchievementType = "did" | "tried";

export type Achievement = {
  id: string;
  date: string; // ISODateString normalized to UTC midnight
  type: AchievementType;
  title: string;
  memo?: string;
  createdAt: string; // ISODateTime
  updatedAt?: string;
};

export type AchievementStore = {
  achievements: Achievement[];
};

export type AgeInfo = {
  chronological: {
    years: number;
    months: number;
    days: number;
    formatted: string;
  };
  corrected: {
    years: number;
    months: number;
    days: number;
    formatted: string | null;
    visible: boolean;
  };
  daysSinceBirth: number;
};

export type CalendarDay = {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  ageInfo: AgeInfo | null;
  hasAchievements: boolean;
};

export type CalendarMonthView = {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
};

export type AchievementListItem = {
  id: string;
  date: string;
  dateLabel: string;
  type: AchievementType;
  typeLabel: string;
  title: string;
};
