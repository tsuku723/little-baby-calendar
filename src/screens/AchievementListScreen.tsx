import React, { useMemo, useState } from "react";
import { Button, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Achievement, AchievementType } from "@/models/dataModels";
import { RecordListStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";

type Props = NativeStackScreenProps<RecordListStackParamList, "AchievementList">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

type Filter = "all" | AchievementType;

const typeLabel = (t: AchievementType): string => (t === "did" ? "できた" : "頑張った");

const dateLabel = (iso: string): string => iso.replace(/-/g, "/");

const AchievementListScreen: React.FC<Props> = () => {
  const rootNavigation = useNavigation<RootNavigation>();
  const { loading, store, setSelectedDate } = useAchievements();
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    // AchievementStore = { "2025-02-05": [A], "2025-02-06": [B, C], ... }
    const allList: Achievement[] = Object.values(store).flat();

    const filtered = filter === "all" ? allList : allList.filter((a) => a.type === filter);

    return filtered
      .slice()
      .sort((a, b) => {
        if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
        return b.date.localeCompare(a.date);
      });
  }, [filter, store]);

  const renderItem = ({ item }: { item: Achievement }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        setSelectedDate(item.date);
        rootNavigation.navigate("TodayStack", { screen: "Today", params: { selectedDay: item.date } });
      }}
      accessibilityRole="button"
    >
      {/* 行タップでカレンダー画面の該当日を開く */}
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{dateLabel(item.date)}</Text>
        <Text style={styles.type}>{typeLabel(item.type)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {item.memo ? (
        <Text style={styles.memo} numberOfLines={2}>
          {item.memo}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => rootNavigation.navigate("TodayStack")} accessibilityRole="button">
          <Text style={styles.back}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>できた・頑張った一覧</Text>
      </View>
      <View style={styles.filters}>
        <Button title="すべて" onPress={() => setFilter("all")} color={filter === "all" ? "#3A86FF" : "#BABABA"} />
        <Button title="できた" onPress={() => setFilter("did")} color={filter === "did" ? "#3A86FF" : "#BABABA"} />
        <Button
          title="頑張った"
          onPress={() => setFilter("tried")}
          color={filter === "tried" ? "#3A86FF" : "#BABABA"}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? "読み込み中..." : "まだ記録がありません"}</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        // Phase 1: FAB は記録入力画面への入口だけを担う
        onPress={() => rootNavigation.navigate("RecordInput")}
      >
        <Text style={styles.fabText}>＋ 記録</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  back: {
    fontSize: 16,
    color: "#3A86FF",
  },
  title: {
    fontSize: 18,
    color: "#2E2A27",
    fontWeight: "600",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E2DA",
    padding: 12,
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    color: "#6B665E",
  },
  type: {
    fontSize: 14,
    color: "#3A86FF",
    fontWeight: "600",
  },
  memo: {
    fontSize: 14,
    color: "#4A453D",
  },
  empty: {
    textAlign: "center",
    color: "#6B665E",
    paddingTop: 40,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#3A86FF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AchievementListScreen;
