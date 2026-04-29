import React, { useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { Achievement } from "@/models/dataModels";
import {
  RecordListStackParamList,
  RootStackParamList,
  TabParamList,
} from "@/navigation";
import AgeBadge from "@/components/AgeBadge";
import AppText from "@/components/AppText";
import DatePickerModal from "@/components/DatePickerModal";
import { useAchievements } from "@/state/AchievementsContext";
import { useActiveUser } from "@/state/AppStateContext";
import { UserProfile } from "@/state/AppStateContext";
import {
  calculateAgeInfo,
  isIsoDateString,
  safeParseIsoLocal,
  toIsoDateString,
} from "@/utils/dateUtils";
import { ensureFileExistsAsync } from "@/utils/photo";
import { normalizeSearchText } from "@/utils/text";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<
  RecordListStackParamList,
  "AchievementList"
>;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const startOfLocalDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const cloneDate = (d: Date) => new Date(d.getTime());

const toIsoDateFromPicker = (picked: Date): string => toIsoDateString(picked);

const getPickerDate = (value: string | null, fallback: Date): Date => {
  const parsed = safeParseIsoLocal(
    value && isIsoDateString(value) ? value : null,
    fallback
  );
  if (Number.isNaN(parsed.getTime())) return cloneDate(fallback);
  return cloneDate(parsed);
};

// ---- カード共通: 月齢バッジ行 ----

type AgeBadgeRowProps = { record: Achievement; user: UserProfile };

const AgeBadgeRow: React.FC<AgeBadgeRowProps> = ({ record, user }) => {
  const ageInfo = useMemo(() => {
    if (!user.birthDate) return null;
    try {
      return calculateAgeInfo({
        targetDate: record.date,
        birthDate: user.birthDate,
        dueDate: user.dueDate,
        showCorrectedUntilMonths: user.settings.showCorrectedUntilMonths,
        ageFormat: user.settings.ageFormat,
      });
    } catch {
      return null;
    }
  }, [record.date, user]);

  if (!ageInfo) return null;

  const showGestational =
    ageInfo.flags.showMode === "gestational" &&
    ageInfo.gestational.visible &&
    ageInfo.gestational.formatted;
  const showCorrected =
    ageInfo.flags.showMode === "corrected" &&
    ageInfo.corrected.visible &&
    ageInfo.corrected.formatted;

  return (
    <View style={badgeRowStyles.row}>
      <AgeBadge
        label={ageInfo.chronological.formatted}
        variant="chronological"
      />
      {showGestational ? (
        <AgeBadge
          label={`在胎 ${ageInfo.gestational.formatted}`}
          variant="gestational"
        />
      ) : showCorrected ? (
        <AgeBadge
          label={`修正 ${ageInfo.corrected.formatted}`}
          variant="corrected"
        />
      ) : null}
    </View>
  );
};

const badgeRowStyles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
});

// ---- 標準カード（右サムネイル）----

type RecordCardProps = {
  item: Achievement;
  user: UserProfile;
  onPress: () => void;
};

