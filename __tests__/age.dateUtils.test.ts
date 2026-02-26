import assert from "node:assert/strict";

import { buildCalendarMonthView, calculateAgeInfo } from "../src/utils/dateUtils";

const hasNegativeSign = (value: string) => value.includes("-");

const shouldShowDaysText = (showDaysSinceBirth: boolean, daysSinceBirth: number): string | null =>
  showDaysSinceBirth ? `生まれてから${daysSinceBirth}日目` : null;

const monthEnd = calculateAgeInfo({
  targetDate: "2025-03-01",
  birthDate: "2025-01-31",
  dueDate: null,
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(hasNegativeSign(monthEnd.chronological.formatted), false);
assert.equal(monthEnd.chronological.days >= 0, true);

const leap28 = calculateAgeInfo({
  targetDate: "2024-03-28",
  birthDate: "2024-02-29",
  dueDate: null,
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(leap28.chronological.days >= 0, true);

const leap29 = calculateAgeInfo({
  targetDate: "2024-03-29",
  birthDate: "2024-02-29",
  dueDate: null,
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(leap29.chronological.days >= 0, true);

const preterm258 = calculateAgeInfo({
  targetDate: "2025-02-01",
  birthDate: "2025-01-01",
  dueDate: "2025-01-23", // 22日差 -> 280-22=258
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(preterm258.flags.isPreterm, true);

const term259 = calculateAgeInfo({
  targetDate: "2025-02-01",
  birthDate: "2025-01-01",
  dueDate: "2025-01-22", // 21日差 -> 280-21=259
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(term259.flags.isPreterm, false);

const beforeDue = calculateAgeInfo({
  targetDate: "2025-01-20",
  birthDate: "2025-01-01",
  dueDate: "2025-01-23",
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(beforeDue.gestational.visible, true);
assert.equal(beforeDue.corrected.visible, false);

const onDue = calculateAgeInfo({
  targetDate: "2025-01-23",
  birthDate: "2025-01-01",
  dueDate: "2025-01-23",
  showCorrectedUntilMonths: null,
  ageFormat: "md",
});
assert.equal(onDue.corrected.visible, true);
assert.equal(onDue.corrected.formatted, "0ヶ月0日");
assert.equal(onDue.gestational.visible, false);

assert.equal(shouldShowDaysText(false, onDue.daysSinceBirth), null);


const settings = {
  ageFormat: "md" as const,
  showCorrectedUntilMonths: null,
  showDaysSinceBirth: false,
  lastViewedMonth: null,
};

const februaryView = buildCalendarMonthView({
  anchorDate: new Date(2025, 1, 1),
  settings,
  birthDate: "2025-01-01",
  dueDate: "2025-03-01",
});
const februaryFirst = februaryView.days.find((day) => day.date === "2025-02-01");
assert.equal(februaryFirst?.calendarAgeLabel?.chronological, "暦 1ヶ月");

const marchView = buildCalendarMonthView({
  anchorDate: new Date(2025, 2, 1),
  settings,
  birthDate: "2025-01-01",
  dueDate: "2025-03-01",
});
const marchFirst = marchView.days.find((day) => day.date === "2025-03-01");
assert.equal(marchFirst?.calendarAgeLabel?.chronological, "暦 2ヶ月");
assert.equal(marchFirst?.calendarAgeLabel?.corrected, "修正 0ヶ月");

console.log("age.dateUtils tests passed");
