import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenSettings: () => void;
}

const MonthHeader: React.FC<Props> = ({ monthLabel, onPrev, onNext, onToday, onOpenSettings }) => (
  <View style={styles.container}>
    <TouchableOpacity accessibilityRole="button" onPress={onPrev} style={styles.navButton}>
      <Text style={styles.navLabel}>{"<"}</Text>
    </TouchableOpacity>
    <View style={styles.center}>
      <Text style={styles.month}>{monthLabel}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onToday}>
        <Text style={styles.today}>今日へ</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.rightActions}>
      <TouchableOpacity accessibilityRole="button" onPress={onOpenSettings}>
        <Text style={styles.settings}>設定</Text>
      </TouchableOpacity>
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
    color: "#3A86FF",
    fontWeight: "600",
  },
  center: {
    alignItems: "center",
    gap: 2,
  },
  month: {
    fontSize: 20,
    color: "#2E2A27",
    fontWeight: "600",
  },
  today: {
    fontSize: 14,
    color: "#3A86FF",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settings: {
    fontSize: 16,
    color: "#3A86FF",
  },
});

export default MonthHeader;
