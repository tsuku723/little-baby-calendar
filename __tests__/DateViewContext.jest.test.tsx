import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

jest.mock('../src/utils/dateUtils', () => ({
  toUtcDateOnly: jest.fn((d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))),
}));

import { DateViewProvider, useDateViewContext } from '../src/state/DateViewContext';
import { toUtcDateOnly } from '../src/utils/dateUtils';

describe('DateViewContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('useDateViewContext throws outside provider', () => {
    const Probe = () => {
      useDateViewContext();
      return <Text>no</Text>;
    };

    expect(() => render(<Probe />)).toThrow('useDateViewContext must be used within a DateViewProvider');
  });

  test('provider initializes selectedDate and today with normalized values', () => {
    let captured: ReturnType<typeof useDateViewContext> | null = null;

    const Probe = () => {
      captured = useDateViewContext();
      return <Text>ok</Text>;
    };

    render(
      <DateViewProvider>
        <Probe />
      </DateViewProvider>
    );

    expect(captured).not.toBeNull();
    expect(toUtcDateOnly).toHaveBeenCalled();
    expect(captured!.selectedDate.getTime()).toBe(captured!.today.getTime());
  });

  test('selectDateFromCalendar normalizes selectedDate', () => {
    let captured: ReturnType<typeof useDateViewContext> | null = null;

    const Probe = () => {
      captured = useDateViewContext();
      return <Text>{captured.selectedDate.toISOString()}</Text>;
    };

    render(
      <DateViewProvider>
        <Probe />
      </DateViewProvider>
    );

    const target = new Date('2026-01-17T13:22:10.111Z');
    act(() => {
      captured!.selectDateFromCalendar(target);
    });

    expect(toUtcDateOnly).toHaveBeenCalledWith(target);
    expect(captured!.selectedDate.toISOString()).toBe('2026-01-17T00:00:00.000Z');
  });

  test('resetToToday resets selectedDate to same time value as today with new instance', () => {
    let captured: ReturnType<typeof useDateViewContext> | null = null;

    const Probe = () => {
      captured = useDateViewContext();
      return <Text>ok</Text>;
    };

    render(
      <DateViewProvider>
        <Probe />
      </DateViewProvider>
    );

    const previousSelected = captured!.selectedDate;
    act(() => {
      captured!.selectDateFromCalendar(new Date('2028-05-01T10:00:00.000Z'));
    });

    act(() => {
      captured!.resetToToday();
    });

    expect(captured!.selectedDate.getTime()).toBe(captured!.today.getTime());
    expect(captured!.selectedDate).not.toBe(previousSelected);
  });
});
