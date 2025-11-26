import {
  AgeFormat,
  AgeInfo,
  CalendarDay,
  CalendarMonthView,
  UserSettings,
} from "../models/dataModels";

// 年齢計算の中間表現（負の値は利用側で0に丸める）
type AgeParts = { years: number; months: number; days: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDateParts = (date: Date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

const daysInMonth = (year: number, month: number): number =>
  // month: 1-12, using 0 to reach the previous month end
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export const normalizeToUtcDate = (isoDate: string): Date => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

// 端末TZに依存しない日付オブジェクトを生成（時刻00:00 UTC固定）
export const toUtcDateOnly = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

// ISO日付文字列（YYYY-MM-DD）を返す
export const toIsoDateString = (date: Date): string => {
  const d = toUtcDateOnly(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 今日のISO日付（UTC丸め）
export const todayIsoDate = (): string => toIsoDateString(toUtcDateOnly(new Date()));

const diffYmdBorrow = (start: Date, end: Date): AgeParts => {
  // Spec: negative values are rounded to 0d
  if (end.getTime() < start.getTime()) {
    return { years: 0, months: 0, days: 0 };
  }

  const s = getDateParts(start);
  const e = getDateParts(end);

  let years = e.year - s.year;
  let months = e.month - s.month;
  let days = e.day - s.day;

  if (days < 0) {
    // Borrow from previous month of end date
    months -= 1;
    const prevMonth = e.month === 1 ? 12 : e.month - 1;
    const prevMonthYear = e.month === 1 ? e.year - 1 : e.year;
    days += daysInMonth(prevMonthYear, prevMonth);
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};

const formatAge = (parts: AgeParts, ageFormat: AgeFormat): string => {
  if (ageFormat === "md") {
    const totalMonths = parts.years * 12 + parts.months;
    return `m${totalMonths}d${parts.days}`;
  }
  return `y${parts.years}m${parts.months}d${parts.days}`;
};

const agesEqual = (a: AgeParts, b: AgeParts): boolean =>
  a.years === b.years && a.months === b.months && a.days === b.days;

const isWithinCorrectedLimit = (
  parts: AgeParts,
  limitMonths: number | null
): boolean => {
  // 表示上限を超えたら修正月齢を隠す
  if (limitMonths === null) return true;
  const totalMonths = parts.years * 12 + parts.months;
  // Hide when strictly over limit or exactly at limit with extra days
  if (totalMonths > limitMonths) return false;
  if (totalMonths === limitMonths && parts.days > 0) return false;
  return true;
};

export const daysBetweenUtc = (start: Date, end: Date): number => {
  const diff = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
  return diff < 0 ? 0 : diff;
};

export const calculateAgeInfo = (params: {
  targetDate: string;
  birthDate: string;
  dueDate: string | null;
  showCorrectedUntilMonths: number | null;
  ageFormat: AgeFormat;
}): AgeInfo => {
  // すべてUTC丸めした日付で計算する
  const target = normalizeToUtcDate(params.targetDate);
  const birth = normalizeToUtcDate(params.birthDate);
  const due = params.dueDate ? normalizeToUtcDate(params.dueDate) : null;

  const chronologicalParts = diffYmdBorrow(birth, target);

  const correctedBase =
    due && due.getTime() > birth.getTime() ? due : birth;
  const correctedParts = due
    ? diffYmdBorrow(correctedBase, target)
    : { years: 0, months: 0, days: 0 };

  const correctedVisible =
    Boolean(due) &&
    !agesEqual(chronologicalParts, correctedParts) &&
    isWithinCorrectedLimit(correctedParts, params.showCorrectedUntilMonths);

  return {
    chronological: {
      ...chronologicalParts,
      formatted: formatAge(chronologicalParts, params.ageFormat),
    },
    corrected: {
      ...correctedParts,
      formatted: correctedVisible
        ? formatAge(correctedParts, params.ageFormat)
        : null,
      visible: correctedVisible,
    },
    daysSinceBirth: daysBetweenUtc(birth, target),
  };
};

export const monthKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const startOfCalendarGrid = (anchor: Date): Date => {
  // 当月1日の曜日から逆算して6行×7列の開始日を決める
  const firstDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const startDay = firstDay.getUTCDay();
  const startDate = new Date(firstDay);
  startDate.setUTCDate(firstDay.getUTCDate() - startDay);
  return startDate;
};

export const buildCalendarMonthView = ({
  anchorDate,
  settings,
  achievementCountsByDay,
}: {
  anchorDate: Date;
  settings: UserSettings;
  achievementCountsByDay?: Record<string, number>;
}): CalendarMonthView => {
  // カレンダー表示用に42セルぶんのViewModelを構築
  const startDate = startOfCalendarGrid(anchorDate);
  const todayIso = todayIsoDate();
  const days: CalendarDay[] = [];

  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + offset);
    const iso = toIsoDateString(date);
    const isCurrentMonth =
      date.getUTCFullYear() === anchorDate.getUTCFullYear() &&
      date.getUTCMonth() === anchorDate.getUTCMonth();

    const hasBirth = Boolean(settings.birthDate);
    const ageInfo =
      hasBirth && iso
        ? calculateAgeInfo({
            targetDate: iso,
            birthDate: settings.birthDate,
            dueDate: settings.dueDate,
            showCorrectedUntilMonths: settings.showCorrectedUntilMonths,
            ageFormat: settings.ageFormat,
          })
        : null;

    days.push({
      date: iso,
      isCurrentMonth,
      isToday: iso === todayIso,
      ageInfo,
      hasAchievements: Boolean(achievementCountsByDay?.[iso]),
    });
  }

  return {
    year: anchorDate.getUTCFullYear(),
    month: anchorDate.getUTCMonth() + 1,
    days,
  };
};
