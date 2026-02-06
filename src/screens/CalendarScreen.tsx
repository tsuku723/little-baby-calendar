import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import CalendarGrid from "@/components/CalendarGrid";
import CalendarDecorations from "@/components/CalendarDecorations";
import MonthHeader from "@/components/MonthHeader";
import { CalendarStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";
import { useActiveUser, useAppState } from "@/state/AppStateContext";
import { useDateViewContext } from "@/state/DateViewContext";
import {
  buildCalendarMonthView,
  calculateAgeInfo,
  formatCalendarAgeLabel,
  monthKey,
  normalizeToUtcDate,
  toIsoDateString,
  toUtcDateOnly,
} from "@/utils/dateUtils";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<CalendarStackParamList, "Calendar">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const rootNavigation = useNavigation<RootNavigation>();
  const insets = useSafeAreaInsets();
  const user = useActiveUser();
  const { updateUser } = useAppState();
  const { monthCounts, loadMonth } = useAchievements();
  const { selectDateFromCalendar } = useDateViewContext();
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    if (user?.settings.lastViewedMonth) {
      const normalized = normalizeToUtcDate(user.settings.lastViewedMonth);
      if (!Number.isNaN(normalized.getTime())) {
        return new Date(normalized.getFullYear(), normalized.getMonth(), 1);
      }
    }
    return toUtcDateOnly(new Date());
  });
  const monthKeyValue = monthKey(anchorDate);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [datePickerReady, setDatePickerReady] = useState(false);
  const ignoreNextChangeRef = useRef(false);
  const [tempMonthDate, setTempMonthDate] = useState<Date>(anchorDate);

  useEffect(() => {
    void loadMonth(monthKeyValue);
    const isoMonth = `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, "0")}-01`;
    if (user?.settings.lastViewedMonth !== isoMonth && user?.id) {
      void updateUser(user.id, { settings: { ...user.settings, lastViewedMonth: isoMonth } });
    }
  }, [anchorDate, loadMonth, monthKeyValue, updateUser, user]);

  const monthView = useMemo(
    () =>
      buildCalendarMonthView({
        anchorDate,
        settings: {
          showCorrectedUntilMonths: user?.settings.showCorrectedUntilMonths ?? null,
          ageFormat: user?.settings.ageFormat ?? "md",
          showDaysSinceBirth: user?.settings.showDaysSinceBirth ?? true,
          lastViewedMonth: user?.settings.lastViewedMonth ?? null,
        },
        birthDate: user?.birthDate ?? null,
        dueDate: user?.dueDate ?? null,
        achievementCountsByDay: monthCounts[monthKeyValue],
      }),
    [anchorDate, monthCounts, monthKeyValue, user]
  );

  const handlePrev = () => {
    const prev = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    setAnchorDate(prev);
  };

  const handleNext = () => {
    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1);
    setAnchorDate(next);
  };

  const handleToday = () => {
    const today = toUtcDateOnly(new Date());
    setAnchorDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const openMonthPicker = () => {
    ignoreNextChangeRef.current = true;
    setDatePickerReady(false);
    setTempMonthDate(anchorDate);
    setShowMonthPicker(true);
  };

  const closeMonthPicker = () => {
    ignoreNextChangeRef.current = false;
    setDatePickerReady(false);
    setShowMonthPicker(false);
  };

  const handleMonthChange = (_: DateTimePickerEvent, pickedDate?: Date) => {
    if (ignoreNextChangeRef.current) {
      ignoreNextChangeRef.current = false;
      return;
    }
    if (!pickedDate) return;
    if (Number.isNaN(pickedDate.getTime())) return;
    if (pickedDate.getFullYear() <= 1971) return;
    setTempMonthDate(pickedDate);
  };

  const handleMonthConfirm = () => {
    const year = tempMonthDate.getFullYear();
    const month = tempMonthDate.getMonth();
    setAnchorDate(new Date(year, month, 1));
    closeMonthPicker();
  };

  const monthLabel = `${anchorDate.getFullYear()}/${String(anchorDate.getMonth() + 1).padStart(2, "0")}`;

  const handlePressDay = (iso: string) => {
    const normalized = normalizeToUtcDate(iso);
    if (Number.isNaN(normalized.getTime())) return;

    selectDateFromCalendar(normalized);
    const normalizedIso = toIsoDateString(normalized);
    navigation.push("Today", { isoDate: normalizedIso });
  };

  const todayDate = useMemo(() => toUtcDateOnly(new Date()), []);
  const todayIso = useMemo(() => toIsoDateString(todayDate), [todayDate]);
  const ageFormat = user?.settings.ageFormat ?? "md";

  const todayAgeInfo = useMemo(() => {
    if (!user?.birthDate) return null;
    try {
      return calculateAgeInfo({
        targetDate: todayIso,
        birthDate: user.birthDate,
        dueDate: user.dueDate,
        showCorrectedUntilMonths: user.settings.showCorrectedUntilMonths,
        ageFormat,
      });
    } catch {
      return null;
    }
  }, [ageFormat, todayIso, user?.birthDate, user?.dueDate, user?.settings.showCorrectedUntilMonths]);

  const correctedTodayLabel =
    todayAgeInfo?.corrected.visible && todayAgeInfo.corrected.formatted
      ? formatCalendarAgeLabel(todayAgeInfo.corrected, ageFormat, true)
      : null;
  const chronologicalTodayLabel = todayAgeInfo
    ? formatCalendarAgeLabel(todayAgeInfo.chronological, ageFormat, false)
    : null;
  const chronologicalTodayLabelWithPrefix = chronologicalTodayLabel
    ? `実${chronologicalTodayLabel}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundLayer} pointerEvents="none" accessible={false}>
        <View style={styles.backgroundTop} />
        <View style={styles.backgroundBottom} />
      </View>
      <CalendarDecorations topOffset={insets.top} />
      <View style={styles.fixedHeader}>
        <Text style={styles.headerName}>{user?.name ?? "プロフィール未設定"}</Text>
        {todayAgeInfo ? (
          <View style={styles.headerAgeBlock}>
            {correctedTodayLabel && chronologicalTodayLabelWithPrefix ? (
              <Text style={styles.headerCorrected}>
                {correctedTodayLabel}
                <Text style={styles.headerChronological}>
                  （{chronologicalTodayLabelWithPrefix}）
                </Text>
              </Text>
            ) : correctedTodayLabel ? (
              <Text style={styles.headerCorrected}>{correctedTodayLabel}</Text>
            ) : chronologicalTodayLabelWithPrefix ? (
              <Text style={styles.headerChronological}>{chronologicalTodayLabelWithPrefix}</Text>
            ) : null}
            <Text style={styles.headerDays}>生まれてから{todayAgeInfo.daysSinceBirth}日目</Text>
          </View>
        ) : (
          <Text style={styles.headerPlaceholder}>年齢情報は設定済みのプロフィールで表示されます</Text>
        )}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
        <View style={styles.container}>
          <MonthHeader
            monthLabel={monthLabel}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            onPressMonthLabel={openMonthPicker}
          />
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((label, idx) => (
              <Text
                key={label}
                style={[
                  styles.weekLabel,
                  idx === 0 && { color: COLORS.sunday },
                  idx === 6 && { color: COLORS.saturday },
                  idx !== 0 && idx !== 6 && { color: COLORS.weekday },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
          <CalendarGrid days={monthView.days} onPressDay={handlePressDay} />
          <Text style={styles.footer}>修正月齢の表記は目安です。医療的判断は主治医にご相談ください。</Text>
          <Text style={styles.footer}>データは端末内で保存します。</Text>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        // Phase 1: FAB は記録入力画面への入口だけを保持
        onPress={() => rootNavigation.navigate("RecordInput")}
      >
        <Text style={styles.fabText}>＋記録</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent
        visible={showMonthPicker}
        onRequestClose={closeMonthPicker}
        statusBarTranslucent
        onShow={() => requestAnimationFrame(() => setDatePickerReady(true))}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMonthPicker} accessibilityRole="button" />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeMonthPicker} accessibilityRole="button">
              <Text style={styles.modalHeaderText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>年月を選択</Text>
            <TouchableOpacity onPress={handleMonthConfirm} accessibilityRole="button">
              <Text style={styles.modalHeaderText}>完了</Text>
            </TouchableOpacity>
          </View>
          {datePickerReady ? (
            <DateTimePicker
              value={tempMonthDate}
              mode="date"
              display="spinner"
              locale="ja-JP"
              onChange={handleMonthChange}
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundTop: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundBottom: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 6,
  },
  scroll: {
    backgroundColor: COLORS.background,
  },
  headerName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    fontFamily: "ZenMaruGothic-Medium",
  },
  headerAgeBlock: {
    alignItems: "center",
    gap: 4,
  },
  headerCorrected: {
    fontSize: 14,
    color: COLORS.accentMain,
    fontFamily: "ZenMaruGothic-Regular",
    textAlign: "center",
  },
  headerChronological: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: "ZenMaruGothic-Regular",
    textAlign: "center",
  },
  headerDays: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  headerPlaceholder: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  container: {
    flex: 1,
    gap: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  footer: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accentMain,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});

export default CalendarScreen;

