import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import DayCell from "@/components/DayCell";
import { CalendarDay } from "@/models/dataModels";

interface Props {
  days: CalendarDay[];
  onPressDay: (iso: string) => void;
}

const CalendarGrid: React.FC<Props> = ({ days, onPressDay }) => {
  const rows = useMemo(() => {
    const chunks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  return (
    <View style={[styles.container, { flex: 1 }]}>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.row}>
          {row.map((day) => (
            <DayCell key={day.date} day={day} onPress={onPressDay} />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: "row",
  },
});

export default CalendarGrid;
