import React, { useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import { SaveAchievementPayload, useAchievements } from "@/state/AchievementsContext";
import { Achievement, AchievementType } from "@/models/dataModels";
import { clampComment, remainingChars } from "@/utils/text";

interface Props {
  isoDay: string;
  draft?: Achievement | null;
  onClose: () => void;
}

const TYPES: { value: AchievementType; label: string }[] = [
  { value: "did", label: "できた" },
  { value: "tried", label: "頑張った" },
];

const AchievementForm: React.FC<Props> = ({ isoDay, draft, onClose }) => {
  const { upsert, remove } = useAchievements();
  const [type, setType] = useState<AchievementType>(draft?.type ?? "did");
  const [title, setTitle] = useState<string>(draft?.title ?? "");
  const [memo, setMemo] = useState<string>(draft?.memo ?? "");

  useEffect(() => {
    // 編集対象が変わったらフォーム初期化
    setType(draft?.type ?? "did");
    setTitle(draft?.title ?? "");
    setMemo(draft?.memo ?? "");
  }, [draft]);

  const charsLeft = useMemo(() => remainingChars(memo), [memo]);

  const handleSubmit = async () => {
    // 入力を保存（新規/更新）
    const payload: SaveAchievementPayload = { id: draft?.id, date: isoDay, type, title: title.trim(), memo };
    await upsert(payload);
    onClose();
  };

  const handleDelete = async () => {
    // 記録削除
    if (draft?.id) {
      await remove(draft.id, isoDay);
    }
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        {TYPES.map(({ value, label }) => (
          <Button key={value} title={label} color={type === value ? "#3A86FF" : "#BABABA"} onPress={() => setType(value)} />
        ))}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>タイトル</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="短くわかりやすく"
          accessibilityLabel="タイトル"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>メモ（任意）</Text>
        <TextInput
          style={[styles.input, styles.memo]}
          value={memo}
          onChangeText={(text) => setMemo(clampComment(text))}
          placeholder="詳細や気づきを記録"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel="メモ"
        />
        <Text style={styles.remaining}>残り {charsLeft} / 500</Text>
      </View>
      <View style={styles.actions}>
        {draft?.id ? <Button title="この記録を削除" color="#D9534F" onPress={handleDelete} /> : null}
        <Button title="保存して閉じる" onPress={handleSubmit} color="#3A86FF" />
      </View>
      <Text style={styles.note}>保存するとカレンダーの該当日に●が付きます。</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  segmented: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: "#2E2A27",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D3CC",
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#2E2A27",
    backgroundColor: "#FFFFFF",
  },
  memo: {
    minHeight: 120,
  },
  remaining: {
    alignSelf: "flex-end",
    fontSize: 14,
    color: "#2E2A27",
  },
  actions: {
    gap: 12,
  },
  note: {
    fontSize: 12,
    color: "#6B665E",
  },
});

export default AchievementForm;
