import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { AchievementType } from "@/models/dataModels";
import { useActiveUser } from "@/state/AppStateContext";
import { SaveAchievementPayload, useAchievements } from "@/state/AchievementsContext";
import { clampComment, remainingChars } from "@/utils/text";
import { normalizeToUtcDate, toIsoDateString, todayIsoDate } from "@/utils/dateUtils";
import { RECORD_TITLE_CANDIDATES, RecordType } from "./recordTitleCandidates";

type Props = NativeStackScreenProps<RootStackParamList, "RecordInput">;

const TYPE_OPTIONS: { value: RecordType; label: string; description: string }[] = [
  { value: "growth", label: "成長", description: "できた・成長記録" },
  { value: "effort", label: "頑張った", description: "頑張った記録" },
];

const toRecordType = (t: AchievementType): RecordType => (t === "tried" ? "effort" : "growth");
const toAchievementType = (t: RecordType): AchievementType => (t === "effort" ? "tried" : "did");

const RecordInputScreen: React.FC<Props> = ({ navigation, route }) => {
  const user = useActiveUser();
  const { store, upsert, remove } = useAchievements();

  const recordId = route.params?.recordId;
  const preferredDate = route.params?.isoDate;

  // 編集対象のレコードを store から検索（isoDate があれば優先して絞り込む）
  const editingRecord = useMemo(() => {
    if (!recordId) return null;
    if (preferredDate && store[preferredDate]) {
      return store[preferredDate].find((item) => item.id === recordId) ?? null;
    }
    const all = Object.values(store).flat();
    return all.find((item) => item.id === recordId) ?? null;
  }, [preferredDate, recordId, store]);

  const [dateInput, setDateInput] = useState<string>(preferredDate ?? todayIsoDate());
  const [recordType, setRecordType] = useState<RecordType>(() =>
    editingRecord ? toRecordType(editingRecord.type) : "growth"
  );
  const [title, setTitle] = useState<string>(editingRecord?.title ?? "");
  const [content, setContent] = useState<string>(editingRecord?.memo ?? "");
  const [isTitleSheetVisible, setTitleSheetVisible] = useState(false);
  const [titleCandidateTab, setTitleCandidateTab] = useState<RecordType>(() =>
    editingRecord ? toRecordType(editingRecord.type) : "growth"
  );

  // 編集対象が変わったらフォームを最新の値に合わせる
  useEffect(() => {
    if (editingRecord) {
      setDateInput(editingRecord.date);
      setRecordType(toRecordType(editingRecord.type));
      setTitle(editingRecord.title ?? "");
      setContent(editingRecord.memo ?? "");
    } else if (preferredDate) {
      setDateInput(preferredDate);
      setTitle("");
      setContent("");
    }
  }, [editingRecord, preferredDate]);

  // ボトムシートを開くタイミングで、現在の種別に合わせてタブを初期化する
  const openTitleSheet = () => {
    setTitleCandidateTab(recordType);
    setTitleSheetVisible(true);
  };

  const closeTitleSheet = () => setTitleSheetVisible(false);

  // 候補選択時のハンドリング（種別の自動切り替えは growth → effort のみ）
  const handleSelectCandidate = (candidate: string, candidateType: RecordType) => {
    setTitle(candidate);
    if (recordType === "growth" && candidateType === "effort") {
      setRecordType("effort");
    }
    setTitleSheetVisible(false);
  };

  const charsLeft = useMemo(() => remainingChars(content), [content]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("プロフィール未設定", "プロフィールを作成してから記録してください。");
      return;
    }

    // 日付は ISO 文字列で受け取り、必ず UTC 正規化して保存する
    const normalizedDate = normalizeToUtcDate(dateInput);
    if (Number.isNaN(normalizedDate.getTime())) {
      Alert.alert("日付を確認してください", "YYYY-MM-DD 形式で入力してください。");
      return;
    }
    const isoDate = toIsoDateString(normalizedDate);

    const achievementType = toAchievementType(recordType);
    const titleValue = title.trim() || content.trim();
    const payload: SaveAchievementPayload = {
      id: editingRecord?.id,
      date: isoDate,
      type: achievementType,
      title: titleValue,
      memo: content,
      // TODO (Phase 4): メモや写真など詳細入力を追加する場合はここで拡張する
    };

    try {
      await upsert(payload);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save record", error);
      Alert.alert("保存に失敗しました", "時間をおいて再度お試しください。");
    }
  };

  // 削除確認ダイアログを表示する（Web は window.confirm を使用）
  const confirmDelete = () => {
    if (!editingRecord) return;

    if (Platform.OS === "web") {
      const ok = window.confirm("この記録を削除します。よろしいですか？");
      if (!ok) return;
      remove(editingRecord.id, editingRecord.date)
        .then(() => {
          navigation.goBack();
        })
        .catch((error) => {
          console.error("Failed to delete record", error);
          window.alert("削除に失敗しました。時間をおいて再度お試しください。");
        });
      return;
    }

    Alert.alert("削除しますか？", "この記録を削除します。よろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(editingRecord.id, editingRecord.date);
            navigation.goBack();
          } catch (error) {
            console.error("Failed to delete record", error);
            Alert.alert("削除に失敗しました", "時間をおいて再度お試しください。");
          }
        },
      },
    ]);
  };

  if (!user) {
    // プロフィールが無い場合は案内のみ表示して戻る
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>プロフィールを作成してください</Text>
          <Text style={styles.note}>記録を保存するにはプロフィールが必要です。</Text>
          <Button title="戻る" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{editingRecord ? "記録を編集" : "記録入力"}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>タイトル</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(text) => setTitle(text.slice(0, 80))}
            placeholder="短いタイトル（任意）"
            accessibilityLabel="タイトル"
          />
          <TouchableOpacity style={styles.titleSuggestionButton} onPress={openTitleSheet} accessibilityRole="button">
            <Text style={styles.titleSuggestionText}>候補から選ぶ（任意）</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>日付</Text>
          {/* 外部ライブラリを増やさず、ISO 文字列入力で簡易 DatePicker としている */}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={dateInput}
              onChangeText={(text) => setDateInput(text.trim().slice(0, 10))}
              placeholder="YYYY-MM-DD"
              accessibilityLabel="日付"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <TouchableOpacity style={styles.todayButton} onPress={() => setDateInput(todayIsoDate())}>
              <Text style={styles.todayText}>今日</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helper}>YYYY-MM-DD 形式で入力してください。</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>種別</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.typeChip, recordType === option.value && styles.typeChipActive]}
                onPress={() => setRecordType(option.value)}
                accessibilityRole="button"
              >
                <Text style={[styles.typeLabel, recordType === option.value && styles.typeLabelActive]}>{option.label}</Text>
                <Text style={[styles.typeDescription, recordType === option.value && styles.typeLabelActive]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>内容</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={content}
            onChangeText={(text) => setContent(clampComment(text))}
            placeholder="今日の成長や頑張りを書き残しましょう（最大500文字）"
            accessibilityLabel="内容"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.helper}>残り {charsLeft} / 500</Text>
        </View>

        <View style={styles.actions}>
          <Button title="キャンセル" color="#6B665E" onPress={() => navigation.goBack()} />
          <Button title="保存" color="#3A86FF" onPress={handleSave} />
        </View>

        {editingRecord ? (
          <View style={styles.deleteArea}>
            <Button title="この記録を削除" color="#D9534F" onPress={confirmDelete} />
          </View>
        ) : null}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isTitleSheetVisible}
        onRequestClose={closeTitleSheet}
        statusBarTranslucent
      >
        <Pressable style={styles.sheetOverlay} onPress={closeTitleSheet} accessibilityRole="button" />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>タイトル候補</Text>
          <View style={styles.sheetTabs}>
            {TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sheetTab, titleCandidateTab === option.value && styles.sheetTabActive]}
                onPress={() => setTitleCandidateTab(option.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: titleCandidateTab === option.value }}
              >
                <Text style={[styles.sheetTabLabel, titleCandidateTab === option.value && styles.sheetTabLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.sheetList} keyboardShouldPersistTaps="handled">
            {RECORD_TITLE_CANDIDATES[titleCandidateTab].map((candidate) => (
              <TouchableOpacity
                key={candidate}
                style={styles.candidateItem}
                onPress={() => handleSelectCandidate(candidate, titleCandidateTab)}
                accessibilityRole="button"
              >
                <Text style={styles.candidateText}>{candidate}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E2A27",
  },
  note: {
    fontSize: 14,
    color: "#6B665E",
    textAlign: "center",
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    color: "#2E2A27",
    fontWeight: "600",
  },
  helper: {
    fontSize: 12,
    color: "#6B665E",
  },
  titleSuggestionButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  titleSuggestionText: {
    fontSize: 13,
    color: "#3A86FF",
    textDecorationLine: "underline",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D7D3CC",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#2E2A27",
  },
  textarea: {
    minHeight: 140,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  flex1: {
    flex: 1,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E9F2FF",
  },
  todayText: {
    color: "#3A86FF",
    fontWeight: "700",
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeChip: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D3CC",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  typeChipActive: {
    borderColor: "#3A86FF",
    backgroundColor: "#E9F2FF",
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2A27",
  },
  typeLabelActive: {
    color: "#1D5BBF",
  },
  typeDescription: {
    fontSize: 12,
    color: "#6B665E",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  deleteArea: {
    marginTop: 8,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E1DA",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2A27",
    marginBottom: 12,
  },
  sheetTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sheetTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D3CC",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  sheetTabActive: {
    borderColor: "#3A86FF",
    backgroundColor: "#E9F2FF",
  },
  sheetTabLabel: {
    fontSize: 14,
    color: "#2E2A27",
    fontWeight: "600",
  },
  sheetTabLabelActive: {
    color: "#1D5BBF",
  },
  sheetList: {
    paddingBottom: 12,
    gap: 10,
  },
  candidateItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    backgroundColor: "#FAF8F4",
  },
  candidateText: {
    fontSize: 15,
    color: "#2E2A27",
  },
});

export default RecordInputScreen;
