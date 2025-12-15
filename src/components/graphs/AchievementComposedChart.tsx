import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

// gifted-charts を使用した複合グラフ
import { BarChart } from "react-native-gifted-charts";

import { GraphBucket, GraphPeriod } from "@/utils/ageUtils";

type Props = {
  period: GraphPeriod;
  buckets: GraphBucket[];
};

const AchievementComposedChart: React.FC<Props> = ({ period, buckets }) => {
  // 棒グラフと折れ線グラフのデータを gift-charts 用に整形
  const { stackData, lineData } = useMemo(() => {
    // 積み上げ棒の1本ごとにラベルや色を定義する
    const stack = buckets.map((bucket) => ({
      labelComponent: () => (
        <View style={styles.labelContainer}>
          {bucket.showActualLabel ? (
            <Text style={styles.actualLabel}>{bucket.actualLabel}</Text>
          ) : (
            <Text style={styles.actualLabel} />
          )}
          {bucket.correctedLabel && bucket.showCorrectedLabel ? (
            <Text style={styles.correctedLabel}>{bucket.correctedLabel}</Text>
          ) : null}
          {bucket.showCorrectedZeroLine ? <View style={styles.correctedLine} /> : null}
        </View>
      ),
      stacks: [
        { value: bucket.tried, color: "#FFE5A4" },
        { value: bucket.did, color: "#3A86FF" },
      ],
      barWidth: 18,
    }));

    // 累計値を折れ線で前面に描画する
    const line = buckets.map((bucket) => ({ value: bucket.cumulative }));

    return { stackData: stack, lineData: line };
  }, [buckets]);

  return (
    <View style={styles.container}>
      <BarChart
        height={220}
        barWidth={22}
        spacing={14}
        hideRules
        disableScroll
        stackData={stackData as any}
        lineData={lineData as any}
        showLine
        yAxisThickness={1}
        xAxisThickness={1}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        xAxisLabelsHeight={period === "all" ? 36 : 48}
        noOfSections={4}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 48,
  },
  actualLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E2A27",
  },
  correctedLabel: {
    fontSize: 10,
    color: "#8C8C8C",
  },
  correctedLine: {
    width: 4,
    height: 12,
    backgroundColor: "#FF6F61",
    marginTop: 4,
    borderRadius: 2,
  },
  axisText: {
    color: "#8C8C8C",
    fontSize: 10,
  },
});

export default AchievementComposedChart;
