// ---------------------------------------
// 基本設定
// ---------------------------------------

export type AgeFormat = "md" | "ymd";

// UserSettings はプロフィールに紐付かない表示設定のみを扱う。
// birthDate / dueDate は UserProfile 側で保持し、ここでは扱わない。
export type UserSettings = {
  showCorrectedUntilMonths: number | null;
  ageFormat: AgeFormat;
  showDaysSinceBirth: boolean;
  lastViewedMonth: string | null; // "YYYY-MM-DD"
};

// ---------------------------------------
// Achievement（実績）
// ---------------------------------------

export type AchievementType = "did" | "tried";

export type Achievement = {
  id: string;
  date: string;        // normalized ISO "YYYY-MM-DD"
  type: AchievementType;
  title: string;
  memo?: string;
  photoPath?: string;  // アプリ内に保存した JPEG のファイルパス

  // storage.ts に合わせて「必須」に統一
  createdAt: string;   // ISO datetime
  updatedAt: string;   // ISO datetime（optional ではない）
};

// ---------------------------------------
// 永続化全体（辞書形式）
// ---------------------------------------
// storage.ts は Record<string, Achievement[]> を使うため、
// この形式に合わせる必要がある。

export type AchievementStore = Record<string, Achievement[]>;

// ---------------------------------------
// (任意) DailyRecord
// ---------------------------------------
// カレンダー1日の情報として使いたい場合用。
// ただし辞書形式の key/value がそのまま DailyRecord になるため、
// 「仕様上は不要」。使う場合のみ定義を正しくする。

export type DailyRecord = {
  date: string;
  items: Achievement[];
};

// ---------------------------------------
// 年齢情報
// ---------------------------------------

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

// ---------------------------------------
// カレンダー
// ---------------------------------------

export type CalendarDay = {
  date: string;              // "YYYY-MM-DD"
  isCurrentMonth: boolean;
  isToday: boolean;
  ageInfo: AgeInfo | null;

  achievementCount: number;

  // 永続化は配列のため hasAchievements は boolean のままでOK
  hasAchievements: boolean;
};

export type CalendarMonthView = {
  year: number;
  month: number;
  days: CalendarDay[];
};

// ---------------------------------------
// 一覧表示用
// ---------------------------------------

export type AchievementListItem = {
  id: string;
  date: string;      // YYYY-MM-DD
  dateLabel: string;
  type: AchievementType;
  typeLabel: string;
  title: string;
};
