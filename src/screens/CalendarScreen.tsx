import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import CalendarGrid from "@/components/CalendarGrid";
import MonthHeader from "@/components/MonthHeader";
import AchievementSheet from "@/components/AchievementSheet";
import { RootStackParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";
import { useSettings } from "@/state/SettingsContext";
import { buildCalendarMonthView, monthKey, toUtcDateOnly } from "@/utils/dateUtils";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Calendar">;

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const CalendarScreen: React.FC<Props> = ({ navigation, route }) => {
  const { settings, updateSettings } = useSettings();
  const { monthCounts, loadMonth } = useAchievements();
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    // 一覧から遷移した場合は選択日を優先し、その月を表示
    const initialDay = route.params?.initialSelectedDay;
    if (initialDay) {
      const [y, m] = initialDay.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, 1));
    }
    if (settings.lastViewedMonth) {
      const [y, m] = settings.lastViewedMonth.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, 1));
    }
    return toUtcDateOnly(new Date());
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(route.params?.initialSelectedDay ?? null);
  const monthKeyValue = monthKey(anchorDate);

  useEffect(() => {
    // 表示月を変更したら該当月の●集計を読み込み、最後に見た月として保存
    void loadMonth(monthKeyValue);
    const isoMonth = `${anchorDate.getUTCFullYear()}-${String(anchorDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
    if (settings.lastViewedMonth !== isoMonth) {
      void updateSettings({ lastViewedMonth: isoMonth });
    }
  }, [anchorDate, loadMonth, monthKeyValue, settings.lastViewedMonth, updateSettings]);

  const monthView = useMemo(
    () =>
      buildCalendarMonthView({
        anchorDate,
        settings,
        achievementCountsByDay: monthCounts[monthKeyValue],
      }),
    [anchorDate, monthCounts, monthKeyValue, settings]
  );

  const handlePrev = () => {
    const prev = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() - 1, 1));
    setAnchorDate(prev);
  };

  const handleNext = () => {
    const next = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() + 1, 1));
    setAnchorDate(next);
  };

  const handleToday = () => {
    const today = toUtcDateOnly(new Date());
    setAnchorDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
  };

  const monthLabel = `${anchorDate.getUTCFullYear()}/${String(anchorDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const handlePressDay = (iso: string) => {
    // 日付タップで詳細シートを開く
    setSelectedDay(iso);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <MonthHeader
            monthLabel={monthLabel}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            onOpenSettings={() => navigation.navigate("Settings")}
            onOpenList={() => navigation.navigate("AchievementList")}
          />
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((label) => (
              <Text key={label} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>
          <CalendarGrid days={monthView.days} onPressDay={handlePressDay} />
          <Text style={styles.footer}>修正月齢の表記は目安です。医療的判断は主治医にご相談ください。</Text>
          <Text style={styles.footer}>データは端末内のみで保存します。</Text>
        </View>
      </ScrollView>
      <AchievementSheet isoDay={selectedDay} visible={!!selectedDay} onClose={() => setSelectedDay(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
  },
  scrollContainer: {
    flexGrow: 1, // Webでスクロール可能にするため追加
  },
  container: {
    flex: 1,
    gap: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#6B665E",
  },
  footer: {
    textAlign: "center",
    color: "#6B665E",
    fontSize: 12,
  },
});

export default CalendarScreen;