const RecordCard: React.FC<RecordCardProps> = ({ item, user, onPress }) => {
  const [resolvedPhoto, setResolvedPhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    void ensureFileExistsAsync(item.photoPath ?? null).then((path) => {
      if (mounted) setResolvedPhoto(path);
    });
    return () => {
      mounted = false;
    };
  }, [item.photoPath]);

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={cardStyles.left}>
        <Text style={cardStyles.date}>{item.date.replace(/-/g, "/")}</Text>
        <Text style={cardStyles.title} numberOfLines={2}>
          {item.title || "(タイトルなし)"}
        </Text>
        {item.memo ? (
          <Text style={cardStyles.memo} numberOfLines={2}>
            {item.memo}
          </Text>
        ) : null}
        <AgeBadgeRow record={item} user={user} />
      </View>
      <View style={cardStyles.thumb}>
        {resolvedPhoto ? (
          <Image
            source={{ uri: resolvedPhoto }}
            style={cardStyles.thumbImage}
            resizeMode="cover"
          />
        ) : (
          <View style={cardStyles.thumbPlaceholder}>
            <Ionicons
              name="camera-outline"
              size={22}
              color={COLORS.textSecondary}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  left: { flex: 1, gap: 2 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  memo: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbImage: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cellDimmed,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ---- フィーチャーカード（写真大）----

const FeaturedCard: React.FC<RecordCardProps> = ({ item, user, onPress }) => {
  const [resolvedPhoto, setResolvedPhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    void ensureFileExistsAsync(item.photoPath ?? null).then((path) => {
      if (mounted) setResolvedPhoto(path);
    });
    return () => {
      mounted = false;
    };
  }, [item.photoPath]);

  return (
    <TouchableOpacity
      style={featuredStyles.card}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={featuredStyles.photoArea}>
        {resolvedPhoto ? (
          <Image
            source={{ uri: resolvedPhoto }}
            style={featuredStyles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={featuredStyles.photoPlaceholder}>
            <Ionicons
              name="camera-outline"
              size={32}
              color={COLORS.textSecondary}
            />
          </View>
        )}
      </View>
      <View style={featuredStyles.body}>
        <Text style={featuredStyles.date}>{item.date.replace(/-/g, "/")}</Text>
        <Text style={featuredStyles.title} numberOfLines={2}>
          {item.title || "(タイトルなし)"}
        </Text>
        {item.memo ? (
          <Text style={featuredStyles.memo} numberOfLines={2}>
            {item.memo}
          </Text>
        ) : null}
        <AgeBadgeRow record={item} user={user} />
      </View>
    </TouchableOpacity>
  );
};

const featuredStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  photoArea: { width: "100%", height: 200 },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cellDimmed,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 12, gap: 4 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  memo: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});

// ---- セクションデータ型 ----

type CardItem = { record: Achievement; isFeatured: boolean };

// ---- メイン画面 ----

const AchievementListScreen: React.FC<Props> = () => {
  const rootNavigation = useNavigation<RootNavigation>();
  const user = useActiveUser();
  const { loading, store } = useAchievements();
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [isFilterExpanded, setFilterExpanded] = useState(false);
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const MIN_DATE = useMemo(() => new Date(1900, 0, 1), []);
  const MAX_DATE = useMemo(() => new Date(2100, 11, 31), []);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(today);

  const applyFromDate = (nextFrom: string | null) => {
    setFromDate(nextFrom);
    if (nextFrom && toDate && isIsoDateString(toDate) && nextFrom > toDate) {
      setToDate(nextFrom);
    }
  };

  const applyToDate = (nextTo: string | null) => {
    setToDate(nextTo);
    if (nextTo && fromDate && isIsoDateString(fromDate) && nextTo < fromDate) {
      setFromDate(nextTo);
    }
  };

  const openPicker = (target: "from" | "to") => {
    setPickerTarget(target);
    setPickerValue(getPickerDate(target === "from" ? fromDate : toDate, today));
  };

  // 今日の月齢（ヘッダー表示用）
  const todayAgeInfo = useMemo(() => {
    if (!user?.birthDate) return null;
    try {
      return calculateAgeInfo({
        targetDate: toIsoDateString(today),
        birthDate: user.birthDate,
        dueDate: user.dueDate,
        showCorrectedUntilMonths: user.settings.showCorrectedUntilMonths,
        ageFormat: user.settings.ageFormat,
      });
    } catch {
      return null;
    }
  }, [today, user]);

  // フィルタ後のフラットリスト
  const items = useMemo(() => {
    const allList: Achievement[] = Object.values(store).flat();
    const normalizedQuery = normalizeSearchText(searchText);
    const filteredBySearch = normalizedQuery
      ? allList.filter((item) => {
          const normalizedTarget = normalizeSearchText(
            `${item.title} ${item.memo ?? ""}`
          );
          return normalizedTarget.includes(normalizedQuery);
        })
      : allList;
    const validFrom = fromDate && isIsoDateString(fromDate) ? fromDate : null;
    const validTo = toDate && isIsoDateString(toDate) ? toDate : null;
    const filteredByRange = filteredBySearch.filter((item) => {
      if (validFrom && item.date < validFrom) return false;
      if (validTo && item.date > validTo) return false;
      return true;
    });
    return filteredByRange.slice().sort((a, b) => {
      if (a.date === b.date)
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      return b.date.localeCompare(a.date);
    });
  }, [fromDate, searchText, store, toDate]);

  // 月ごとにグループ化してセクション配列を生成
  const sections = useMemo(() => {
    const groups: Record<string, Achievement[]> = {};
    items.forEach((item) => {
      const key = item.date.slice(0, 7); // YYYY-MM
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, records]) => {
        // 各月で最も新しい（先頭の）写真付き記録をフィーチャー
        const featuredId = records.find((r) => r.photoPath)?.id ?? null;
        const year = parseInt(key.slice(0, 4), 10);
        const month = parseInt(key.slice(5, 7), 10);
        return {
          title: `${year}年${month}月`,
          data: records.map((r) => ({
            record: r,
            isFeatured: r.id === featuredId,
          })) as CardItem[],
        };
      });
  }, [items]);

  const navigateToRecord = (recordId: string) => {
    rootNavigation.navigate("RecordDetail", { recordId, from: "list" });
  };

  const renderItem = ({ item }: { item: CardItem }) => {
    if (!user) return null;
    if (item.isFeatured) {
      return (
        <FeaturedCard
          item={item.record}
          user={user}
          onPress={() => navigateToRecord(item.record.id)}
        />
      );
    }
    return (
      <RecordCard
        item={item.record}
        user={user}
        onPress={() => navigateToRecord(item.record.id)}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー：名前 ＋ 今日の月齢 */}
      <View style={styles.header}>
        <AppText style={styles.headerName} weight="medium">
          {user?.name ?? "プロフィール未設定"}
        </AppText>
        {todayAgeInfo ? (
          <View style={styles.headerAgeBlock}>
            {todayAgeInfo.flags.showMode === "gestational" &&
            todayAgeInfo.gestational.formatted ? (
              <Text style={styles.headerChronological}>
                {todayAgeInfo.chronological.formatted}
                <Text style={styles.headerCorrected}>
                  （在胎 {todayAgeInfo.gestational.formatted}）
                </Text>
              </Text>
            ) : todayAgeInfo.corrected.visible &&
              todayAgeInfo.corrected.formatted ? (
              <Text style={styles.headerChronological}>
                {todayAgeInfo.chronological.formatted}
                <Text style={styles.headerCorrected}>
                  （修正 {todayAgeInfo.corrected.formatted}）
                </Text>
              </Text>
            ) : (
              <Text style={styles.headerChronological}>
                {todayAgeInfo.chronological.formatted}
              </Text>
            )}
            {user?.settings.showDaysSinceBirth ? (
              <Text style={styles.headerDays}>
                生まれてから{todayAgeInfo.daysSinceBirth}日目
              </Text>
            ) : null}
          </View>
        ) : null}
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
            <Ionicons
              name="options-outline"
              size={20}
              color={COLORS.textSecondary}
            />
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
              <Text style={styles.filterValue}>{fromDate ?? "未設定"}</Text>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterRow}
              onPress={() => openPicker("to")}
              accessibilityRole="button"
              accessibilityLabel="終了日を選択"
            >
              <Text style={styles.filterLabel}>To</Text>
              <Text style={styles.filterValue}>{toDate ?? "未設定"}</Text>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFromDate(null);
                setToDate(null);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.clearButtonText}>範囲クリア</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.record.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? "読み込み中..." : "まだ記録がありません"}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>
      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        onPress={() => rootNavigation.navigate("RecordInput")}
      >
        <Text style={styles.fabText}>＋記録</Text>
      </TouchableOpacity>
      <DatePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === "from" ? "From" : "To"}
        value={pickerValue}
        minimumDate={MIN_DATE}
        maximumDate={MAX_DATE}
        onCancel={() => setPickerTarget(null)}
        onConfirm={(date) => {
          if (!pickerTarget) {
            setPickerTarget(null);
            return;
          }
          const iso = toIsoDateFromPicker(date);
          if (pickerTarget === "from") {
            applyFromDate(iso);
          } else {
            applyToDate(iso);
          }
          setPickerTarget(null);
        }}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 6,
  },
  headerName: {
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headerAgeBlock: {
    alignItems: "center",
    gap: 4,
  },
  headerChronological: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headerCorrected: {
    fontSize: 14,
    color: COLORS.accentMain,
  },
  headerDays: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: "#FFFFFF",
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
  list: {
    gap: 0,
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
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
