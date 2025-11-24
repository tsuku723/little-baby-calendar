import { AgeFormat, AgeLabels, AgeParts, UserSettings } from "@/types/models";
import { ageToLabel, chronologicalAge, correctedAge, dayKey, toUTCDateOnly } from "@/utils/date";

export interface AgeComputationInput {
  settings: Pick<UserSettings, "birthDate" | "dueDate" | "ageFormat" | "showCorrectedUntilMonths">;
  isoDay: string;
}

const correctedLimitReached = (
  base: Date,
  target: Date,
  limitMonths: number
): boolean => {
  if (limitMonths >= 999) {
    return false;
  }
  const limitDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + limitMonths, base.getUTCDate()));
  return target.getTime() > limitDate.getTime();
};

export const computeAgeLabels = ({ settings, isoDay }: AgeComputationInput): AgeLabels => {
  if (!settings.birthDate) {
    return { chronological: "0d", suppressed: true };
  }

  const birthDate = toUTCDateOnly(settings.birthDate);
  const targetDate = toUTCDateOnly(isoDay);
  const dueDate = settings.dueDate ? toUTCDateOnly(settings.dueDate) : null;

  const chronological = chronologicalAge(targetDate, birthDate);
  const chronologicalLabel = ageToLabel(chronological, settings.ageFormat);

  if (!dueDate) {
    return { chronological: chronologicalLabel, suppressed: true };
  }

  const correctedBase = birthDate.getTime() > dueDate.getTime() ? birthDate : dueDate;
  const corrected = correctedAge(targetDate, birthDate, dueDate);
  const correctedLabel = ageToLabel(corrected, settings.ageFormat);

  const suppressed =
    correctedLabel === chronologicalLabel || correctedLimitReached(correctedBase, targetDate, settings.showCorrectedUntilMonths);

  return suppressed
    ? { chronological: chronologicalLabel, suppressed: true }
    : { chronological: chronologicalLabel, corrected: correctedLabel, suppressed: false };
};

export const ensureDayKey = (input: string | Date): string => {
  if (typeof input === "string") {
    return dayKey(toUTCDateOnly(input));
  }
  return dayKey(toUTCDateOnly(input));
};

export const formatAgeParts = (parts: AgeParts, format: AgeFormat): string => ageToLabel(parts, format);
