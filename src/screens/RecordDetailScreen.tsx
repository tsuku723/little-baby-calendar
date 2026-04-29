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
import AgeBadge from "@/components/AgeBadge";
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
          <Text style={styles.notFoundText}>記録が見つかりません</Text>
          <Button title="戻る" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const showGestational =
    ageInfo?.flags.showMode === "gestational" &&
    ageInfo.gestational.visible &&
    ageInfo.gestational.formatted;
  const showCorrected =
    ageInfo?.flags.showMode === "corrected" &&
    ageInfo.corrected.visible &&
    ageInfo.corrected.formatted;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー：戻る | タイトル | 編集テキストリンク */}
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
          <Text style={styles.editLink}>編集</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 日付（写真の上に小さく） */}
        <Text style={styles.date}>{record.date.replace(/-/g, "/")}</Text>

        {/* 写真 */}
        {photoPath ? (
          <Image
            source={{ uri: photoPath }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : null}

        {/* タイトル */}
        <Text style={styles.title}>{record.title || "(タイトル未入力)"}</Text>

        {/* 月齢バッジ行 */}
        {ageInfo ? (
          <View style={styles.badgeRow}>
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
            {user?.settings.showDaysSinceBirth ? (
              <View style={styles.daysBadge}>
                <Text style={styles.daysBadgeText}>
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
            <Text style={styles.memoBody}>{record.memo}</Text>
          </View>
        ) : null}
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  headerRight: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  editLink: {
    fontSize: 15,
    color: COLORS.accentMain,
    fontWeight: "600",
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 48,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  photo: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    backgroundColor: COLORS.cellDimmed,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  daysBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.cellDimmed,
  },
  daysBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  memoSection: {
    gap: 6,
  },
  memoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memoBody: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
});

export default RecordDetailScreen;
