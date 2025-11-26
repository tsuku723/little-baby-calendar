import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AchievementForm from "@/components/AchievementForm";
import AchievementItem from "@/components/AchievementItem";
import { useAchievements } from "@/state/AchievementsContext";
import { useSettings } from "@/state/SettingsContext";
import { calculateAgeInfo, normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";

interface Props {
  isoDay: string | null;
  visible: boolean;
  onClose: () => void;
}

const AchievementSheet: React.FC<Props> = ({ isoDay, visible, onClose }) => {
  const { settings } = useSettings();
  const { byDay, loadDay, remove } = useAchievements();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // シートを開くたびに対象日付の記録を読み込む
    if (isoDay && visible) {
      void loadDay(isoDay);
      setEditingId(null);
    }
  }, [isoDay, visible, loadDay]);

  const normalizedIso = isoDay ? toIsoDateString(normalizeToUtcDate(isoDay)) : null;
  const achievements = normalizedIso ? byDay[normalizedIso] ?? [] : [];
  const editing = useMemo(() => achievements.find((item) => item.id === editingId) ?? null, [achievements, editingId]);

  const ageInfo = useMemo(() => {
    // 対象日と設定から年齢情報を再計算
    if (!normalizedIso || !settings.birthDate) return null;
    return calculateAgeInfo({
      targetDate: normalizedIso,
      birthDate: settings.birthDate,
      dueDate: settings.dueDate,
      showCorrectedUntilMonths: settings.showCorrectedUntilMonths,
      ageFormat: settings.ageFormat,
    });
  }, [normalizedIso, settings]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.date}>{normalizedIso ?? ""}</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={styles.close}>閉じる</Text>
          </TouchableOpacity>
        </View>
        {ageInfo ? (
          <View style={styles.ageBlock}>
            <Text style={styles.age}>実: {ageInfo.chronological.formatted}</Text>
            {ageInfo.corrected.visible && ageInfo.corrected.formatted ? (
              <Text style={styles.age}>修: {ageInfo.corrected.formatted}</Text>
            ) : null}
            {settings.showDaysSinceBirth ? (
              <Text style={styles.age}>生後日数: {ageInfo.daysSinceBirth}日目</Text>
            ) : null}
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.list}>
            {achievements.length === 0 ? (
              <Text style={styles.empty}>まだ記録はありません。はじめの一歩を残しませんか？</Text>
            ) : null}
            {achievements.map((item) => (
              <AchievementItem key={item.id} item={item} onEdit={setEditingId} onDelete={(ach) => remove(ach.id, ach.date)} />
            ))}
          </View>
        </ScrollView>
        <View style={styles.formSection}>
          <AchievementForm isoDay={normalizedIso ?? toIsoDateString(normalizeToUtcDate(new Date()))} draft={editing} onClose={onClose} />
        </View>
        <Text style={styles.notice}>※ データはこの端末内にのみ保存されます。</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF9",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E2A27",
  },
  close: {
    fontSize: 16,
    color: "#3A86FF",
  },
  age: {
    fontSize: 16,
    color: "#2E2A27",
  },
  scroll: {
    gap: 12,
    paddingBottom: 16,
  },
  list: {
    gap: 12,
  },
  empty: {
    fontSize: 16,
    color: "#6B665E",
    textAlign: "center",
  },
  formSection: {
    marginTop: 16,
  },
  notice: {
    fontSize: 12,
    color: "#6B665E",
    marginTop: 16,
    textAlign: "center",
  },
  ageBlock: {
    gap: 4,
    marginBottom: 12,
  },
});

export default AchievementSheet;
