import React, { useEffect, useMemo, useState } from "react";
import { Button, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useActiveUser } from "@/state/AppStateContext";
import { useAchievements } from "@/state/AchievementsContext";
import { ensureFileExistsAsync } from "@/utils/photo";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RecordDetail">;

const RecordDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  // 選択中ベビー名取得（ベビー名のない場合は "記録" のまま）
  const user = useActiveUser();
  const { recordId, isoDate, from } = route.params ?? {};
  const { store } = useAchievements();
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const record = useMemo(() => {
    const scoped = isoDate ? store[isoDate] ?? [] : [];
    if (scoped.length > 0) {
      const hit = scoped.find((item) => item.id === recordId);
      if (hit) return hit;
    }
    const all = Object.values(store).flat();
    return all.find((item) => item.id === recordId) ?? null;
  }, [isoDate, recordId, store]);

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
    const targetStack = from === "list" ? "RecordListStack" : "CalendarStack";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>記録が見つかりません</Text>
          <Button
            title={from === "list" ? "記録一覧に戻る" : "今日に戻る"}
            onPress={() => navigation.replace("MainTabs", { screen: targetStack })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー：左に戻るボタン、中央に「ベビー名の記録」 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.accentMain} />
        </TouchableOpacity>
        <AppText weight="medium" style={styles.headerTitle}>
          {user?.name ? `${user.name}の記録` : "記録"}
        </AppText>
        {/* プレースホルダ（中央揃え用） */}
        <View style={styles.headerRight} />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>記録詳細</Text>

        <View style={styles.field}>
          <Text style={styles.label}>日付</Text>
          <Text style={styles.value}>{record.date.replace(/-/g, "/")}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>タイトル</Text>
          <Text style={styles.value}>{record.title || "(タイトル未入力)"}</Text>
        </View>

        {record.memo ? (
          <View style={styles.field}>
            <Text style={styles.label}>メモ</Text>
            <Text style={styles.value}>{record.memo}</Text>
          </View>
        ) : null}

        {photoPath ? (
          <View style={styles.field}>
            <Text style={styles.label}>写真</Text>
            <Image source={{ uri: photoPath }} style={styles.photo} resizeMode="cover" />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button title="戻る" color={COLORS.textSecondary} onPress={() => navigation.goBack()} />
          <Button
            title="編集する"
            color={COLORS.accentMain}
            onPress={() =>
              navigation.navigate("RecordInput", { recordId: record.id, isoDate: record.date, from })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  /* 記録詳細ヘッダー */
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
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  photo: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    backgroundColor: COLORS.cellDimmed,
  },
});

export default RecordDetailScreen;
