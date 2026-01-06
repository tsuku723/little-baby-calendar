import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { useActiveUser } from "@/state/AppStateContext";
import { SaveAchievementPayload, useAchievements } from "@/state/AchievementsContext";
import { useDateViewContext } from "@/state/DateViewContext";
import { clampComment, remainingChars } from "@/utils/text";
import { normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";
import { deleteIfExistsAsync, ensureFileExistsAsync, pickAndSavePhotoAsync } from "@/utils/photo";
import { RECORD_TITLE_CANDIDATES } from "./recordTitleCandidates";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RecordInput">;

const RecordInputScreen: React.FC<Props> = ({ navigation, route }) => {
  const user = useActiveUser();
  const { store, upsert, remove } = useAchievements();
  const { selectedDate, today } = useDateViewContext();

  const recordId = route.params?.recordId;
  const preferredDate = route.params?.isoDate;
  const from = route.params?.from;

  // 邱ｨ髮・ｯｾ雎｡縺ｮ繝ｬ繧ｳ繝ｼ繝峨ｒ store 縺九ｉ讀懃ｴ｢・・soDate 縺後≠繧後・蜆ｪ蜈医＠縺ｦ邨槭ｊ霎ｼ繧・・  const editingRecord = useMemo(() => {
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
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(editingRecord?.title ?? "");
  const [content, setContent] = useState<string>(editingRecord?.memo ?? "");
  const [photoPath, setPhotoPath] = useState<string | null>(editingRecord?.photoPath ?? null);
  const [hasRemovedPhoto, setHasRemovedPhoto] = useState<boolean>(false);
  const [isTitleSheetVisible, setTitleSheetVisible] = useState(false);



  // 邱ｨ髮・ｯｾ雎｡縺悟､峨ｏ縺｣縺溘ｉ繝輔か繝ｼ繝繧呈怙譁ｰ縺ｮ蛟､縺ｫ蜷医ｏ縺帙ｋ
  useEffect(() => {
    if (editingRecord) {
      setDateInput(editingRecord.date);
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

  // 邱ｨ髮・ｯｾ雎｡縺ｮ photoPath 縺悟ｮ溘ヵ繧｡繧､繝ｫ縺ｨ縺励※蟄伜惠縺吶ｋ縺九ｒ遒ｺ隱阪☆繧・  useEffect(() => {
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

  // 繝懊ヨ繝繧ｷ繝ｼ繝医ｒ髢九￥繧ｿ繧､繝溘Φ繧ｰ縺ｧ繝輔Λ繧ｰ繧堤ｫ九※繧・  const openTitleSheet = () => {
    setTitleSheetVisible(true);
  };

  const closeTitleSheet = () => setTitleSheetVisible(false);

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
    setShowPicker(false);
  };


  // 蛟呵｣憺∈謚樊凾縺ｮ繝上Φ繝峨Μ繝ｳ繧ｰ
  const handleSelectCandidate = (candidate: string) => {
    setTitle(candidate);
    setTitleSheetVisible(false);
  };

  const handlePickPhoto = async () => {
    const previousTempPhoto = photoPath && photoPath !== editingRecord?.photoPath ? photoPath : null;
    try {
      const next = await pickAndSavePhotoAsync();
      if (!next) return;

      if (previousTempPhoto && previousTempPhoto !== next) {
        // 邱ｨ髮・判髱｢縺ｧ驕ｸ縺ｳ逶ｴ縺励◆譛ｪ菫晏ｭ倥・蜀咏悄縺ｯ荳崎ｦ√↓縺ｪ繧九◆繧√け繝ｪ繝ｼ繝ｳ繧｢繝・・縺吶ｋ
        await deleteIfExistsAsync(previousTempPhoto);
      }

      setPhotoPath(next);
      setHasRemovedPhoto(false);
    } catch (error) {
      console.error("Failed to pick photo", error);
      Alert.alert("蜀咏悄縺ｮ霑ｽ蜉縺ｫ螟ｱ謨励＠縺ｾ縺励◆", "蜀榊ｺｦ縺願ｩｦ縺励￥縺縺輔＞縲・);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (photoPath && photoPath !== editingRecord?.photoPath) {
        // 菫晏ｭ伜燕縺ｫ霑ｽ蜉縺励◆蜀咏悄縺ｯ縺薙％縺ｧ遐ｴ譽・☆繧・        await deleteIfExistsAsync(photoPath);
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
      Alert.alert("繝励Ο繝輔ぅ繝ｼ繝ｫ譛ｪ險ｭ螳・, "繝励Ο繝輔ぅ繝ｼ繝ｫ繧剃ｽ懈・縺励※縺九ｉ險倬鹸縺励※縺上□縺輔＞縲・);
      return;
    }

    // 譌･莉倥・ ISO 譁・ｭ怜・縺ｧ蜿励￠蜿悶ｊ縲∝ｿ・★ UTC 豁｣隕丞喧縺励※菫晏ｭ倥☆繧・    const normalizedDate = normalizeToUtcDate(dateInput);
    if (Number.isNaN(normalizedDate.getTime())) {
      Alert.alert("譌･莉倥ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞", "YYYY-MM-DD 蠖｢蠑上〒蜈･蜉帙＠縺ｦ縺上□縺輔＞縲・);
      return;
    }
    const isoDate = toIsoDateString(normalizedDate);

    const titleValue = title.trim() || content.trim();
    const photoPayload: string | null | undefined = (() => {
      if (hasRemovedPhoto && editingRecord?.photoPath && !photoPath) return null; // 譌｢蟄伜・逵溘・蜑企勁
      if (photoPath && photoPath !== editingRecord?.photoPath) return photoPath; // 譁ｰ隕上・蟾ｮ縺玲崛縺・      if (!editingRecord && photoPath) return photoPath; // 譁ｰ隕上Ξ繧ｳ繝ｼ繝峨〒蜀咏悄縺ゅｊ
      return undefined; // 螟画峩縺ｪ縺・    })();
    const payload: SaveAchievementPayload = {
      id: editingRecord?.id,
      date: isoDate,
      title: titleValue,
      memo: content,
      photoPath: photoPayload,
    };

    try {
      await upsert(payload);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save record", error);
      Alert.alert("菫晏ｭ倥↓螟ｱ謨励＠縺ｾ縺励◆", "譎る俣繧偵♀縺・※蜀榊ｺｦ縺願ｩｦ縺励￥縺縺輔＞縲・);
    }
  };

  // 蜑企勁遒ｺ隱阪ム繧､繧｢繝ｭ繧ｰ繧定｡ｨ遉ｺ縺吶ｋ・・eb 縺ｯ window.confirm 繧剃ｽｿ逕ｨ・・  const confirmDelete = () => {
    if (!editingRecord) return;

    if (Platform.OS === "web") {
      const ok = window.confirm("縺薙・險倬鹸繧貞炎髯､縺励∪縺吶ゅｈ繧阪＠縺・〒縺吶°・・);
      if (!ok) return;
      const targetStack = from === "list" ? "RecordListStack" : "CalendarStack";
      navigation.replace("MainTabs", { screen: targetStack });
      remove(editingRecord.id, editingRecord.date).catch((error) => {
        console.error("Failed to delete record", error);
        window.alert("蜑企勁縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲よ凾髢薙ｒ縺翫＞縺ｦ蜀榊ｺｦ縺願ｩｦ縺励￥縺縺輔＞縲・);
      });
      return;
    }

    Alert.alert("蜑企勁縺励∪縺吶°・・, "縺薙・險倬鹸繧貞炎髯､縺励∪縺吶ゅｈ繧阪＠縺・〒縺吶°・・, [
      { text: "繧ｭ繝｣繝ｳ繧ｻ繝ｫ", style: "cancel" },
      {
        text: "蜑企勁",
        style: "destructive",
        onPress: async () => {
          const targetStack = from === "list" ? "RecordListStack" : "CalendarStack";
          navigation.replace("MainTabs", { screen: targetStack });
          try {
            await remove(editingRecord.id, editingRecord.date);
          } catch (error) {
            console.error("Failed to delete record", error);
            Alert.alert("蜑企勁縺ｫ螟ｱ謨励＠縺ｾ縺励◆", "譎る俣繧偵♀縺・※蜀榊ｺｦ縺願ｩｦ縺励￥縺縺輔＞縲・);
          }
        },
      },
    ]);
  };

  if (!user) {
    // 繝励Ο繝輔ぅ繝ｼ繝ｫ縺檎┌縺・ｴ蜷医・譯亥・縺ｮ縺ｿ陦ｨ遉ｺ縺励※謌ｻ繧・    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>繝励Ο繝輔ぅ繝ｼ繝ｫ繧剃ｽ懈・縺励※縺上□縺輔＞</Text>
          <Text style={styles.note}>險倬鹸繧剃ｿ晏ｭ倥☆繧九↓縺ｯ繝励Ο繝輔ぅ繝ｼ繝ｫ縺悟ｿ・ｦ√〒縺吶・/Text>
          <Button title="謌ｻ繧・ onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{editingRecord ? "險倬鹸繧堤ｷｨ髮・ : "險倬鹸蜈･蜉・}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>繧ｿ繧､繝医Ν</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(text) => setTitle(text.slice(0, 80))}
            placeholder="遏ｭ縺・ち繧､繝医Ν・井ｻｻ諢擾ｼ・
            accessibilityLabel="繧ｿ繧､繝医Ν"
          />
          <TouchableOpacity style={styles.titleSuggestionButton} onPress={openTitleSheet} accessibilityRole="button">
            <Text style={styles.titleSuggestionText}>蛟呵｣懊°繧蛾∈縺ｶ・井ｻｻ諢擾ｼ・/Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowPicker((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="譌･莉倥ｒ驕ｸ謚・
          >
            <Text style={styles.dateRowLabel}>譌･莉・/Text>
            <Text style={styles.dateRowValue}>{dateInput} 笆ｼ</Text>
          </TouchableOpacity>
          {showPicker ? (
            <View style={styles.datePickerArea}>
              <TouchableOpacity
                style={styles.todayResetButton}
                onPress={() => {
                  setDateInput(todayIso);
                  setShowPicker(false);
                }}
              >
                <Text style={styles.todayResetText}>莉頑律縺ｫ謌ｻ縺・/Text>
              </TouchableOpacity>
              <DateTimePicker
                value={currentDateForPicker}
                mode="date"
                display="inline"
                locale="ja-JP"
                maximumDate={today}
                onChange={handleDateChange}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>蜀・ｮｹ</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={content}
            onChangeText={(text) => setContent(clampComment(text))}
            placeholder="莉頑律縺ｮ謌宣聞繧・大ｼｵ繧翫ｒ譖ｸ縺肴ｮ九＠縺ｾ縺励ｇ縺・ｼ域怙螟ｧ500譁・ｭ暦ｼ・
            accessibilityLabel="蜀・ｮｹ"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.helper}>谿九ｊ {charsLeft} / 500</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>蜀咏悄・井ｻｻ諢擾ｼ・/Text>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} accessibilityRole="button">
              <Text style={styles.photoButtonText}>{photoPath ? "蜀咏悄繧貞ｷｮ縺玲崛縺医ｋ" : "蜀咏悄繧定ｿｽ蜉"}</Text>
            </TouchableOpacity>
            {photoPath ? (
              <TouchableOpacity style={styles.photoRemoveButton} onPress={handleRemovePhoto} accessibilityRole="button">
                <Text style={styles.photoRemoveText}>蜀咏悄繧貞､悶☆</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {photoPath ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoPath }} style={styles.photoPreview} resizeMode="cover" />
              <Text style={styles.helper}>菫晏ｭ俶凾縺ｫ縺薙・蜀咏悄繧定ｨ倬鹸縺ｸ邏蝉ｻ倥￠縺ｾ縺吶・/Text>
            </View>
          ) : (
            <Text style={styles.helper}>蜀咏悄縺ｯ繧｢繝励Μ蜀・↓ JPEG 蠖｢蠑上〒菫晏ｭ倥＆繧後∪縺吶・/Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button title="繧ｭ繝｣繝ｳ繧ｻ繝ｫ" color=COLORS.textSecondary onPress={() => navigation.goBack()} />
          <Button title="菫晏ｭ・ color=COLORS.accentMain onPress={handleSave} />
        </View>

      {editingRecord ? (
          <View style={styles.deleteArea}>
            <Button title="縺薙・險倬鹸繧貞炎髯､" color=COLORS.sunday onPress={confirmDelete} />
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
          <Text style={styles.sheetTitle}>繧ｿ繧､繝医Ν蛟呵｣・/Text>

          <ScrollView contentContainerStyle={styles.sheetList} keyboardShouldPersistTaps="handled">
            {RECORD_TITLE_CANDIDATES.map((candidate) => (
              <TouchableOpacity
                key={candidate}
                style={styles.candidateItem}
                onPress={() => handleSelectCandidate(candidate)}
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
  },
  note: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  helper: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.highlightToday,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoButtonText: {
    color: COLORS.saturday,
    fontWeight: "700",
  },
  photoRemoveButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  photoRemoveText: {
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.cellDimmed,
  },
  titleSuggestionButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  titleSuggestionText: {
    fontSize: 13,
    color: COLORS.accentMain,
    textDecorationLine: "underline",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.surface,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dateRow: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRowLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  dateRowValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  datePickerArea: {
    gap: 8,
  },
  textarea: {
    minHeight: 140,
  },
  todayResetButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.highlightToday,
  },
  todayResetText: {
    color: COLORS.accentMain,
    fontWeight: "700",
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  candidateText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
});

export default RecordInputScreen;

