import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { Achievement } from "@/models/dataModels";
import { RecordListStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useAchievements } from "@/state/AchievementsContext";
import { useActiveUser } from "@/state/AppStateContext";
import { isIsoDateString, safeParseIsoLocal, toIsoDateString } from "@/utils/dateUtils";
import { normalizeSearchText } from "@/utils/text";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RecordListStackParamList, "AchievementList">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const dateLabel = (iso: string): string => iso.replace(/-/g, "/");

const toIsoDateFromPicker = (picked: Date): string => {
  return toIsoDateString(picked);
};

const getPickerDate = (value: string): Date => {
  const fallback = new Date();
  return safeParseIsoLocal(isIsoDateString(value) ? value : null, fallback);
};

const AchievementListScreen: React.FC<Props> = () => {
  const rootNavigation = useNavigation<RootNavigation>();
  const user = useActiveUser();
  const { loading, store } = useAchievements();
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isFilterExpanded, setFilterExpanded] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());

  const applyFromDate = (nextFrom: string) => {
    setFromDate(nextFrom);
    if (nextFrom && isIsoDateString(toDate) && nextFrom > toDate) {
      setToDate(nextFrom);
    }
  };

  const applyToDate = (nextTo: string) => {
    setToDate(nextTo);
    if (nextTo && isIsoDateString(fromDate) && nextTo < fromDate) {
      setFromDate(nextTo);
    }
  };

  const openPicker = (target: "from" | "to") => {
    setTempPickerDate(getPickerDate(target === "from" ? fromDate : toDate));
    setPickerTarget(target);
  };

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
        <View style={styles.filterBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="タイトル / メモを検索"
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            accessibilityLabel="フリーワード検索"
          />
          <TouchableOpacity
            onPress={() => setFilterExpanded((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="絞り込みを切り替える"
          >
            <Ionicons name="options-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        {isFilterExpanded ? (
          <View style={styles.filterPanel}>
            <TouchableOpacity
              style={styles.filterRow}
              onPress={() => openPicker("from")}
              accessibilityRole="button"
              accessibilityLabel="開始日を選択"
            >
              <Text style={styles.filterLabel}>From</Text>
              <Text style={styles.filterValue}>{fromDate || "未設定"}</Text>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterRow}
              onPress={() => openPicker("to")}
              accessibilityRole="button"
              accessibilityLabel="終了日を選択"
            >
              <Text style={styles.filterLabel}>To</Text>
              <Text style={styles.filterValue}>{toDate || "未設定"}</Text>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFromDate("");
                setToDate("");
              }}
              accessibilityRole="button"
            >
              <Text style={styles.clearButtonText}>範囲クリア</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
      {Platform.OS === "ios" && pickerTarget ? (
        <Modal animationType="fade" transparent onRequestClose={() => setPickerTarget(null)}>
          <Pressable style={styles.pickerOverlay} onPress={() => setPickerTarget(null)} accessibilityRole="button" />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                onPress={() => setPickerTarget(null)}
                accessibilityRole="button"
                style={styles.pickerAction}
              >
                <Text style={styles.pickerActionText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>{pickerTarget === "from" ? "From" : "To"}</Text>
              <TouchableOpacity
                onPress={() => {
                  const iso = toIsoDateFromPicker(tempPickerDate);
                  if (pickerTarget === "from") {
                    applyFromDate(iso);
                  } else {
                    applyToDate(iso);
                  }
                  setPickerTarget(null);
                }}
                accessibilityRole="button"
                style={styles.pickerAction}
              >
                <Text style={styles.pickerActionText}>完了</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerBody}>
              <DateTimePicker
                value={tempPickerDate}
                mode="date"
                display="spinner"
                locale="ja-JP"
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) setTempPickerDate(date);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
      {Platform.OS === "android" && pickerTarget ? (
        <DateTimePicker
          value={getPickerDate(pickerTarget === "from" ? fromDate : toDate)}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (event.type === "dismissed") {
              setPickerTarget(null);
              return;
            }
            if (date) {
              const nextValue = toIsoDateFromPicker(date);
              if (pickerTarget === "from") {
                applyFromDate(nextValue);
              } else {
                applyToDate(nextValue);
              }
            }
            setPickerTarget(null);
          }}
        />
      ) : null}
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
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: "transparent",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: "transparent",
  },
  filterRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  filterLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 44,
  },
  filterValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  clearButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  pickerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 12,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  pickerAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickerActionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  pickerBody: {
    paddingHorizontal: 8,
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
    backgroundColor: COLORS.fabBackground,
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

