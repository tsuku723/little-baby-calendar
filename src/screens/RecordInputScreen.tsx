import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { AchievementType } from "@/models/dataModels";
import { useActiveUser } from "@/state/AppStateContext";
import { SaveAchievementPayload, useAchievements } from "@/state/AchievementsContext";
import { useDateViewContext } from "@/state/DateViewContext";
import { clampComment, remainingChars } from "@/utils/text";
import { normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";
import { deleteIfExistsAsync, ensureFileExistsAsync, pickAndSavePhotoAsync } from "@/utils/photo";
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
  const { selectedDate, today } = useDateViewContext();

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

  const selectedDateIso = useMemo(() => toIsoDateString(selectedDate), [selectedDate]);
  const todayIso = useMemo(() => toIsoDateString(today), [today]);
  const [dateInput, setDateInput] = useState<string>(preferredDate ?? selectedDateIso);
  const [isDatePickerVisible, setDatePickerVisible] = useState<boolean>(false);
  const [recordType, setRecordType] = useState<RecordType>(() =>
    editingRecord ? toRecordType(editingRecord.type) : "growth"
  );
  const [title, setTitle] = useState<string>(editingRecord?.title ?? "");
  const [content, setContent] = useState<string>(editingRecord?.memo ?? "");
  const [photoPath, setPhotoPath] = useState<string | null>(editingRecord?.photoPath ?? null);
  const [hasRemovedPhoto, setHasRemovedPhoto] = useState<boolean>(false);
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
      setPhotoPath(editingRecord.photoPath ?? null);
      setHasRemovedPhoto(false);
    } else if (preferredDate) {
      setDateInput(preferredDate);
      setTitle("");
      setContent("");
      setPhotoPath(null);
      setHasRemovedPhoto(false);
    } else {
      setDateInput(selectedDateIso);
    }
  }, [editingRecord, preferredDate, selectedDateIso]);

  // 編集対象の photoPath が実ファイルとして存在するかを確認する
  useEffect(() => {
    let mounted = true;
    const verifyPhoto = async () => {
      const ensured = await ensureFileExistsAsync(editingRecord?.photoPath ?? null);
      if (!mounted) return;
      setPhotoPath(ensured);
      setHasRemovedPhoto(!ensured && Boolean(editingRecord?.photoPath));
    };
    void verifyPhoto();
    return () => {
      mounted = false;
    };
  }, [editingRecord?.photoPath]);

  // ボトムシートを開くタイミングで、現在の種別に合わせてタブを初期化する
  const openTitleSheet = () => {
    setTitleCandidateTab(recordType);
    setTitleSheetVisible(true);
  };

  const closeTitleSheet = () => setTitleSheetVisible(false);

  const handleOpenDatePicker = () => setDatePickerVisible(true);

  const currentDateForPicker = useMemo(() => {
    const normalized = normalizeToUtcDate(dateInput);
    if (Number.isNaN(normalized.getTime())) {
      return selectedDate;
    }
    return normalized;
  }, [dateInput, selectedDate]);

    const handleDateChange = (_: DateTimePickerEvent, pickedDate?: Date) => {
  if (!pickedDate) return;
  setDateInput(toIsoDateString(pickedDate));
};


  // 候補選択時のハンドリング（種別の自動切り替えは growth → effort のみ）
  const handleSelectCandidate = (candidate: string, candidateType: RecordType) => {
    setTitle(candidate);
    if (recordType === "growth" && candidateType === "effort") {
      setRecordType("effort");
    }
    setTitleSheetVisible(false);
  };

  const handlePickPhoto = async () => {
    const previousTempPhoto = photoPath && photoPath !== editingRecord?.photoPath ? photoPath : null;
    try {
      const next = await pickAndSavePhotoAsync();
      if (!next) return;

      if (previousTempPhoto && previousTempPhoto !== next) {
        // 編集画面で選び直した未保存の写真は不要になるためクリーンアップする
        await deleteIfExistsAsync(previousTempPhoto);
      }

      setPhotoPath(next);
      setHasRemovedPhoto(false);
    } catch (error) {
      console.error("Failed to pick photo", error);
      Alert.alert("写真の追加に失敗しました", "再度お試しください。");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (photoPath && photoPath !== editingRecord?.photoPath) {
        // 保存前に追加した写真はここで破棄する
        await deleteIfExistsAsync(photoPath);
      }
    } catch (error) {
      console.warn("Failed to delete temp photo", error);
    }
    setPhotoPath(null);
    setHasRemovedPhoto(Boolean(editingRecord?.photoPath));
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
    const photoPayload: string | null | undefined = (() => {
      if (hasRemovedPhoto && editingRecord?.photoPath && !photoPath) return null; // 既存写真の削除
      if (photoPath && photoPath !== editingRecord?.photoPath) return photoPath; // 新規・差し替え
      if (!editingRecord && photoPath) return photoPath; // 新規レコードで写真あり
      return undefined; // 変更なし
    })();
    const payload: SaveAchievementPayload = {
      id: editingRecord?.id,
      date: isoDate,
      type: achievementType,
      title: titleValue,
      memo: content,
      photoPath: photoPayload,
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
          <View style={styles.row}>
            <Pressable
              style={[styles.input, styles.flex1, styles.dateInputButton]}
              onPress={handleOpenDatePicker}
              accessibilityRole="button"
              accessibilityLabel="日付を選択"
            >
              <Text style={styles.dateInputText}>{dateInput}</Text>
              <Text style={styles.dateInputHint}>タップして日付を選択</Text>
            </Pressable>
            <TouchableOpacity style={styles.todayButton} onPress={() => setDateInput(todayIso)}>
              <Text style={styles.todayText}>今日</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helper}>DatePicker で日付を選択してください。</Text>
          {isDatePickerVisible && (
  <Modal transparent animationType="slide">
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        {/* ヘッダー */}
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
            <Text style={styles.pickerCancel}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
            <Text style={styles.pickerDone}>完了</Text>
          </TouchableOpacity>
        </View>

        {/* iOS inline DatePicker */}
        <DateTimePicker
          value={currentDateForPicker}
          mode="date"
          display="inline"
          locale="ja-JP"
          maximumDate={today}
          onChange={handleDateChange}
          style={{ height: 320 }}
        />
      </View>
    </View>
  </Modal>
)}

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

        <View style={styles.field}>
          <Text style={styles.label}>写真（任意）</Text>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} accessibilityRole="button">
              <Text style={styles.photoButtonText}>{photoPath ? "写真を差し替える" : "写真を追加"}</Text>
            </TouchableOpacity>
            {photoPath ? (
              <TouchableOpacity style={styles.photoRemoveButton} onPress={handleRemovePhoto} accessibilityRole="button">
                <Text style={styles.photoRemoveText}>写真を外す</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {photoPath ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoPath }} style={styles.photoPreview} resizeMode="cover" />
              <Text style={styles.helper}>保存時にこの写真を記録へ紐付けます。</Text>
            </View>
          ) : (
            <Text style={styles.helper}>写真はアプリ内に JPEG 形式で保存されます。</Text>
          )}
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

  <Pressable
  style={[styles.input, styles.flex1, styles.dateInputButton]}
  onPress={() => setDatePickerVisible(true)}
  accessibilityRole="button"
