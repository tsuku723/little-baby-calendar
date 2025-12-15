import React, { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

import AchievementGraphSection from "@/components/graphs/AchievementGraphSection";
import { GraphPeriod } from "@/utils/ageUtils";

const GraphScreen: React.FC = () => {
  const [period, setPeriod] = useState<GraphPeriod>("1y");

  return (
    <SafeAreaView style={styles.safeArea}>
      <AchievementGraphSection period={period} onPeriodChange={setPeriod} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
  },
});

export default GraphScreen;
