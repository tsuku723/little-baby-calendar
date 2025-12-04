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
  const correctedVisible =
    day.ageInfo?.corrected.visible && day.ageInfo?.corrected.formatted;
  const corrected = correctedVisible ? `修: ${day.ageInfo?.corrected.formatted}` : "";

  const hasAchievements = day.achievementCount > 0;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress(day.date)}
      style={[
        styles.container,
        day.isToday && styles.today,
        isDimmed && styles.dimmed,
      ]}
    >
      <Text style={[styles.dateLabel, isDimmed && styles.dateDimmed]}>
        {dateNumber}
      </Text>

      <Text style={[styles.age, isDimmed && styles.ageDimmed]}>
        {chronological}
      </Text>

      {correctedVisible ? (
        <Text style={[styles.corrected, isDimmed && styles.ageDimmed]}>
          {corrected}
        </Text>
      ) : (
        <Text style={styles.hidden}> </Text>
      )}

      {hasAchievements && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 78, 
    borderWidth: 1,
    borderColor: "#E6E2DA",
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",

    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 2,
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
    fontWeight: "500",
    color: "#2E2A27",
  },

  dateDimmed: {
    color: "#9C968C",
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
    marginTop: 2,
  },

  hidden: { opacity: 0 },
});

export default DayCell;
