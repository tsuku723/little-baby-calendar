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

  test('applies border/today/icon branches based on props', () => {
    const day: CalendarDay = {
      ...baseDay,
      isToday: true,
      achievementCount: 2,
      calendarAgeLabel: { chronological: '暦 1才0ヶ月', corrected: '修正 11ヶ月' },
    };

    const { getByRole, queryByText, UNSAFE_queryAllByType } = render(
      <DayCell
        day={day}
        onPress={jest.fn()}
        gridPos={{ rowIndex: 0, colIndex: 6, isLastRow: true, isLastCol: true }}
      />
    );

    const rawStyle = getByRole('button').props.style;
    const styleArray = Array.isArray(rawStyle) ? rawStyle : [rawStyle];
    const merged = Object.assign({}, ...styleArray.filter(Boolean));
    expect(merged.borderRightWidth).toBe(0);
    expect(merged.borderBottomWidth).toBe(0);

    expect(queryByText('10')).toBeTruthy();
    expect(queryByText('修正 11ヶ月')).toBeTruthy();
    expect(UNSAFE_queryAllByType(require('react-native').View).length).toBeGreaterThan(0);
  });

  test('renders blank age lines for current-month day without age labels', () => {
    const { queryAllByText } = render(
      <DayCell
        day={{
          ...baseDay,
          isCurrentMonth: true,
          calendarAgeLabel: null,
        }}
        onPress={jest.fn()}
      />
    );

    expect(queryAllByText(' ')).toHaveLength(2);
  });

});
