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

describe('DayCell UI branches', () => {
  test('renders gestational and hides corrected when both exist', () => {
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

  test('strips chronological legacy prefix and calls onPress', () => {
    const onPress = jest.fn();
    const day: CalendarDay = {
      ...baseDay,
      calendarAgeLabel: { chronological: '月齢 1才2ヶ月' },
    };

    const { getByRole, queryByText } = render(<DayCell day={day} onPress={onPress} />);
    fireEvent.press(getByRole('button'));

    expect(queryByText('1才2ヶ月')).toBeTruthy();
    expect(queryByText('月齢 1才2ヶ月')).toBeNull();
    expect(onPress).toHaveBeenCalledWith('2026-01-10');
  });

  test('hides labels in non-current month cells', () => {
    const { queryByText } = render(
      <DayCell
        day={{
          ...baseDay,
          isCurrentMonth: false,
          calendarAgeLabel: { chronological: '暦 2才0ヶ月', corrected: '修正 1才11ヶ月' },
        }}
        onPress={jest.fn()}
      />
    );

    expect(queryByText('2才0ヶ月')).toBeNull();
    expect(queryByText('修正 1才11ヶ月')).toBeNull();
  });
});
