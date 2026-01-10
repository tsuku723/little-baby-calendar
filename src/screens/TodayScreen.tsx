// TODO: This screen functions as a day-based view.
// Renaming to DayScreen is deferred for future refactor.

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";

import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { CalendarStackParamList, RootStackParamList, TabParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useActiveUser } from "@/state/AppStateContext";
import { useAchievements } from "@/state/AchievementsContext";
import { useDateViewContext } from "@/state/DateViewContext";
import { calculateAgeInfo, normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";
import { ensureFileExistsAsync } from "@/utils/photo";
import { COLORS } from "@/constants/colors";

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
    stackNavigation.getParent()?.getParent()?.navigate("MainTabs", { screen: "CalendarStack" });
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
              title="設定へ"
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
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <AppText style={styles.headerName} weight="medium">
            {user.name}
          </AppText>
          <AppText style={styles.headerDate}>{displayDate}</AppText>
        </View>
        <TouchableOpacity
          style={styles.headerCalendarButton}
          onPress={handleOpenCalendar}
          accessibilityRole="button"
          accessibilityLabel="カレンダーへ戻る"
        >
          <Ionicons name="calendar-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.exportActionRow}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleSaveImage}
            accessibilityRole="button"
          >
            <Ionicons name="image-outline" size={18} color={COLORS.textPrimary} />
            <Text style={styles.exportButtonText}>画像として保存</Text>
          </TouchableOpacity>
        </View>

        {ageInfo ? (
          <View style={styles.ageBlock}>
            {ageInfo.corrected.visible && ageInfo.corrected.formatted ? (
              <View style={styles.ageRow}>
                <Text style={styles.ageLabel}>修正:</Text>
                <Text style={styles.ageValue}>{ageInfo.corrected.formatted}</Text>
                {ageInfo.chronological.formatted ? (
                  <Text style={styles.ageNote}>（実: {ageInfo.chronological.formatted}）</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.ageRow}>
                <Text style={styles.ageLabel}>実:</Text>
                <Text style={styles.ageValue}>{ageInfo.chronological.formatted}</Text>
              </View>
            )}
            {user.settings.showDaysSinceBirth ? (
              <Text style={styles.ageText}>生まれてから{ageInfo.daysSinceBirth}日目</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日の記録</Text>
          {achievementsLoading ? (
            <Text style={styles.empty}>読み込み中...</Text>
          ) : todaysAchievements.length === 0 ? (
            <Text style={styles.empty}>気づいたことがあれば記録しよう</Text>
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
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBackground,
  },
  headerTextBlock: {
    alignItems: "center",
    gap: 4,
  },
  headerName: {
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headerCalendarButton: {
    position: "absolute",
    right: 16,
    padding: 6,
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
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  ageBlock: {
    gap: 6,
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  ageLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  ageValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  ageNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ageText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  exportActionRow: {
    alignSelf: "flex-start",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.filterBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  section: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.accentMain,
    marginBottom: 8,
  },
  empty: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  cardMeta: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.background,
    padding: 24,
    borderRadius: 16,
  },
  exportContent: {
    gap: 12,
  },
  exportTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  exportPhoto: {
    width: "100%",
    height: 360,
    borderRadius: 14,
    backgroundColor: COLORS.cellDimmed,
  },
  exportList: {
    gap: 6,
  },
  exportListItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  exportListText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  exportEmpty: {
    fontSize: 15,
    color: COLORS.textSecondary,
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

export default TodayScreen;
