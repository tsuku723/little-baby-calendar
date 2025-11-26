export {
  AgeFormat,
  Achievement,
  AchievementStore,
  AchievementType,
  AgeInfo,
  CalendarDay,
  CalendarMonthView,
  AchievementListItem,
  UserSettings,
} from "../models/dataModels";

export const DEFAULT_SETTINGS: import("../models/dataModels").UserSettings = {
  birthDate: "",
  dueDate: null,
  showCorrectedUntilMonths: 24,
  ageFormat: "md",
  showDaysSinceBirth: true,
  lastViewedMonth: null,
};
