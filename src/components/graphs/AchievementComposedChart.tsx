import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

// gifted-charts を使用した複合グラフ
import { BarChart } from "react-native-gifted-charts";

import { GraphBucket, GraphPeriod } from "@/utils/ageUtils";

type Props = {
  period: GraphPeriod;
  buckets: GraphBucket[];
};

const BAR_WIDTH = 16;
const BAR_SPACING = 10;
const LABEL_HEIGHT_ALL = 56;
const LABEL_HEIGHT_MONTHLY = 72;

const AchievementComposedChart: React.FC<Props> = ({ period, buckets }) => {
  // 棒グラフと折れ線グラフのデータを gift-charts 用に整形
  const { stackData, lineData } = useMemo(() => {
    // 積み上げ棒の1本ごとにラベルや色を定義する
    const stack = buckets.map((bucket) => ({
      labelComponent: () => (
        <View
          // ラベル高さを明示的に確保し、グラフと重ならないようにする
          style={[
            styles.labelContainer,
            { minHeight: period === "all" ? LABEL_HEIGHT_ALL : LABEL_HEIGHT_MONTHLY },
          ]}
        >
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
    }));

    // 累計値を折れ線で前面に描画する
    const line = buckets.map((bucket) => ({ value: bucket.cumulative }));

    return { stackData: stack, lineData: line };
  }, [buckets]);

  return (
    <View style={styles.container}>
      <BarChart
        height={260}
        // 棒と折れ線の座標基準を統一するため、バー幅と間隔を定数化
        barWidth={BAR_WIDTH}
        spacing={BAR_SPACING}
        // 罫線を破線で表示し、見やすさを補助
        rulesType="dashed"
        rulesThickness={1}
        rulesColor="#E5E5EA"
        dashWidth={4}
        dashGap={6}
        showVerticalLines
        stackData={stackData as any}
        lineData={lineData as any}
        showLine
        // 折れ線の点が棒の中心に揃うように同一間隔を指定
        lineConfig={{ spacing: BAR_SPACING }}
        yAxisThickness={1}
        xAxisThickness={1}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        xAxisLabelsHeight={period === "all" ? LABEL_HEIGHT_ALL : LABEL_HEIGHT_MONTHLY}
        noOfSections={4}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
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
