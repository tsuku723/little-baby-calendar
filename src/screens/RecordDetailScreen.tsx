import React, { useEffect, useMemo, useState } from "react";
import { Button, Image, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";
import { ensureFileExistsAsync } from "@/utils/photo";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RecordDetail">;

const RecordDetailScreen: React.FC<Props> = ({ navigation, route }) => {
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
          <Text style={styles.title}>險倬鹸縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ</Text>
          <Button
            title={from === "list" ? "險倬鹸荳隕ｧ縺ｫ謌ｻ繧・ : "Today縺ｫ謌ｻ繧・}
            onPress={() => navigation.replace("MainTabs", { screen: targetStack })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>險倬鹸隧ｳ邏ｰ</Text>

        <View style={styles.field}>
          <Text style={styles.label}>譌･莉・/Text>
          <Text style={styles.value}>{record.date.replace(/-/g, "/")}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>蜀・ｮｹ</Text>
          <Text style={styles.value}>{record.title || "(蜀・ｮｹ譛ｪ蜈･蜉・"}</Text>
        </View>

        {record.memo ? (
          <View style={styles.field}>
            <Text style={styles.label}>繝｡繝｢</Text>
            <Text style={styles.value}>{record.memo}</Text>
          </View>
        ) : null}

        {photoPath ? (
          <View style={styles.field}>
            <Text style={styles.label}>蜀咏悄</Text>
            <Image source={{ uri: photoPath }} style={styles.photo} resizeMode="cover" />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button title="謌ｻ繧・ color=COLORS.textSecondary onPress={() => navigation.goBack()} />
          <Button
            title="邱ｨ髮・☆繧・
            color=COLORS.accentMain
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

