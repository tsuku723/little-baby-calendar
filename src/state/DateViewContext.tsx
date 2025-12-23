import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { toUtcDateOnly } from "@/utils/dateUtils";

// DateViewContext is responsible for providing a shared "selectedDate" across
// date-centric views (Today / Calendar / record-related screens). It deliberately
// exposes a focused API to avoid leaking state management details and to allow
// future extensions such as persistence.
type DateViewContextValue = {
  selectedDate: Date;
  today: Date;
  selectDateFromCalendar: (date: Date) => void;
  resetToToday: () => void;
};

const DateViewContext = createContext<DateViewContextValue | undefined>(undefined);

const normalizeToStartOfDay = (date: Date): Date => {
  // Normalize to the start of the day (00:00 UTC) to avoid time component drift when
  // comparing or highlighting dates (e.g., "today" checks in Calendar cells).
  return toUtcDateOnly(date);
};

export const DateViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // today is captured once per provider instantiation to represent the anchor day
  // for the session. This allows selectedDate to be initialized and reset
  // consistently without re-computing new Date() on every render.
  const today = useMemo(() => normalizeToStartOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const selectDateFromCalendar = useCallback((date: Date) => {
    // Calendar is the single source of date selection; wrap the setter to keep
    // the public API intentional and narrow.
    setSelectedDate(normalizeToStartOfDay(date));
  }, []);

  const resetToToday = useCallback(() => {
    // Use a new Date instance to ensure state updates even if the date value is unchanged
    // (React state setters are referentially sensitive).
    setSelectedDate(new Date(today));
  }, [today]);

  const value = useMemo(
    () => ({
      selectedDate,
      today,
      selectDateFromCalendar,
      resetToToday,
    }),
    [selectedDate, today, selectDateFromCalendar, resetToToday]
  );

  return <DateViewContext.Provider value={value}>{children}</DateViewContext.Provider>;
};

export const useDateViewContext = (): DateViewContextValue => {
  const context = useContext(DateViewContext);
  if (!context) {
    throw new Error("useDateViewContext must be used within a DateViewProvider");
  }
  return context;
};

export default DateViewContext;
