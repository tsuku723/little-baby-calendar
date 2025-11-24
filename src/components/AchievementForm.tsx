import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Image, StyleSheet, Text, TextInput, View } from "react-native";

import * as ImagePicker from "expo-image-picker";

import { useAchievements } from "@/state/AchievementsContext";
import { Achievement, AchievementType } from "@/types/models";
import { clampComment, remainingChars } from "@/utils/text";

interface Props {
  isoDay: string;
  draft?: Achievement | null;
  onClose: () => void;
}

const TYPES: AchievementType[] = ["できた", "がんばった"];

const AchievementForm: React.FC<Props> = ({ isoDay, draft, onClose }) => {
  const { upsert, remove } = useAchievements();
  const [type, setType] = useState<AchievementType>(draft?.type ?? "できた");
  const [comment, setComment] = useState<string>(draft?.comment ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(draft?.photoUri ?? null);
  const [dirty, setDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setType(draft?.type ?? "できた");
    setComment(draft?.comment ?? "");
    setPhotoUri(draft?.photoUri ?? null);
    setDirty(false);
  }, [draft]);

  const charsLeft = useMemo(() => remainingChars(comment), [comment]);

  const flushSave = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await upsert({ id: draft?.id, date: isoDay, type, comment, photoUri });
    setDirty(false);
  };

  useEffect(() => {
    if (!dirty) {
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void flushSave();
    }, 2000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment, type, photoUri, isoDay]);

  const handleSubmit = async () => {
    await flushSave();
    onClose();
  };

  const handleDelete = async () => {
    if (draft?.id) {
      await remove(draft.id, isoDay);
    }
    onClose();
  };

  const pickPhoto = async () => {
  // 1. 権限確認
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    // 必要ならアラート表示などを入れてもよい
    return;
  }

  // 2. 画像選択ダイアログを表示
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8, // 写真の画質（0〜1）
  });

  // 3. キャンセルなら何もしない
  if (result.canceled) {
    return;
  }

  // 4. 選択された画像の URI を state に反映
  const asset = result.assets[0];
  if (asset?.uri) {
    setPhotoUri(asset.uri);
    setDirty(true);
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        {TYPES.map((value) => (
          <Button
            key={value}
            title={value}
            color={type === value ? "#3A86FF" : "#BABABA"}
            onPress={() => {
              setType(value);
              setDirty(true);
            }}
          />
        ))}
      </View>
      <View style={styles.commentWrapper}>
        <TextInput
          style={styles.comment}
          value={comment}
          onChangeText={(text) => {
            setComment(clampComment(text));
            setDirty(true);
          }}
          placeholder="今日のがんばりや、うれしかったことを記録しましょう"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.remaining}>残り {charsLeft} / 500</Text>
      </View>
      <View style={styles.photoRow}>
        <Button title={photoUri ? "写真を変更" : "写真を追加"} onPress={pickPhoto} color="#3A86FF" />
        {photoUri ? (
          <Button
            title="写真を外す"
            onPress={() => {
              setPhotoUri(null);
              setDirty(true);
            }}
            color="#BABABA"
          />
        ) : null}
      </View>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
      <View style={styles.actions}>
        {draft?.id ? <Button title="この記録を削除" color="#D9534F" onPress={handleDelete} /> : null}
        <Button title="保存して閉じる" onPress={handleSubmit} color="#3A86FF" />
      </View>
      <Text style={styles.note}>入力後2秒で自動保存されます。ゆっくり書いても大丈夫です。</Text>
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
  commentWrapper: {
    gap: 8,
  },
  comment: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D3CC",
    padding: 12,
    minHeight: 120,
    fontSize: 16,
    lineHeight: 22,
    color: "#2E2A27",
  },
  remaining: {
    alignSelf: "flex-end",
    fontSize: 14,
    color: "#2E2A27",
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  preview: {
    height: 180,
    borderRadius: 12,
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
