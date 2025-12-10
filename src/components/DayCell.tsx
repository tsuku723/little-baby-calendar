import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalendarDay } from "@/models/dataModels";

interface Props {
  day: CalendarDay;
  onPress: (iso: string) => void;
}

const DayCell: React.FC<Props> = ({ day, onPress }) => {
  const isDimmed = !day.isCurrentMonth;
  const dateNumber = parseInt(day.date.slice(-2), 10);
  const chronological = day.ageInfo?.chronological.formatted ?? "";
  const correctedVisible = day.ageInfo?.corrected.visible && day.ageInfo?.corrected.formatted;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress(day.date)}
      style={[styles.container, day.isToday && styles.today, isDimmed && styles.dimmed]}
    >
      <Text style={[styles.dateLabel, isDimmed && styles.dateDimmed]}>{dateNumber}</Text>
      <Text style={[styles.age, isDimmed && styles.ageDimmed]} numberOfLines={1}>
        {chronological}
      </Text>
      <Text style={[styles.corrected, !correctedVisible && styles.hidden, isDimmed && styles.ageDimmed]} numberOfLines={1}>
        {correctedVisible ? `修: ${day.ageInfo?.corrected.formatted}` : " "}
      </Text>
      {day.hasAchievements ? <View style={styles.dot} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#E6E2DA",
    padding: 6,
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
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
  age: {
    fontSize: 12,
    color: "#3A3A3A",
  },
  corrected: {
    fontSize: 12,
    color: "#3A86FF",
  },
  ageDimmed: {
    color: "#9C968C",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7A59",
    alignSelf: "flex-end",
  },
  hidden: {
    opacity: 0,
  },
});

export default DayCell;
