import React, { useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Achievement } from "@/models/dataModels";
import { RecordListStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";
import { isIsoDateString } from "@/utils/dateUtils";
import { normalizeSearchText } from "@/utils/text";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RecordListStackParamList, "AchievementList">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const dateLabel = (iso: string): string => iso.replace(/-/g, "/");

const AchievementListScreen: React.FC<Props> = () => {
  const rootNavigation = useNavigation<RootNavigation>();
  const { loading, store } = useAchievements();
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const items = useMemo(() => {
    // AchievementStore = { "2025-02-05": [A], "2025-02-06": [B, C], ... }
    const allList: Achievement[] = Object.values(store).flat();

    // 1) 繝輔Μ繝ｼ繝ｯ繝ｼ繝画､懃ｴ｢・・itle / memo 驛ｨ蛻・ｸ閾ｴ・・    const normalizedQuery = normalizeSearchText(searchText);
    const filteredBySearch = normalizedQuery
      ? allList.filter((item) => {
          const normalizedTarget = normalizeSearchText(`${item.title} ${item.memo ?? ""}`);
          return normalizedTarget.includes(normalizedQuery);
        })
      : allList;

    // 2) 譛滄俣繝輔ぅ繝ｫ繧ｿ・域律莉倥・ ISO 譁・ｭ怜・豈碑ｼ・〒 OK・・    const validFrom = isIsoDateString(fromDate) ? fromDate : null;
    const validTo = isIsoDateString(toDate) ? toDate : null;
    const filteredByRange = filteredBySearch.filter((item) => {
      if (validFrom && item.date < validFrom) return false;
      if (validTo && item.date > validTo) return false;
      return true;
    });

    // 3) 繧ｽ繝ｼ繝・ date desc, createdAt desc
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
      {/* 陦後ち繝・・縺ｧ繧ｫ繝ｬ繝ｳ繝繝ｼ逕ｻ髱｢縺ｮ隧ｲ蠖捺律繧帝幕縺・*/}
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{dateLabel(item.date)}</Text>
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
        {/* <TouchableOpacity onPress={() => rootNavigation.navigate("TodayStack")} accessibilityRole="button">
          <Text style={styles.back}>竊・謌ｻ繧・/Text>
        </TouchableOpacity> */}
        <Text style={styles.title}>險倬鹸荳隕ｧ</Text>
      </View>
      <View style={styles.searchArea}>
        <TextInput
          style={styles.searchInput}
          placeholder="繧ｿ繧､繝医Ν / 繝｡繝｢繧呈､懃ｴ｢"
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
          accessibilityLabel="繝輔Μ繝ｼ繝ｯ繝ｼ繝画､懃ｴ｢"
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
              accessibilityLabel="髢句ｧ区律"
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
              accessibilityLabel="邨ゆｺ・律"
            />
          </View>
        </View>
        <Text style={styles.searchHint}>窶ｻ 闍ｱ蟄怜ｰ乗枚蟄怜喧 / 蜈ｨ隗定恭謨ｰ縺ｮ蜊願ｧ貞喧 / 遨ｺ逋ｽ謨ｴ逅・・縺ｿ豁｣隕丞喧縺励∪縺吶・/Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? "隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ..." : "縺ｾ縺險倬鹸縺後≠繧翫∪縺帙ｓ"}</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        // Phase 1: FAB 縺ｯ險倬鹸蜈･蜉帷判髱｢縺ｸ縺ｮ蜈･蜿｣縺縺代ｒ諡・≧
        onPress={() => rootNavigation.navigate("RecordInput")}
      >
        <Text style={styles.fabText}>・・險倬鹸</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  searchInput: {
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
  back: {
    fontSize: 16,
    color: COLORS.accentMain,
  },
  title: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  list: {
    gap: 12,
    paddingBottom: 16,
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  memo: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  empty: {
    textAlign: "center",
    color: COLORS.textSecondary,
    paddingTop: 40,
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

