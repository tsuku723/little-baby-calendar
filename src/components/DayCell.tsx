import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalendarDay } from "@/models/dataModels";
import { COLORS } from "@/constants/colors";

interface Props {
  day: CalendarDay;
  onPress: (iso: string) => void;
}

const DayCell: React.FC<Props> = ({ day, onPress }) => {
  const isDimmed = !day.isCurrentMonth;
  const dateNumber = parseInt(day.date.slice(-2), 10);

  const correctedLabel = day.calendarAgeLabel?.corrected ?? null;
  const chronologicalLabel = day.calendarAgeLabel?.chronological ?? null;
  const hasBothLabels = Boolean(correctedLabel && chronologicalLabel);

  const topLabel = correctedLabel ?? chronologicalLabel;
  const topStyle = topLabel ? (correctedLabel ? styles.corrected : styles.age) : styles.hidden;
  const bottomLabel = hasBothLabels ? chronologicalLabel : null;

  const hasAchievements = day.achievementCount > 0;

  const renderAgeLine = (text: string | null, baseStyle: object) => {
    const shouldDim = Boolean(text) && baseStyle !== styles.hidden;
    return (
      <Text style={[baseStyle, shouldDim && isDimmed && styles.ageDimmed]}>
        {text ?? " "}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress(day.date)}
      style={[
        styles.container,
        {
          backgroundColor: isDimmed ? COLORS.cellDimmed : COLORS.cellCurrent,
          borderWidth: day.isToday ? 2 : 0,
          borderColor: day.isToday ? COLORS.highlightToday : "transparent",
        },
      ]}
    >
      <Text style={[styles.dateLabel, isDimmed && styles.dateDimmed]}>
        {dateNumber}
      </Text>

      {day.isCurrentMonth ? (
        <>
          {renderAgeLine(topLabel, topStyle)}
          {renderAgeLine(bottomLabel, hasBothLabels ? styles.ageWeak : styles.hidden)}
        </>
      ) : (
        <>
          <Text style={styles.hidden}> </Text>
          <Text style={styles.hidden}> </Text>
        </>
      )}

      {hasAchievements && <View style={styles.recordIcon} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 6,

    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 2,
  },

  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },

  dateDimmed: {
    color: COLORS.textSecondary,
  },

  age: {
    fontSize: 10,
    color: COLORS.textPrimary,
  },

  corrected: {
    fontSize: 10,
    color: COLORS.accentMain,
  },

  ageWeak: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  ageDimmed: {
    color: COLORS.textSecondary,
  },

  recordIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accentMain,
    alignSelf: "center",
    marginTop: 4,
  },

  hidden: { opacity: 0 },
});

export default DayCell;
