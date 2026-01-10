import React, { useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Achievement } from "@/models/dataModels";
import { RecordListStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useAchievements } from "@/state/AchievementsContext";
import { useActiveUser } from "@/state/AppStateContext";
import { isIsoDateString } from "@/utils/dateUtils";
import { normalizeSearchText } from "@/utils/text";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RecordListStackParamList, "AchievementList">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const dateLabel = (iso: string): string => iso.replace(/-/g, "/");

const AchievementListScreen: React.FC<Props> = () => {
  const rootNavigation = useNavigation<RootNavigation>();
  const user = useActiveUser();
  const { loading, store } = useAchievements();
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const items = useMemo(() => {
    // AchievementStore = { "2025-02-05": [A], "2025-02-06": [B, C], ... }
    const allList: Achievement[] = Object.values(store).flat();

    // 1) フリーワード検索（title / memo 部分一致）
    const normalizedQuery = normalizeSearchText(searchText);
    const filteredBySearch = normalizedQuery
      ? allList.filter((item) => {
          const normalizedTarget = normalizeSearchText(`${item.title} ${item.memo ?? ""}`);
          return normalizedTarget.includes(normalizedQuery);
        })
      : allList;

    // 2) 期間フィルタ（日付は ISO 形式で比較 OK）
    const validFrom = isIsoDateString(fromDate) ? fromDate : null;
    const validTo = isIsoDateString(toDate) ? toDate : null;
    const filteredByRange = filteredBySearch.filter((item) => {
      if (validFrom && item.date < validFrom) return false;
      if (validTo && item.date > validTo) return false;
      return true;
    });

    // 3) ソート: date desc, createdAt desc
    return filteredByRange
      .slice()
      .sort((a, b) => {
        if (a.date === b.date) return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        return b.date.localeCompare(a.date);
      });
  }, [fromDate, searchText, store, toDate]);

  const renderItem = ({ item }: { item: Achievement }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        rootNavigation.navigate("RecordDetail", { recordId: item.id, from: "list" });
      }}
      accessibilityRole="button"
    >
      {/* 行タップでカレンダー画面の該当日を開く */}
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{dateLabel(item.date)}</Text>
      </View>
      <Text style={styles.rowTitle} numberOfLines={2}>
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
        <AppText style={styles.headerTitle} weight="medium">
          {(user?.name ?? "プロフィール未設定") + " 記録一覧"}
        </AppText>
      </View>
      <View style={styles.content}>
        <View style={styles.searchArea}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="タイトル / メモを検索"
              value={searchText}
              onChangeText={(text) => setSearchText(text)}
              accessibilityLabel="フリーワード検索"
            />
          </View>
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
          <Text style={styles.searchHint}>※ 英字小文字化 / 全角英数の半角化 / 空白整形済みで正規化します。</Text>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{loading ? "読み込み中..." : "まだ記録がありません"}</Text>}
        />
      </View>
      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        // Phase 1: FAB は記録入力画面への入口だけを保持
        onPress={() => rootNavigation.navigate("RecordInput")}
      >
        <Text style={styles.fabText}>＋記録</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBackground,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  searchArea: {
    gap: 10,
    backgroundColor: COLORS.filterBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  searchHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  list: {
    gap: 12,
    paddingBottom: 120,
  },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  memo: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  empty: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.accentMain,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 32,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AchievementListScreen;
