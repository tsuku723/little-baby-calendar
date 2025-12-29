import {
  AgeFormat,
  AgeInfo,
  CalendarDay,
  CalendarMonthView,
  UserSettings,
} from "../models/dataModels";

type AgeParts = { years: number; months: number; days: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isIsoDateString = (value: unknown): value is string =>
  typeof value === "string" && ISO_DATE_RE.test(value);

const getDateParts = (date: Date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const parseIsoDateStrict = (isoDate: string): Date | null => {
  if (!isIsoDateString(isoDate)) return null;

  const [y, m, d] = isoDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));

  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() + 1 !== m ||
    parsed.getUTCDate() !== d
  ) {
    return null;
  }

  return parsed;
};

export const normalizeToUtcDate = (isoDate: string | null | undefined): Date => {
  if (isoDate == null || isoDate === "") {
    console.warn("normalizeToUtcDate: isoDate が未定義です", isoDate);
    return new Date(NaN);
  }

  const parsed = parseIsoDateStrict(isoDate);
  if (!parsed) {
    console.warn("normalizeToUtcDate: isoDate が不正な形式です", isoDate);
    return new Date(NaN);
  }

  return parsed;
};

export const toUtcDateOnly = (date: Date): Date => {
  if (Number.isNaN(date.getTime())) {
    return new Date(NaN);
  }
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

export const toIsoDateString = (date: Date): string => {
  if (Number.isNaN(date.getTime())) {
    throw new Error("toIsoDateString: Invalid Date provided");
  }
  const d = toUtcDateOnly(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayIsoDate = (): string => toIsoDateString(toUtcDateOnly(new Date()));

const diffYmdBorrow = (start: Date, end: Date): AgeParts => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { years: 0, months: 0, days: 0 };
  }

  if (end.getTime() < start.getTime()) {
    return { years: 0, months: 0, days: 0 };
  }

  const s = getDateParts(start);
  const e = getDateParts(end);

  let years = e.year - s.year;
  let months = e.month - s.month;
  let days = e.day - s.day;

  if (days < 0) {
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
    return `${totalMonths}m${parts.days}d`;
  }
  return `${parts.years}y${parts.months}m${parts.days}d`;
};

const agesEqual = (a: AgeParts, b: AgeParts): boolean =>
  a.years === b.years && a.months === b.months && a.days === b.days;

const totalMonths = (parts: { years: number; months: number }): number =>
  parts.years * 12 + parts.months;

const formatCalendarAgeLabel = (
  parts: { years: number; months: number },
  ageFormat: AgeFormat,
  isCorrected: boolean
): string => {
  const labelPrefix = isCorrected ? "修正" : "";

  if (ageFormat === "md") {
    return `${labelPrefix}${totalMonths(parts)}カ月`;
  }

  return `${labelPrefix}${parts.years}歳${parts.months}か月`;
};

const isWithinCorrectedLimit = (
  parts: AgeParts,
  limitMonths: number | null
): boolean => {
  if (limitMonths === null) return true;
  const totalMonths = parts.years * 12 + parts.months;
  if (totalMonths > limitMonths) return false;
  if (totalMonths === limitMonths && parts.days > 0) return false;
  return true;
};

export const daysBetweenUtc = (start: Date, end: Date): number => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
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
  const target = normalizeToUtcDate(params.targetDate);
  const birth = normalizeToUtcDate(params.birthDate);
  const dueRaw = params.dueDate ? normalizeToUtcDate(params.dueDate) : null;
  const due = dueRaw && !Number.isNaN(dueRaw.getTime()) ? dueRaw : null;

  if (Number.isNaN(target.getTime()) || Number.isNaN(birth.getTime())) {
    throw new Error("calculateAgeInfo: Invalid date input");
  }

  const chronologicalParts = diffYmdBorrow(birth, target);

  const correctedBase = due && due.getTime() > birth.getTime() ? due : birth;
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
  const firstDay = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)
  );
  const startDay = firstDay.getUTCDay();
  const startDate = new Date(firstDay);
  startDate.setUTCDate(firstDay.getUTCDate() - startDay);
  return startDate;
};

// birthDate / dueDate は UserProfile 由来の値を受け取り、UserSettings には含めない。
export const buildCalendarMonthView = ({
  anchorDate,
  settings,
  birthDate,
  dueDate,
  achievementCountsByDay,
}: {
  anchorDate: Date;
  settings: UserSettings;
  birthDate: string | null;
  dueDate: string | null;
  achievementCountsByDay?: Record<string, number>;
}): CalendarMonthView => {
  const startDate = startOfCalendarGrid(anchorDate);
  const todayIso = todayIsoDate();
  const days: CalendarDay[] = [];
  const hasValidBirthDate = Boolean(birthDate) && isIsoDateString(birthDate);
  const normalizedDueDate = dueDate && isIsoDateString(dueDate) ? dueDate : null;
  let previousAgeInfo: AgeInfo | null = null;

  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + offset);
    const iso = toIsoDateString(date);
    const isCurrentMonth =
      date.getUTCFullYear() === anchorDate.getUTCFullYear() &&
      date.getUTCMonth() === anchorDate.getUTCMonth();

    const ageInfo =
      hasValidBirthDate && iso
        ? calculateAgeInfo({
            targetDate: iso,
            birthDate: birthDate as string,
            dueDate: normalizedDueDate,
            showCorrectedUntilMonths: settings.showCorrectedUntilMonths,
            ageFormat: settings.ageFormat,
          })
        : null;

    const chronologicalChanged =
      ageInfo &&
      previousAgeInfo &&
      totalMonths(ageInfo.chronological) === totalMonths(previousAgeInfo.chronological) + 1;

    const correctedVisible = Boolean(ageInfo?.corrected.visible && ageInfo.corrected.formatted);
    const previousCorrectedVisible = Boolean(
      previousAgeInfo?.corrected.visible && previousAgeInfo.corrected.formatted
    );
    const correctedChanged =
      correctedVisible &&
      previousCorrectedVisible &&
      totalMonths(ageInfo.corrected) === totalMonths(previousAgeInfo!.corrected) + 1;

    const calendarAgeLabel =
      ageInfo && (chronologicalChanged || correctedChanged)
        ? {
            chronological: chronologicalChanged
              ? formatCalendarAgeLabel(ageInfo.chronological, settings.ageFormat, false)
              : undefined,
            corrected: correctedChanged
              ? formatCalendarAgeLabel(ageInfo.corrected, settings.ageFormat, true)
              : undefined,
          }
        : null;

    days.push({
      date: iso,
      isCurrentMonth,
      isToday: iso === todayIso,
      ageInfo,
      calendarAgeLabel,
      achievementCount: achievementCountsByDay?.[iso] ?? 0,
      hasAchievements: (achievementCountsByDay?.[iso] ?? 0) > 0,
    });

    previousAgeInfo = ageInfo;
  }

  return {
    year: anchorDate.getUTCFullYear(),
    month: anchorDate.getUTCMonth() + 1,
    days,
  };
};
