import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalendarCell } from "@/utils/date";

interface Props {
  cell: CalendarCell;
  count?: number;
  onPress: (iso: string) => void;
}

const DayCell: React.FC<Props> = ({ cell, count = 0, onPress }) => {
  const isDimmed = !cell.isCurrentMonth;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress(cell.iso)}
      style={[styles.container, cell.isToday && styles.today, isDimmed && styles.dimmed]}
    >
      <Text style={[styles.dateLabel, isDimmed && styles.dateDimmed]}>{cell.date.getUTCDate()}</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>💮×{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: "#E6E2DA",
    padding: 6,
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  today: {
    borderColor: "#3A86FF",
    borderWidth: 2,
  },
  dimmed: {
    backgroundColor: "#FAF7F0",
  },
  dateLabel: {
    fontSize: 16,
    color: "#2E2A27",
    fontWeight: "500",
  },
  dateDimmed: {
    color: "#9C968C",
  },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    color: "#3A86FF",
  },
});

export default DayCell;
