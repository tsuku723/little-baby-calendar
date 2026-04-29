import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useActiveUser } from "@/state/AppStateContext";
import { useAchievements } from "@/state/AchievementsContext";
import { calculateAgeInfo } from "@/utils/dateUtils";
import { ensureFileExistsAsync } from "@/utils/photo";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RecordDetail">;

const RecordDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const user = useActiveUser();
  const { recordId, isoDate, from } = route.params ?? {};
  const { store, loading } = useAchievements();
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const record = useMemo(() => {
    const scoped = isoDate ? (store[isoDate] ?? []) : [];
    if (scoped.length > 0) {
      const hit = scoped.find((item) => item.id === recordId);
      if (hit) return hit;
    }
    const all = Object.values(store).flat();
    return all.find((item) => item.id === recordId) ?? null;
  }, [isoDate, recordId, store]);

  const ageInfo = useMemo(() => {
    if (!user?.birthDate || !record) return null;
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
  }, [user, record]);

  useEffect(() => {
    let mounted = true;
    const verifyPhoto = async () => {
      const ensured = await ensureFileExistsAsync(record?.photoPath ?? null);
      if (!mounted) return;
      setPhotoPath(ensured);
    };
    void verifyPhoto();
    return () => {
      mounted = false;
    };
  }, [record?.photoPath]);

  if (!record) {
    if (loading) return null;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>記録が見つかりません</Text>
          <Button title="戻る" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <AppText weight="medium" style={styles.headerTitle}>
          {user?.name ? `${user.name}の記録` : "記録"}
        </AppText>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() =>
            navigation.navigate("RecordInput", {
              recordId: record.id,
              isoDate: record.date,
              from,
            })
          }
          accessibilityRole="button"
          accessibilityLabel="編集"
        >
          <Text style={styles.headerEditText}>編集</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 写真エリア */}
        <View style={styles.photoWrapper}>
          {photoPath ? (
            <Image
              source={{ uri: photoPath }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons
                name="camera-outline"
                size={40}
                color={COLORS.textSecondary}
              />
            </View>
          )}
          <View style={styles.dateOverlay}>
            <Text style={styles.dateOverlayText}>
              {record.date.replace(/-/g, "/")}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* タイトル */}
          <Text style={styles.title}>{record.title || "(タイトル未入力)"}</Text>

          {/* 月齢バッジ */}
          {ageInfo ? (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgeChronological]}>
                <Text style={styles.badgeText}>
                  {ageInfo.chronological.formatted}
                </Text>
              </View>
              {ageInfo.flags.showMode === "gestational" &&
              ageInfo.gestational.visible &&
              ageInfo.gestational.formatted ? (
                <View style={[styles.badge, styles.badgeGestational]}>
                  <Text style={styles.badgeText}>
                    在胎 {ageInfo.gestational.formatted}
                  </Text>
                </View>
              ) : null}
              {ageInfo.corrected.visible && ageInfo.corrected.formatted ? (
                <View style={[styles.badge, styles.badgeCorrected]}>
                  <Text style={styles.badgeText}>
                    修正 {ageInfo.corrected.formatted}
                  </Text>
                </View>
              ) : null}
              {user?.settings.showDaysSinceBirth ? (
                <View style={[styles.badge, styles.badgeDays]}>
                  <Text style={styles.badgeText}>
                    {ageInfo.daysSinceBirth}日目
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* メモ */}
          {record.memo ? (
            <View style={styles.memoSection}>
              <Text style={styles.memoLabel}>メモ</Text>
              <Text style={styles.memoText}>{record.memo}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBackground,
  },
  headerLeft: {
    position: "absolute",
    left: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  headerEditText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoWrapper: {
    width: "100%",
    height: 280,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cellDimmed,
    alignItems: "center",
    justifyContent: "center",
  },
  dateOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateOverlayText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeChronological: {
    backgroundColor: COLORS.ageBadgeChronologicalBg,
  },
  badgeCorrected: {
    backgroundColor: COLORS.ageBadgeCorrectedBg,
  },
  badgeGestational: {
    backgroundColor: COLORS.ageBadgeGestationalBg,
  },
  badgeDays: {
    backgroundColor: COLORS.ageBadgeChronologicalBg,
  },
  badgeText: {
    fontSize: 13,
    color: COLORS.ageBadgeText,
    fontWeight: "600",
  },
  memoSection: {
    gap: 6,
  },
  memoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  memoText: {
    fontSize: 17,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});

export default RecordDetailScreen;
