import { buildCalendarMonthView, calculateAgeInfo } from '../src/utils/dateUtils';

describe('calculateAgeInfo', () => {
  test('keeps chronological age non-negative around month-end', () => {
    const monthEnd = calculateAgeInfo({ targetDate: '2025-03-01', birthDate: '2025-01-31', dueDate: null, showCorrectedUntilMonths: null, ageFormat: 'md' });
    expect(monthEnd.chronological.formatted.includes('-')).toBe(false);
    expect(monthEnd.chronological.days).toBeGreaterThanOrEqual(0);
  });

  test('switches from gestational to corrected around due date', () => {
    const beforeDue = calculateAgeInfo({ targetDate: '2025-01-20', birthDate: '2025-01-01', dueDate: '2025-01-23', showCorrectedUntilMonths: null, ageFormat: 'md' });
    const onDue = calculateAgeInfo({ targetDate: '2025-01-23', birthDate: '2025-01-01', dueDate: '2025-01-23', showCorrectedUntilMonths: null, ageFormat: 'md' });
    expect(beforeDue.gestational.visible).toBe(true);
    expect(onDue.corrected.formatted).toBe('0ヶ月0日');
  });

  test('gestational is not visible before birth date', () => {
    // 出生日前は在胎表示しない（#89）
    const beforeBirth = calculateAgeInfo({ targetDate: '2026-02-01', birthDate: '2026-03-18', dueDate: '2026-05-18', showCorrectedUntilMonths: null, ageFormat: 'md' });
    expect(beforeBirth.gestational.visible).toBe(false);
    expect(beforeBirth.gestational.formatted).toBeNull();
  });
});

describe('buildCalendarMonthView', () => {
  test('shows corrected labels only on due-date anniversary', () => {
    const settings = { ageFormat: 'ymd' as const, showCorrectedUntilMonths: null, showDaysSinceBirth: true, lastViewedMonth: null };
    const view = buildCalendarMonthView({ anchorDate: new Date(2026, 0, 1), settings, birthDate: '2025-11-11', dueDate: '2026-01-10' });
    expect(view.days.find((d) => d.date === '2026-01-09')?.calendarAgeLabel?.corrected).toBeUndefined();
    expect(view.days.find((d) => d.date === '2026-01-10')?.calendarAgeLabel?.corrected).toBe('修正 0才0ヶ月');
  });
});
