import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/constants/colors";

interface Props {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPressMonthLabel: () => void;
}

const MonthHeader: React.FC<Props> = ({
  monthLabel,
  onPrev,
  onNext,
  onToday,
  onPressMonthLabel,
}) => (
  <View style={styles.container}>
    <TouchableOpacity accessibilityRole="button" onPress={onPrev} style={styles.navButton}>
      <Text style={styles.navLabel}>{"<"}</Text>
    </TouchableOpacity>
    <View style={styles.center}>
      <TouchableOpacity accessibilityRole="button" onPress={onPressMonthLabel} style={styles.monthButton}>
        <Text style={styles.month}>{monthLabel}</Text>
        <Text style={styles.monthHint}>年月を選択</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onToday}>
        <Text style={styles.today}>今日へ</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.rightActions}>
      <TouchableOpacity accessibilityRole="button" onPress={onNext} style={styles.navButton}>
        <Text style={styles.navLabel}>{">"}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 20,
    color: COLORS.accentMain,
    fontWeight: "600",
  },
  center: {
    alignItems: "center",
    gap: 2,
  },
  monthButton: {
    alignItems: "center",
  },
  month: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  monthHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  today: {
    fontSize: 14,
    color: COLORS.accentMain,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export default MonthHeader;
