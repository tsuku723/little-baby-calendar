import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

type Variant = "chronological" | "corrected" | "gestational" | "days";

const BG: Record<Variant, string> = {
  chronological: COLORS.ageBadgeChronologicalBg,
  corrected: COLORS.ageBadgeCorrectedBg,
  gestational: COLORS.ageBadgeGestationalBg,
  days: COLORS.ageBadgeChronologicalBg,
};

type Props = {
  label: string;
  variant: Variant;
};

const AgeBadge: React.FC<Props> = ({ label, variant }) => (
  <View style={[styles.badge, { backgroundColor: BG[variant] }]}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    color: COLORS.ageBadgeText,
    fontWeight: "600",
  },
});

export default AgeBadge;
