import React, { useMemo, useState } from "react";
import { Button, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Achievement, AchievementType } from "@/models/dataModels";
import { RecordListStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";
import { isIsoDateString } from "@/utils/dateUtils";
import { normalizeSearchText } from "@/utils/text";

type Props = NativeStackScreenProps<RecordListStackParamList, "AchievementList">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

type Filter = "all" | AchievementType;

const typeLabel = (t: AchievementType): string => (t === "did" ? "できた" : "頑張った");

const dateLabel = (iso: string): string => iso.replace(/-/g, "/");

const AchievementListScreen: React.FC<Props> = () => {
  const rootNavigation = useNavigation<RootNavigation>();
  const { loading, store } = useAchievements();
  const [filter, setFilter] = useState<Filter>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const items = useMemo(() => {
    // AchievementStore = { "2025-02-05": [A], "2025-02-06": [B, C], ... }
    const allList: Achievement[] = Object.values(store).flat();

    // 1) type フィルタ
    const filteredByType = filter === "all" ? allList : allList.filter((a) => a.type === filter);

    // 2) フリーワード検索（title / memo 部分一致）
    const normalizedQuery = normalizeSearchText(searchText);
    const filteredBySearch = normalizedQuery
      ? filteredByType.filter((item) => {
          const normalizedTarget = normalizeSearchText(`${item.title} ${item.memo ?? ""}`);
          return normalizedTarget.includes(normalizedQuery);
        })
      : filteredByType;

    // 3) 期間フィルタ（日付は ISO 文字列比較で OK）
    const validFrom = isIsoDateString(fromDate) ? fromDate : null;
    const validTo = isIsoDateString(toDate) ? toDate : null;
    const filteredByRange = filteredBySearch.filter((item) => {
      if (validFrom && item.date < validFrom) return false;
      if (validTo && item.date > validTo) return false;
      return true;
    });

    // 4) ソート: date desc, createdAt desc
    return filteredByRange
      .slice()
      .sort((a, b) => {
        if (a.date === b.date) return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        return b.date.localeCompare(a.date);
      });
  }, [filter, fromDate, searchText, store, toDate]);

  const renderItem = ({ item }: { item: Achievement }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        rootNavigation.navigate("RecordDetail", { recordId: item.id });
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
      <View style={styles.searchArea}>
        <TextInput
          style={styles.searchInput}
          placeholder="タイトル / メモを検索"
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
          accessibilityLabel="フリーワード検索"
        />
        <View style={styles.dateRangeRow}>
          <View style={styles.dateField}>
            <Text style={styles.rangeLabel}>From</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={fromDate}
              onChangeText={(text) => setFromDate(text.trim().slice(0, 10))}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              accessibilityLabel="開始日"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.rangeLabel}>To</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={toDate}
              onChangeText={(text) => setToDate(text.trim().slice(0, 10))}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              accessibilityLabel="終了日"
            />
          </View>
        </View>
        <Text style={styles.searchHint}>※ 英字小文字化 / 全角英数の半角化 / 空白整理のみ正規化します。</Text>
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
  searchArea: {
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E2DA",
    padding: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#D7D3CC",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: "#2E2A27",
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateField: {
    flex: 1,
    gap: 4,
  },
  rangeLabel: {
    fontSize: 13,
    color: "#6B665E",
    fontWeight: "600",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#D7D3CC",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: "#2E2A27",
  },
  searchHint: {
    fontSize: 12,
    color: "#8A8277",
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
