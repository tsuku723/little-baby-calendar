// TODO: This screen functions as a day-based view.
// Renaming to DayScreen is deferred for future refactor.

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { CalendarStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import { useActiveUser } from "@/state/AppStateContext";
import { useAchievements } from "@/state/AchievementsContext";
import { useDateViewContext } from "@/state/DateViewContext";
import { calculateAgeInfo, normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";
import { ensureFileExistsAsync } from "@/utils/photo";

type Props = NativeStackScreenProps<CalendarStackParamList, "Today">;
type RootNavigation = NavigationProp<RootStackParamList & TabParamList>;

const TodayScreen: React.FC<Props> = ({ navigation: stackNavigation, route }) => {
  const rootNavigation = useNavigation<RootNavigation>();
  // Hooks should remain at top level (no conditional hooks)
  const user = useActiveUser();
  const { byDay, loading: achievementsLoading } = useAchievements();
  const { selectedDate, selectDateFromCalendar } = useDateViewContext();
  const viewShotRef = useRef<ViewShot | null>(null);
  const [latestPhotoPath, setLatestPhotoPath] = useState<string | null>(null);

  const shouldHideTabBar = !user || !user.birthDate;

  const normalizedRouteDate = useMemo(() => normalizeToUtcDate(route.params.isoDate), [route.params.isoDate]);

  useEffect(() => {
    if (Number.isNaN(normalizedRouteDate.getTime())) return;
    selectDateFromCalendar(normalizedRouteDate);
  }, [normalizedRouteDate, selectDateFromCalendar]);

  const activeDate = useMemo(
    () => (!Number.isNaN(normalizedRouteDate.getTime()) ? normalizedRouteDate : selectedDate),
    [normalizedRouteDate, selectedDate]
  );

  const selectedDateIso = useMemo(() => toIsoDateString(activeDate), [activeDate]);

  const ageInfo = useMemo(() => {
    if (!user || !user.birthDate) return null;
    try {
      return calculateAgeInfo({
        targetDate: selectedDateIso,
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
    selectedDateIso,
    user?.birthDate,
    user?.dueDate,
    user?.settings.showCorrectedUntilMonths,
    user?.settings.ageFormat,
  ]);

  const todaysAchievements = useMemo(() => byDay[selectedDateIso] ?? [], [byDay, selectedDateIso]);
  const sortedAchievements = useMemo(
    () => todaysAchievements.slice().sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt)),
    [todaysAchievements]
  );
  const topTitles = useMemo(() => sortedAchievements.slice(0, 10), [sortedAchievements]);

  const displayDate = selectedDateIso.replace(/-/g, "/");

  useLayoutEffect(() => {
    const parent = stackNavigation.getParent();
    if (!parent) return;
    if (shouldHideTabBar) {
      parent.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        parent.setOptions({ tabBarStyle: { display: "flex" } });
      };
    }
    parent.setOptions({ tabBarStyle: { display: "flex" } });
  }, [stackNavigation, shouldHideTabBar]);

  useEffect(() => {
    let mounted = true;
    const resolveLatestPhoto = async () => {
      const photoCandidate = sortedAchievements.find((item) => item.photoPath);
      const ensured = await ensureFileExistsAsync(photoCandidate?.photoPath ?? null);
      if (!mounted) return;
      setLatestPhotoPath(ensured);
    };

    void resolveLatestPhoto();
    return () => {
      mounted = false;
    };
  }, [sortedAchievements]);

  const handleOpenCalendar = () => {
    stackNavigation.popToTop();
  };

  const handleSaveImage = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("権限を確認してください", "写真へのアクセスを許可すると画像を保存できます。");
        return;
      }

      const uri = await viewShotRef.current?.capture?.();
      if (!uri) {
        throw new Error("capture failed");
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("保存しました", "写真アプリに画像を保存しました。");
    } catch (error) {
      console.error("Failed to save day image", error);
      Alert.alert("保存に失敗しました", "時間をおいて再度お試しください。");
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>プロフィールを作成してください</Text>
          <Text style={styles.subtitle}>最初にプロフィール設定から始めましょう</Text>
          <View style={styles.buttonRow}>
            <Button
              title="セットアップへ"
              onPress={() => rootNavigation.navigate("SettingsStack", { screen: "ProfileManager" })}
            />
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
            onPress={() => rootNavigation.navigate("SettingsStack", { screen: "ProfileManager" })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.date}>{displayDate}</Text>
        <View style={styles.actionRow}>
          <Button title="カレンダー" color="#3A86FF" onPress={handleOpenCalendar} />
        </View>

        <View style={styles.exportActionRow}>
          <Button title="画像として保存" color="#3A86FF" onPress={handleSaveImage} />
        </View>

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
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => rootNavigation.navigate("RecordDetail", { recordId: item.id, from: "today" })}
                accessibilityRole="button"
              >
                <Text style={styles.cardTitle}>{item.title || "(タイトルなし)"}</Text>
                <Text style={styles.cardMeta}>{item.date}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      {/* 保存用の描画領域（画面には表示しない） */}
      <View style={styles.hiddenRenderer} pointerEvents="none">
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.exportContainer}>
          <View style={styles.exportContent} collapsable={false}>
            <Text style={styles.exportTitle}>{displayDate}</Text>
            {latestPhotoPath ? <Image source={{ uri: latestPhotoPath }} style={styles.exportPhoto} resizeMode="cover" /> : null}
            <View style={styles.exportList}>
              {topTitles.map((item) => (
                <View key={item.id} style={styles.exportListItem}>
                  <Text style={styles.exportListText} numberOfLines={2}>
                    ・{item.title || "(タイトルなし)"}
                  </Text>
                </View>
              ))}
              {topTitles.length === 0 ? (
                <Text style={styles.exportEmpty}>まだ記録がありません</Text>
              ) : null}
            </View>
          </View>
        </ViewShot>
      </View>
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
    paddingBottom: 140, // FAB に重ならない余白を確保
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
  actionRow: {
    alignSelf: "flex-start",
  },
  exportActionRow: {
    marginTop: 6,
    alignSelf: "flex-start",
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
  buttonRow: {
    marginTop: 12,
  },
  hiddenRenderer: {
    position: "absolute",
    left: -9999,
    top: -9999,
  },
  exportContainer: {
    width: 720,
    backgroundColor: "#FFFDF9",
    padding: 24,
    borderRadius: 16,
  },
  exportContent: {
    gap: 12,
  },
  exportTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2E2A27",
  },
  exportPhoto: {
    width: "100%",
    height: 360,
    borderRadius: 14,
    backgroundColor: "#F1EEE8",
  },
  exportList: {
    gap: 6,
  },
  exportListItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    padding: 10,
  },
  exportListText: {
    fontSize: 16,
    color: "#2E2A27",
  },
  exportEmpty: {
    fontSize: 15,
    color: "#6B665E",
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
