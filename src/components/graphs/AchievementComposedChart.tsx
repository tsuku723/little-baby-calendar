import React, { useMemo } from "react";
import { Dimensions, Platform, ScrollView, View, Text, StyleSheet } from "react-native";

import { GraphBucket, GraphPeriod } from "@/utils/ageUtils";

type Props = {
  period: GraphPeriod;
  buckets: GraphBucket[];
};

// Web では victory-native を import しないため、ここで参照を入れておく
let VictoryChart: any;
let VictoryBar: any;
let VictoryLine: any;
let VictoryAxis: any;
let VictoryStack: any;
let VictoryLabel: any;

// iOS / Android のみ動的に victory-native を読み込む
if (Platform.OS !== "web") {
  ({
    VictoryChart,
    VictoryBar,
    VictoryLine,
    VictoryAxis,
    VictoryStack,
    VictoryLabel,
  } = require("victory-native"));
}

// Victory ベースの共通レイアウト値
const BAR_WIDTH = 12;
const BAR_GAP = 8;
const DATA_HEIGHT = 230;
const AXIS_HEIGHT = 96;
const PADDING = { top: 12, bottom: 12, left: 52, right: 28 };
const SCROLL_PADDING = 16;

const AchievementComposedChart: React.FC<Props> = ({ period, buckets }) => {
  const windowWidth = Dimensions.get("window").width;

  // Victory 用のデータを index 基準で統一する
  const chartData = useMemo(() => {
    // 欠損月があっても線が途切れないよう、全バケットを 0 も含めて渡す
    const barTried = buckets.map((bucket, index) => ({ x: index, y: bucket.tried }));
    const barDid = buckets.map((bucket, index) => ({ x: index, y: bucket.did }));
    const line = buckets.map((bucket, index) => ({ x: index, y: bucket.cumulative }));
    const tickValues = buckets.map((_, index) => index);

    // 最大値を計算し、棒と線が同じスケールで描けるようにする
    const maxStack = Math.max(...buckets.map((b) => b.tried + b.did), 0);
    const maxLine = Math.max(...buckets.map((b) => b.cumulative), 0);
    const yMax = Math.max(1, maxStack, maxLine);

    return { barTried, barDid, line, tickValues, yMax };
  }, [buckets]);

  // バーとラベルの位置合わせを保証するため、x 軸のドメインを固定
  const xDomain: [number, number] = [-0.5, buckets.length - 0.5];
  const domainPadding = { x: BAR_WIDTH / 2 };

  // 横スクロール用に描画幅を計算（バー間隔を考慮し、狭すぎないようにする）
  const chartWidth = useMemo(() => {
    const estimate = buckets.length * (BAR_WIDTH + BAR_GAP) + PADDING.left + PADDING.right;
    return Math.max(windowWidth - SCROLL_PADDING * 2, estimate);
  }, [buckets.length, windowWidth]);

  // 修正月齢ラベルに必ず「修」を付ける（週数などプレフィックスがない場合を補完）
  const withCorrectedPrefix = (label?: string | null) => {
    if (!label) return "";
    return label.startsWith("修") ? label : `修${label}`;
  };

  // Web ではライブラリを読み込まず、簡易表示のみ返す
  if (Platform.OS === "web" || !VictoryChart) {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webText}>このグラフはモバイル専用です</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          {/* データレイヤ（棒＋折れ線） */}
          <VictoryChart
            width={chartWidth}
            height={DATA_HEIGHT}
            padding={PADDING}
            domain={{ x: xDomain, y: [0, chartData.yMax * 1.1] }}
            domainPadding={domainPadding}
            standalone
          >
            {/* Y 軸のみ表示（X 軸は下のレイヤに分離） */}
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: "#CFCFD6" },
                tickLabels: styles.axisText,
                grid: { stroke: "#E5E5EA", strokeDasharray: "6,6" },
              }}
            />

            {/* 縦罫線を VictoryLine で明示的に描画 */}
            {chartData.tickValues.map((x) => {
              const emphasize = buckets[x]?.showCorrectedZeroLine;
              return (
                <VictoryLine
                  // 予定日位置は太線で強調、それ以外は破線
                  key={`vline-${x}`}
                  standalone={false}
                  data={[
                    { x, y: 0 },
                    { x, y: chartData.yMax * 1.1 },
                  ]}
                  style={{
                    data: {
                      stroke: emphasize ? "#FF6F61" : "#CFCFD6",
                      strokeWidth: emphasize ? 2 : 1,
                      strokeDasharray: emphasize ? undefined : "6,6",
                      opacity: emphasize ? 0.9 : 0.6,
                    },
                  }}
                />
              );
            })}

            {/* 積み上げ棒（tried / did） */}
            <VictoryStack colorScale={["#FFE5A4", "#3A86FF"]}>
              <VictoryBar
                data={chartData.barTried}
                barWidth={BAR_WIDTH}
                style={{ data: { width: BAR_WIDTH } }}
              />
              <VictoryBar
                data={chartData.barDid}
                barWidth={BAR_WIDTH}
                style={{ data: { width: BAR_WIDTH } }}
              />
            </VictoryStack>

            {/* 累計の折れ線。欠損を作らないよう全点を渡す */}
            <VictoryLine
              data={chartData.line}
              interpolation="monotoneX"
              style={{
                data: { stroke: "#2E2A27", strokeWidth: 2 },
              }}
            />
          </VictoryChart>

          {/* X 軸レイヤ（実月齢＋修正月齢を上下に分離） */}
          <VictoryChart
            width={chartWidth}
            height={AXIS_HEIGHT}
            padding={{ top: 0, bottom: 28, left: PADDING.left, right: PADDING.right }}
            domain={{ x: xDomain }}
            domainPadding={domainPadding}
            standalone
          >
            <VictoryAxis
              tickValues={chartData.tickValues}
              // tickLabelComponent で 2 行テキスト（実月齢 / 修正月齢）を完全自前制御
              tickLabelComponent={
                <VictoryLabel
                  dy={8}
                  text={({ index }) => {
                    const bucket = index != null ? buckets[index] : undefined;
                    if (!bucket) return "";
                    const actual = bucket.showActualLabel ? bucket.actualLabel : "";
                    const corrected =
                      bucket.showCorrectedLabel && bucket.correctedLabel
                        ? withCorrectedPrefix(bucket.correctedLabel)
                        : "";
                    // 実月齢の真下に修正月齢を並べ、重ならないよう 2 行に分割
                    return corrected ? [actual || " ", corrected] : [actual];
                  }}
                  style={({ index }) => {
                    const bucket = index != null ? buckets[index] : undefined;
                    const actualStyle = styles.actualLabel;
                    const correctedStyle = styles.correctedLabel;
                    if (
                      bucket &&
                      bucket.showCorrectedLabel &&
                      bucket.correctedLabel
                    ) {
                      return [actualStyle, correctedStyle];
                    }
                    return [actualStyle];
                  }}
                />
              }
              style={{
                axis: { stroke: "#CFCFD6" },
                tickLabels: { padding: 6 },
              }}
            />
          </VictoryChart>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  actualLabel: {
    fontSize: 14,
    fontWeight: "700",
    fill: "#2E2A27",
  },
  correctedLabel: {
    fontSize: 10,
    fill: "#8C8C8C",
  },
  axisText: {
    fill: "#8C8C8C",
    fontSize: 10,
  },
  scrollContent: {
    paddingHorizontal: SCROLL_PADDING,
  },
  webContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  webText: {
    color: "#8C8C8C",
    fontSize: 14,
  },
});

export default AchievementComposedChart;
