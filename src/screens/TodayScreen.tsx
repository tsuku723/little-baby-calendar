import React, { useCallback, useMemo } from "react";
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { useActiveUser, useAchievements } from "@/state/AppStateContext";
import { calculateAgeInfo, toIsoDateString } from "@/utils/dateUtils";

type Props = NativeStackScreenProps<RootStackParamList, "Today">;

const TodayScreen: React.FC<Props> = ({ navigation }) => {
  const user = useActiveUser();
  const achievements = useAchievements();

  const todayIso = toIsoDateString(new Date());
  const todayDisplay = todayIso.replace(/-/g, "/");


  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>プロフィールを作成してください</Text>
          <Text style={styles.subtitle}>最初のセットアップからはじめましょう。</Text>
          <View style={styles.buttonRow}>
            <Button title="セットアップへ" onPress={() => navigation.navigate("Setup")} />
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
          <Button
            title="プロフィールを編集"
            onPress={() => navigation.navigate("ProfileManager")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const ageInfo = useMemo(() => {
    try {
      return calculateAgeInfo({
        targetDate: todayIso,
        birthDate: user.birthDate,
        dueDate: user.dueDate,
        showCorrectedUntilMonths: user.settings.showCorrectedUntilMonths,
        ageFormat: user.settings.ageFormat,
      });
    } catch (error) {
      console.warn("TodayScreen: failed to calculate age", error);
      return null;
    }
  }, [todayIso, user.birthDate, user.dueDate, user.settings.showCorrectedUntilMonths, user.settings.ageFormat]);

  const todaysAchievements = useMemo(
    () => achievements.filter((item) => item.date === todayIso),
    [achievements, todayIso]
  );

  const latest =
    todaysAchievements.length > 0
      ? todaysAchievements[todaysAchievements.length - 1]
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.date}>{todayDisplay}</Text>

        {ageInfo ? (
          <View style={styles.ageBlock}>
            <Text style={styles.ageText}>実: {ageInfo.chronological.formatted}</Text>
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
          {latest ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{latest.title || "(タイトルなし)"}</Text>
              <Text style={styles.cardMeta}>
                {latest.tag === "growth" ? "成長" : "頑張った"} / {latest.date}
              </Text>
              {latest.memo ? <Text style={styles.cardBody}>{latest.memo}</Text> : null}
            </View>
          ) : (
            <Text style={styles.empty}>まだ記録はありません。</Text>
          )}
        </View>

        <View style={styles.buttonColumn}>
          <Button
            title="記録する"
            onPress={() => navigation.navigate("AchievementSheet", { isoDay: todayIso })}
            color="#3A86FF"
          />
          <Button
            title="カレンダーを見る"
            onPress={() => navigation.navigate("Calendar")}
            color="#6B665E"
          />
          <Button
            title="記録一覧"
            onPress={() => navigation.navigate("AchievementList")}
            color="#6B665E"
          />
          <Button
            title="プロフィール切り替え"
            onPress={() => {
              try {
                navigation.navigate("ProfileManager");
              } catch (e) {
                console.warn("ProfileManager is not implemented yet");
              }
            }}
            color="#6B665E"
          />
        </View>
      </View>
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
  cardBody: {
    fontSize: 15,
    color: "#2E2A27",
  },
  buttonColumn: {
    gap: 12,
  },
  buttonRow: {
    marginTop: 12,
  },
});

export default TodayScreen;
