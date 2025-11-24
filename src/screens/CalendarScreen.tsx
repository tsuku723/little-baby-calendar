import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import CalendarGrid from "@/components/CalendarGrid";
import MonthHeader from "@/components/MonthHeader";
import AchievementSheet from "@/components/AchievementSheet";
import { RootStackParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";
import { useSettings } from "@/state/SettingsContext";
import { buildCalendarMatrix, getAnchorMonthDate, monthKey, toUTCDateOnly } from "@/utils/date";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Calendar">;

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const { monthCounts, loadMonth } = useAchievements();
  const [anchorDate, setAnchorDate] = useState<Date>(() =>
    getAnchorMonthDate(settings.lastViewedMonth, toUTCDateOnly(new Date()))
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const monthKeyValue = monthKey(anchorDate);

  useEffect(() => {
    const isoMonth = `${anchorDate.getUTCFullYear()}-${String(anchorDate.getUTCMonth() + 1).padStart(2, "0")}`;
    void loadMonth(monthKeyValue);
    if (settings.lastViewedMonth !== `${isoMonth}-01`) {
      void updateSettings({ lastViewedMonth: `${isoMonth}-01` });
    }
  }, [anchorDate, loadMonth, monthKeyValue, settings.lastViewedMonth, updateSettings]);

  const matrix = useMemo(() => buildCalendarMatrix(anchorDate), [anchorDate]);
  const counts = monthCounts[monthKeyValue] ?? {};

  const handlePrev = () => {
    const prev = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() - 1, 1));
    setAnchorDate(prev);
  };

  const handleNext = () => {
    const next = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() + 1, 1));
    setAnchorDate(next);
  };

  const handleToday = () => {
    const today = toUTCDateOnly(new Date());
    setAnchorDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
  };

  const monthLabel = `${anchorDate.getUTCFullYear()}/${String(anchorDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const handlePressDay = (iso: string) => {
    setSelectedDay(iso);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <MonthHeader
          monthLabel={monthLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onOpenSettings={() => navigation.navigate("Setup")}
        />
        <View style={styles.weekRow}>
          {["日", "月", "火", "水", "木", "金", "土"].map((label) => (
            <Text key={label} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>
        <CalendarGrid matrix={matrix} countsByDay={counts} onPressDay={handlePressDay} />
        <Text style={styles.footer}>修正月齢の表記は目安です。医療的判断は主治医にご相談ください。</Text>
        <Text style={styles.footer}>このアプリの記録は端末内だけでそっと守られています。</Text>
      </View>
      <AchievementSheet isoDay={selectedDay} visible={!!selectedDay} onClose={() => setSelectedDay(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
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
