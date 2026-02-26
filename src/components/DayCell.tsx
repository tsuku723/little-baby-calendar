import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalendarDay } from "@/models/dataModels";
import { COLORS } from "@/constants/colors";

interface Props {
  day: CalendarDay;
  onPress: (iso: string) => void;
}

const CELL_HEIGHT = 80;

const DayCell: React.FC<Props> = ({ day, onPress }) => {
  const isDimmed = !day.isCurrentMonth;
  const dateNumber = parseInt(day.date.slice(-2), 10);

  const correctedLabel = day.calendarAgeLabel?.corrected ?? null;
  const gestationalLabel = day.calendarAgeLabel?.gestational ?? null;
  const chronologicalLabel = day.calendarAgeLabel?.chronological ?? null;

  const hasAchievements = day.achievementCount > 0;

  const renderAgeLine = (
    text: string | null,
    baseStyle: object,
    useSticker: boolean,
    stickerStyle?: object,
    textColorStyle?: object
  ) => {
    const shouldDim = Boolean(text) && baseStyle !== styles.hidden;
    const label = (
      <Text style={[baseStyle, textColorStyle, shouldDim && isDimmed && styles.ageDimmed]}>
        {text ?? " "}
      </Text>
    );

    if (!useSticker || !text || baseStyle === styles.hidden) {
      return label;
    }

    return <View style={[styles.ageSticker, stickerStyle]}>{label}</View>;
  };

  const topLabel = gestationalLabel ?? chronologicalLabel;
  const topStyle = topLabel ? (gestationalLabel ? styles.corrected : styles.age) : styles.hidden;

  const bottomLabel = gestationalLabel ? chronologicalLabel : correctedLabel;
  const bottomStyle = gestationalLabel ? styles.ageWeak : correctedLabel ? styles.corrected : styles.hidden;

  const topUseSticker = Boolean(topLabel) && !gestationalLabel;
  const topStickerStyle = styles.ageStickerChronological;
  const topTextStyle = styles.ageTextChronological;

  const bottomUseSticker = Boolean(bottomLabel);
  const bottomStickerStyle = gestationalLabel ? styles.ageStickerChronological : styles.ageStickerCorrected;
  const bottomTextStyle = gestationalLabel ? styles.ageTextChronological : styles.ageTextCorrected;

  if (__DEV__ && day.isCurrentMonth && gestationalLabel) {
    console.log("[DayCell] render gestational label", {
      date: day.date,
      gestationalLabel,
      chronologicalLabel,
      correctedLabel,
      showMode: day.ageInfo?.flags.showMode ?? null,
    });
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress(day.date)}
      style={[styles.container, isDimmed && styles.containerDimmed, day.isToday && styles.today]}
    >
      <View style={styles.dateArea}>
        <View style={[styles.datePill, day.isToday && styles.datePillToday]}>
          <Text style={[styles.dateLabel, day.isToday && styles.dateLabelToday, isDimmed && styles.dateDimmed]}>
            {dateNumber}
          </Text>
        </View>
        {hasAchievements && <View style={styles.recordIcon} />}
      </View>
      <View style={styles.contentArea}>
        {day.isCurrentMonth ? (
          <>
            {renderAgeLine(topLabel, topStyle, topUseSticker, topStickerStyle, topTextStyle)}
            {renderAgeLine(bottomLabel, bottomStyle, bottomUseSticker, bottomStickerStyle, bottomTextStyle)}
          </>
        ) : (
          <>
            {renderAgeLine(null, styles.hidden, false)}
            {renderAgeLine(null, styles.hidden, false)}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CELL_HEIGHT,
    flex: 1,
    borderRadius: 10,
    marginHorizontal: 2,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cellCurrent,
    overflow: "hidden",
  },
  containerDimmed: {
    backgroundColor: COLORS.cellDimmed,
  },
  today: {
    borderWidth: 2,
    borderColor: COLORS.highlightToday,
    backgroundColor: COLORS.highlightToday,
  },
  dateArea: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  datePill: {
    paddingLeft: 3,
    paddingRight: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  datePillToday: {
    backgroundColor: COLORS.todayFill,
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  dateLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  dateLabelToday: {
    fontWeight: "700",
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
    opacity: 0.8,
  },
  ageSticker: {
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginVertical: 1,
  },
  ageStickerCorrected: {
    backgroundColor: COLORS.ageBadgeCorrectedBg,
  },
  ageStickerChronological: {
    backgroundColor: COLORS.ageBadgeChronologicalBg,
  },
  ageTextCorrected: {
    color: COLORS.ageBadgeText,
    fontWeight: "600",
  },
  ageTextChronological: {
    color: COLORS.ageBadgeText,
    fontWeight: "600",
  },

  recordIcon: {
    width: 14,
    height: 14,
    borderRadius: 8,
    backgroundColor: COLORS.accentMain,
    marginLeft: 1,
    marginTop: 1,
  },

  hidden: { opacity: 0 },
});

export default DayCell;