>
  <Text style={styles.dateInputText}>{dateInput}</Text>
  <Text style={styles.dateInputHint}>タップして日付を選択</Text>
</Pressable>



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
  photoActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  photoButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E9F2FF",
    borderWidth: 1,
    borderColor: "#B8D0FF",
  },
  photoButtonText: {
    color: "#1D5BBF",
    fontWeight: "700",
  },
  photoRemoveButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    backgroundColor: "#FAF8F4",
  },
  photoRemoveText: {
    color: "#8A8277",
    fontWeight: "600",
  },
  photoPreviewWrapper: {
    marginTop: 10,
    gap: 6,
  },
  photoPreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#F1EEE8",
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
  dateInputButton: {
    gap: 4,
  },
  dateInputText: {
    fontSize: 16,
    color: "#2E2A27",
    fontWeight: "700",
  },
  dateInputHint: {
    fontSize: 12,
    color: "#6B665E",
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
  pickerOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.3)",
  justifyContent: "flex-end",
},
pickerContainer: {
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingBottom: 24,
},
pickerHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  padding: 16,
},
pickerCancel: {
  fontSize: 16,
  color: "#6B665E",
},
pickerDone: {
  fontSize: 16,
  fontWeight: "700",
  color: "#3A86FF",
},

  
});

export default RecordInputScreen;
