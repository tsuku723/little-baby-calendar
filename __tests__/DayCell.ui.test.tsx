import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import DayCell from '../src/components/DayCell';
import { CalendarDay } from '../src/models/dataModels';

const baseDay: CalendarDay = {
  date: '2026-01-10',
  isCurrentMonth: true,
  isToday: false,
  ageInfo: null,
  calendarAgeLabel: null,
  achievementCount: 0,
  hasAchievements: false,
};

describe('DayCell', () => {
  test('renders chronological label without legacy prefix', () => {
    const day: CalendarDay = {
      ...baseDay,
      calendarAgeLabel: { chronological: '暦 1才2ヶ月' },
    };

    const { queryByText } = render(<DayCell day={day} onPress={jest.fn()} />);
    expect(queryByText('暦 1才2ヶ月')).toBeNull();
    expect(queryByText('1才2ヶ月')).toBeTruthy();
  });

  test('renders gestational label as top label and hides corrected label', () => {
    const day: CalendarDay = {
      ...baseDay,
      calendarAgeLabel: {
        chronological: '暦 1才2ヶ月',
        corrected: '修正 0才1ヶ月',
        gestational: '在胎 35週0日',
      },
    };

    const { queryByText } = render(<DayCell day={day} onPress={jest.fn()} />);
    expect(queryByText('在胎 35週0日')).toBeTruthy();
    expect(queryByText('修正 0才1ヶ月')).toBeNull();
  });

  test('calls onPress with ISO date', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<DayCell day={baseDay} onPress={onPress} />);

    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('2026-01-10');
  });
});
