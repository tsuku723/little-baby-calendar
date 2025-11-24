import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AchievementForm from "@/components/AchievementForm";
import AchievementItem from "@/components/AchievementItem";
import { computeAgeLabels, ensureDayKey } from "@/services/AgeService";
import { useAchievements } from "@/state/AchievementsContext";
import { useSettings } from "@/state/SettingsContext";

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
    if (isoDay && visible) {
      void loadDay(isoDay);
      setEditingId(null);
    }
  }, [isoDay, visible, loadDay]);

  const achievements = isoDay ? byDay[isoDay] ?? [] : [];
  const editing = useMemo(() => achievements.find((item) => item.id === editingId) ?? null, [achievements, editingId]);

  const ageLabels = useMemo(() => {
    if (!isoDay) return null;
    return computeAgeLabels({ settings, isoDay });
  }, [isoDay, settings]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.date}>{isoDay}</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={styles.close}>閉じる</Text>
          </TouchableOpacity>
        </View>
        {ageLabels ? (
          <Text style={styles.age}>
            実: {ageLabels.chronological}
            {ageLabels.corrected && !ageLabels.suppressed ? ` / 修: ${ageLabels.corrected}` : ""}
          </Text>
        ) : null}
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.list}>
            {achievements.length === 0 ? <Text style={styles.empty}>まだ記録はありません。はじめの一歩を残しませんか？</Text> : null}
            {achievements.map((item) => (
              <AchievementItem key={item.id} item={item} onEdit={setEditingId} onDelete={(ach) => remove(ach.id, ach.yyyy_mm_dd)} />
            ))}
          </View>
        </ScrollView>
        <View style={styles.formSection}>
          <AchievementForm isoDay={isoDay ?? ensureDayKey(new Date())} draft={editing} onClose={onClose} />
        </View>
        <Text style={styles.notice}>※ データはこの端末内に保存されます。バックアップはエクスポートをご利用ください。</Text>
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
    marginBottom: 12,
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
});

export default AchievementSheet;
