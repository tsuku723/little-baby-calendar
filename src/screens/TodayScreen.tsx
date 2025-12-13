// TODO: This screen functions as a day-based view.
// Renaming to DayScreen is deferred for future refactor.

import React, { useMemo, useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AchievementForm from "@/components/AchievementForm";
import { RootStackParamList, TabParamList, TodayStackParamList } from "@/navigation";
import { useActiveUser } from "@/state/AppStateContext";
import { useAchievements } from "@/state/AchievementsContext";
import { calculateAgeInfo, toIsoDateString } from "@/utils/dateUtils";

type Props = NativeStackScreenProps<TodayStackParamList, "Today">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const TodayScreen: React.FC<Props> = ({ navigation: stackNavigation, route }) => {
  const rootNavigation = useNavigation<RootNavigation>();
  // Hooks should remain at top level (no conditional hooks)
  const user = useActiveUser();
  const { byDay, loading: achievementsLoading, selectedDate, setSelectedDate } = useAchievements();
  const [formVisible, setFormVisible] = useState(false);

  // 表示対象日付。Navigator側互換のため selectedDay / isoDay 両方を見る
  const isoDay = useMemo(() => {
    const incoming = route.params?.isoDay ?? route.params?.selectedDay;
    if (incoming) {
      setSelectedDate(incoming);
      return incoming;
    }
    return selectedDate || toIsoDateString(new Date());
  }, [route.params?.isoDay, route.params?.selectedDay, selectedDate, setSelectedDate]);

  const ageInfo = useMemo(() => {
    if (!user || !user.birthDate) return null;
    try {
      return calculateAgeInfo({
        targetDate: isoDay,
        birthDate: user.birthDate,
        dueDate: user.dueDate,
        showCorrectedUntilMonths: user.settings.showCorrectedUntilMonths,
        ageFormat: user.settings.ageFormat,
      });
    } catch {
      return null;
    }
  }, [
    user,
    isoDay,
    user?.birthDate,
    user?.dueDate,
    user?.settings.showCorrectedUntilMonths,
    user?.settings.ageFormat,
  ]);

  const todaysAchievements = useMemo(() => byDay[isoDay] ?? [], [byDay, isoDay]);

  const displayDate = isoDay.replace(/-/g, "/");

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>プロフィールを作成してください</Text>
          <Text style={styles.subtitle}>最初にプロフィール設定から始めましょう</Text>
          <View style={styles.buttonRow}>
            <Button title="セットアップへ" onPress={() => stackNavigation.navigate("ProfileManager")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user.birthDate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>{user.name}</Text>
          <Text style={styles.subtitle}>生年月日が未設定です</Text>
          <Button title="プロフィールを編集" onPress={() => stackNavigation.navigate("ProfileManager")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.date}>{displayDate}</Text>

        {ageInfo ? (
          <View style={styles.ageBlock}>
            <Text style={styles.ageText}>暦: {ageInfo.chronological.formatted}</Text>
            {ageInfo.corrected.visible && ageInfo.corrected.formatted ? (
              <Text style={styles.ageText}>修: {ageInfo.corrected.formatted}</Text>
            ) : null}
            {user.settings.showDaysSinceBirth ? (
              <Text style={styles.ageText}>生後日数: {ageInfo.daysSinceBirth}日目</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日の記録</Text>
          {achievementsLoading ? (
            <Text style={styles.empty}>読み込み中...</Text>
          ) : todaysAchievements.length === 0 ? (
            <Text style={styles.empty}>まだ記録はありません</Text>
          ) : (
            todaysAchievements.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.title || "(タイトルなし)"}</Text>
                <Text style={styles.cardMeta}>{item.date}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.buttonColumn}>
          <Button
            title={formVisible ? "記録フォームを閉じる" : "記録する"}
            onPress={() => setFormVisible((prev) => !prev)}
            color="#3A86FF"
          />
          <Button title="カレンダーを見る" onPress={() => rootNavigation.navigate("CalendarStack")} color="#6B665E" />
          <Button title="記録一覧" onPress={() => rootNavigation.navigate("RecordListStack")} color="#6B665E" />
          <Button title="プロフィール切り替え" onPress={() => stackNavigation.navigate("ProfileManager")} color="#6B665E" />
        </View>

        {formVisible ? (
          <View style={styles.formWrapper}>
            <AchievementForm isoDay={isoDay} draft={null} onClose={() => setFormVisible(false)} />
          </View>
        ) : null}
      </ScrollView>
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
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2A27",
  },
  subtitle: {
    fontSize: 16,
    color: "#2E2A27",
  },
  date: {
    fontSize: 18,
    color: "#2E2A27",
  },
  ageBlock: {
    gap: 4,
  },
  ageText: {
    fontSize: 16,
    color: "#2E2A27",
  },
  section: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#D7D3CC",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2A27",
    marginBottom: 8,
  },
  empty: {
    fontSize: 16,
    color: "#6B665E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2A27",
  },
  cardMeta: {
    fontSize: 14,
    color: "#6B665E",
  },
  buttonColumn: {
    gap: 12,
  },
  buttonRow: {
    marginTop: 12,
  },
  formWrapper: {
    marginTop: 16,
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

export default TodayScreen;
