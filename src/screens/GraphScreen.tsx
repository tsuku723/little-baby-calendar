import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AchievementComposedChart from "@/components/graphs/AchievementComposedChart";
import { useAchievements } from "@/state/AchievementsContext";
import { useActiveUser } from "@/state/AppStateContext";
import { GraphPeriod, buildBuckets } from "@/utils/ageUtils";

const PERIOD_OPTIONS: Array<{ label: string; value: GraphPeriod }> = [
  { label: "1歳まで", value: "1y" },
  { label: "3歳まで", value: "3y" },
  { label: "全期間", value: "all" },
];

const GraphScreen: React.FC = () => {
  const user = useActiveUser();
  const { store } = useAchievements();
  const [period, setPeriod] = useState<GraphPeriod>("1y");
  const [open, setOpen] = useState<boolean>(false);

  // AchievementsContext から日付ごとの件数を取得し、集計しやすい形に変換
  const achievements = useMemo(() => {
    return Object.entries(store).map(([date, list]) => ({
      date,
      tried: list.filter((item) => item.type === "tried").length,
      did: list.filter((item) => item.type === "did").length,
    }));
  }, [store]);

  // 期間とプロフィール情報に応じて、グラフ用バケットとラベルを生成
  const bucketResult = useMemo(() => {
    if (!user) return null;
    return buildBuckets({
      period,
      birthDate: user.birthDate,
      dueDate: user.dueDate,
      // 予定日が入っている場合のみ修正月齢を補助表示する
      enablePrematureDisplay: Boolean(user.dueDate),
      records: achievements,
    });
  }, [achievements, period, user]);

  if (!user || !bucketResult) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.infoText}>プロフィール情報が設定されていません。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>記録グラフ</Text>

        {/* 期間切替：プルダウンで 1歳 / 3歳 / 全期間 を選択できる */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setOpen((prev) => !prev)}
          >
            <Text style={styles.dropdownHeaderText}>
              {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            </Text>
            <Text style={styles.dropdownCaret}>{open ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {open ? (
            <View style={styles.dropdownMenu}>
              {PERIOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPeriod(option.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      period === option.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#FFE5A4" }]} />
            <Text style={styles.legendLabel}>tried</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#3A86FF" }]} />
            <Text style={styles.legendLabel}>did</Text>
          </View>
        </View>

        <AchievementComposedChart period={period} buckets={bucketResult.buckets} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
  },
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2A27",
  },
  dropdownWrapper: {
    position: "relative",
    gap: 6,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7D3CC",
    backgroundColor: "#FFFFFF",
  },
  dropdownHeaderText: {
    fontSize: 14,
    color: "#2E2A27",
    fontWeight: "700",
  },
  dropdownCaret: {
    fontSize: 12,
    color: "#2E2A27",
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7D3CC",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#2E2A27",
  },
  dropdownItemTextActive: {
    color: "#3A86FF",
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: "#2E2A27",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#2E2A27",
  },
});

export default GraphScreen;
