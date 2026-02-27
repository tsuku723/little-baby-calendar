import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalendarDay } from "@/models/dataModels";
import { COLORS } from "@/constants/colors";
import { normalizeAgeLabelText, stripChronologicalPrefix } from "@/utils/ageLabelNormalization";

interface Props {
  day: CalendarDay;
  onPress: (iso: string) => void;
}

const CELL_HEIGHT = 80;

const DayCell: React.FC<Props> = ({ day, onPress }) => {
  const isDimmed = !day.isCurrentMonth;
  const dateNumber = parseInt(day.date.slice(-2), 10);

  const rawChrono = day.calendarAgeLabel?.chronological;
  const chronologicalLabel = stripChronologicalPrefix(rawChrono);

  const correctedLabel = day.calendarAgeLabel?.corrected ?? null;
  const gestationalLabel = day.calendarAgeLabel?.gestational ?? null;

  const normalizedChronologicalLabel = normalizeAgeLabelText(chronologicalLabel);
  const normalizedCorrectedLabel = normalizeAgeLabelText(correctedLabel);
  const normalizedGestationalLabel = normalizeAgeLabelText(gestationalLabel);

  let topLabel: string | number | null = normalizedChronologicalLabel;
  let topStickerStyle = styles.ageStickerChronological;
  let topTextStyle = styles.ageTextChronological;
  let bottomLabel: string | number | null = null;
  let bottomStickerStyle = styles.ageStickerChronological;
  let bottomTextStyle = styles.ageTextChronological;

  if (normalizedGestationalLabel != null) {
    topLabel = normalizedGestationalLabel;
    topStickerStyle = styles.ageStickerGestational;
    topTextStyle = styles.ageTextGestational;
    bottomLabel = normalizedChronologicalLabel;
    bottomStickerStyle = styles.ageStickerChronological;
    bottomTextStyle = styles.ageTextChronological;
  } else if (normalizedCorrectedLabel != null) {
    topLabel = normalizedChronologicalLabel;
    topStickerStyle = styles.ageStickerChronological;
    topTextStyle = styles.ageTextChronological;
    bottomLabel = normalizedCorrectedLabel;
    bottomStickerStyle = styles.ageStickerCorrected;
    bottomTextStyle = styles.ageTextCorrected;
  }

  const hasAchievements = day.achievementCount > 0;

  const renderAgeLine = (
    text: string | number | null,
    baseStyle: object,
    stickerStyle: object,
    textColorStyle: object
  ) => {
    const normalizedText = normalizeAgeLabelText(text);
    const shouldDim = normalizedText != null && baseStyle !== styles.hidden;
    const label = (
      <Text style={[baseStyle, textColorStyle, shouldDim && isDimmed && styles.ageDimmed]}>
        {normalizedText != null ? String(normalizedText) : " "}
      </Text>
    );

    if (normalizedText == null || baseStyle === styles.hidden) {
      return label;
    }

    return <View style={[styles.ageSticker, stickerStyle]}>{label}</View>;
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress(day.date)}
      style={[
        styles.container,
        isDimmed && styles.containerDimmed,
        day.isToday && styles.today,
      ]}
    >
      <View style={styles.dateArea}>
        <View style={[styles.datePill, day.isToday && styles.datePillToday]}>
          <Text
            style={[
              styles.dateLabel,
              day.isToday && styles.dateLabelToday,
              isDimmed && styles.dateDimmed,
            ]}
          >
            {dateNumber}
          </Text>
        </View>
        {hasAchievements && <View style={styles.recordIcon} />}
      </View>
      <View style={styles.contentArea}>
        {day.isCurrentMonth ? (
          <>
            {renderAgeLine(topLabel, topLabel != null ? styles.age : styles.hidden, topStickerStyle, topTextStyle)}
            {renderAgeLine(bottomLabel, bottomLabel != null ? styles.ageWeak : styles.hidden, bottomStickerStyle, bottomTextStyle)}
          </>
        ) : (
          <>
            {renderAgeLine(null, styles.hidden, styles.ageStickerChronological, styles.ageTextChronological)}
            {renderAgeLine(null, styles.hidden, styles.ageStickerChronological, styles.ageTextChronological)}
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

  ageWeak: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  ageDimmed: {
    color: COLORS.textSecondary,
  },
  ageSticker: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    elevation: 1,
  },
  ageStickerChronological: {
    backgroundColor: COLORS.ageBadgeChronologicalBg,
  },
  ageStickerCorrected: {
    backgroundColor: COLORS.ageBadgeCorrectedBg,
  },
  ageStickerGestational: {
    backgroundColor: COLORS.ageBadgeGestationalBg,
  },
  ageTextChronological: {
    color: COLORS.ageBadgeText,
    fontSize: 10,
    fontWeight: "600",
  },
  ageTextCorrected: {
    color: COLORS.ageBadgeText,
    fontSize: 10,
    fontWeight: "600",
  },
  ageTextGestational: {
    color: COLORS.ageBadgeText,
    fontSize: 10,
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
