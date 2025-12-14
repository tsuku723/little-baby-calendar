import React, { useEffect, useMemo } from "react";
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { useAchievements } from "@/state/AchievementsContext";

type Props = NativeStackScreenProps<RootStackParamList, "RecordDetail">;

const typeLabel = (type: "did" | "tried"): string => (type === "did" ? "成長" : "頑張った");

const RecordDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recordId, isoDate } = route.params ?? {};
  const { store, setSelectedDate } = useAchievements();

  const record = useMemo(() => {
    const scoped = isoDate ? store[isoDate] ?? [] : [];
    if (scoped.length > 0) {
      const hit = scoped.find((item) => item.id === recordId);
      if (hit) return hit;
    }
    const all = Object.values(store).flat();
    return all.find((item) => item.id === recordId) ?? null;
  }, [isoDate, recordId, store]);

  // 記録が見つからない場合は自動で戻る（削除後の戻り先を考慮）
  useEffect(() => {
    if (!record) {
      navigation.goBack();
    } else {
      setSelectedDate(record.date);
    }
  }, [navigation, record, setSelectedDate]);

  if (!record) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>記録詳細</Text>

        <View style={styles.field}>
          <Text style={styles.label}>日付</Text>
          <Text style={styles.value}>{record.date.replace(/-/g, "/")}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>種別</Text>
          <Text style={styles.value}>{typeLabel(record.type)}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>内容</Text>
          <Text style={styles.value}>{record.title || "(内容未入力)"}</Text>
        </View>

        {record.memo ? (
          <View style={styles.field}>
            <Text style={styles.label}>メモ</Text>
            <Text style={styles.value}>{record.memo}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button title="戻る" color="#6B665E" onPress={() => navigation.goBack()} />
          <Button
            title="編集する"
            color="#3A86FF"
            onPress={() => navigation.navigate("RecordInput", { recordId: record.id, isoDate: record.date })}
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
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E2A27",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: "#6B665E",
  },
  value: {
    fontSize: 17,
    color: "#2E2A27",
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
});

export default RecordDetailScreen;
