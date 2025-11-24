import { AgeFormat, AgeParts } from "@/types/models";

export const toUTCDateOnly = (d: Date | string): Date => {
  const x = typeof d === "string" ? new Date(d) : d;
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
};

export const dayKey = (d: Date): string =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

export const monthKey = (d: Date): string => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export const diffYMD = (target: Date, base: Date): AgeParts => {
  let y = target.getUTCFullYear() - base.getUTCFullYear();
  let m = target.getUTCMonth() - base.getUTCMonth();
  let d = target.getUTCDate() - base.getUTCDate();

  if (d < 0) {
    const prevMonthEnd = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), 0)).getUTCDate();
    d += prevMonthEnd;
    m -= 1;
  }

  if (m < 0) {
    m += 12;
    y -= 1;
  }

  if (y < 0) {
    return { y: 0, m: 0, d: 0 };
  }

  return { y, m, d };
};

export const chronologicalAge = (on: Date, birth: Date): AgeParts => {
  if (on.getTime() < birth.getTime()) {
    return { y: 0, m: 0, d: 0 };
  }
  return diffYMD(on, birth);
};

export const correctedAge = (on: Date, birth: Date, due?: Date | null): AgeParts => {
  const base = !due || birth.getTime() > due.getTime() ? birth : due;
  if (on.getTime() < base.getTime()) {
    return { y: 0, m: 0, d: 0 };
  }
  return diffYMD(on, base);
};

export const ageToLabel = (a: AgeParts, mode: AgeFormat = "md"): string => {
  if (mode === "ymd") {
    const ys = a.y ? `${a.y}y` : "";
    const ms = a.y || a.m ? `${a.m}m` : "";
    const ds = `${a.d}d`;
    const parts = [ys, ms, ds].filter(Boolean);
    return parts.length ? parts.join("") : "0d";
  }
  const totalMonths = a.y * 12 + a.m;
  const ms = totalMonths ? `${totalMonths}m` : "";
  const ds = `${a.d}d`;
  const parts = [ms, ds].filter(Boolean);
  return parts.length ? parts.join("") : "0d";
};

export const getAnchorMonthDate = (isoMonth: string | null, fallback: Date): Date => {
  if (!isoMonth) {
    return toUTCDateOnly(fallback);
  }
  const [year, month] = isoMonth.split("-").map((n) => parseInt(n, 10));
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return toUTCDateOnly(fallback);
  }
  return new Date(Date.UTC(year, month - 1, 1));
};

export interface CalendarCell {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const buildCalendarMatrix = (anchor: Date): CalendarCell[][] => {
  const firstDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const startDay = firstDay.getUTCDay();
  const matrix: CalendarCell[][] = [];
  const todayIso = dayKey(toUTCDateOnly(new Date()));

  const startDate = new Date(firstDay);
  startDate.setUTCDate(startDate.getUTCDate() - startDay);

  for (let week = 0; week < 6; week += 1) {
    const row: CalendarCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const cellDate = new Date(startDate);
      cellDate.setUTCDate(startDate.getUTCDate() + week * 7 + day);
      const iso = dayKey(cellDate);
      row.push({
        date: cellDate,
        iso,
        isCurrentMonth:
          cellDate.getUTCFullYear() === anchor.getUTCFullYear() &&
          cellDate.getUTCMonth() === anchor.getUTCMonth(),
        isToday: iso === todayIso,
      });
    }
    matrix.push(row);
  }
  return matrix;
};

export const addMonthsUTC = (date: Date, months: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

