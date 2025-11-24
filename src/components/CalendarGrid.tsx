import React from "react";
import { StyleSheet, View } from "react-native";

import DayCell from "@/components/DayCell";
import { CalendarCell } from "@/utils/date";

interface Props {
  matrix: CalendarCell[][];
  countsByDay: Record<string, number>;
  onPressDay: (iso: string) => void;
}

const CalendarGrid: React.FC<Props> = ({ matrix, countsByDay, onPressDay }) => (
  <View style={styles.container}>
    {matrix.map((row, idx) => (
      <View key={idx} style={styles.row}>
        {row.map((cell) => (
          <DayCell key={cell.iso} cell={cell} count={countsByDay[cell.iso]} onPress={onPressDay} />
        ))}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});

export default CalendarGrid;
