import React, { useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import { SaveAchievementPayload, useAchievements } from "@/state/AchievementsContext";
import { Achievement } from "@/models/dataModels";
import { clampComment, remainingChars } from "@/utils/text";
import { COLORS } from "@/constants/colors";

interface Props {
  isoDay: string;
  draft?: Achievement | null;
  onClose: () => void;
}

const AchievementForm: React.FC<Props> = ({ isoDay, draft, onClose }) => {
  const { upsert, remove } = useAchievements();
  const [title, setTitle] = useState<string>(draft?.title ?? "");
  const [memo, setMemo] = useState<string>(draft?.memo ?? "");

  useEffect(() => {
    // 編集対象が変わったらフォーム初期化
    setTitle(draft?.title ?? "");
    setMemo(draft?.memo ?? "");
  }, [draft]);

  const charsLeft = useMemo(() => remainingChars(memo), [memo]);

  const handleSubmit = async () => {
    const payload: SaveAchievementPayload = {
      id: draft?.id,
      date: isoDay,
      title: title.trim(),
      memo,
    };
    try {
      await upsert(payload);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      alert("保存中にエラーが発生しました。もう一度お試しください。");
    }
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
        {draft?.id ? <Button title="この記録を削除" color={COLORS.sunday} onPress={handleDelete} /> : null}
        <Button title="保存して閉じる" onPress={handleSubmit} color={COLORS.accentMain} />
      </View>
      <Text style={styles.note}>保存するとカレンダーの該当日に●が付きます。</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  memo: {
    minHeight: 120,
  },
  remaining: {
    alignSelf: "flex-end",
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  actions: {
    gap: 12,
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default AchievementForm;
