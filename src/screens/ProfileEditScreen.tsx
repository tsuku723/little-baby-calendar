import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { UserSettings } from "@/models/dataModels";
import { SettingsStackParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useAppState } from "@/state/AppStateContext";
import { isIsoDateString, safeParseIsoLocal, toIsoDateString } from "@/utils/dateUtils";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<SettingsStackParamList, "ProfileEdit">;

type FormState = {
  name: string;
  birthDate: string;
  dueDate: string;
};

const createEmptyForm = (): FormState => ({
  name: "",
  birthDate: toIsoDateString(new Date()),
  dueDate: "",
});

const ProfileEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { state, addUser, updateUser, deleteUser } = useAppState();
  const { users } = state;
  const profileId = route.params?.profileId;

  const existing = useMemo(() => users.find((u) => u.id === profileId), [users, profileId]);

  const [formState, setFormState] = useState<FormState>(() => {
    if (existing) {
      return {
        name: existing.name,
        birthDate: existing.birthDate,
        dueDate: existing.dueDate ?? "",
      };
    }
    return createEmptyForm();
  });

  const [draftSettings, setDraftSettings] = useState<UserSettings>(() => {
    if (existing) return { ...existing.settings };
    return {
      showCorrectedUntilMonths: 24,
      ageFormat: "md",
      showDaysSinceBirth: true,
      lastViewedMonth: null,
    };
  });

  const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const cloneDate = (d: Date) => new Date(d.getTime());
  const safeDate = (iso: string, fallback: Date) => {
    const parsed = safeParseIsoLocal(iso, fallback);
    if (!parsed || Number.isNaN(parsed.getTime())) return cloneDate(fallback);
    return cloneDate(parsed);
  };
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [activeDateField, setActiveDateField] = useState<"birth" | "due" | null>(null);
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState<Date>(() => safeDate(formState.birthDate, today));
  const [tempDueDate, setTempDueDate] = useState<Date>(() => safeDate(formState.dueDate, today));

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({ tabBarStyle: { display: "flex" } });
    };
  }, [navigation]);

  useEffect(() => {
    if (existing) {
      setFormState({
        name: existing.name,
        birthDate: existing.birthDate,
        dueDate: existing.dueDate ?? "",
      });
      setDraftSettings({ ...existing.settings });
    } else {
      setFormState(createEmptyForm());
      setDraftSettings({
        showCorrectedUntilMonths: 24,
        ageFormat: "md",
        showDaysSinceBirth: true,
        lastViewedMonth: null,
      });
    }
  }, [existing]);

  const isFormValid = useMemo(() => {
    const name = formState.name.trim();
    const birthDate = formState.birthDate.trim();
    return Boolean(name) && isIsoDateString(birthDate);
  }, [formState.birthDate, formState.name]);

  const handleSave = async () => {
    const name = formState.name.trim();
    const birthDate = formState.birthDate.trim();
    const dueDate = formState.dueDate.trim() || null;

    if (!name || !birthDate) {
      Alert.alert("入力エラー", "名前と生年月日は必須です。");
      return;
    }

    if (existing) {
      await updateUser(existing.id, {
        name,
        birthDate,
        dueDate,
        settings: draftSettings,
      });
    } else {
      await addUser({
        name,
        birthDate,
        dueDate,
        settings: draftSettings,
      });
    }

    navigation.popToTop();
  };

  const openDatePicker = (field: "birth" | "due") => {
    const open = () => {
      setActiveDateField(field);
      if (field === "birth") {
        setTempBirthDate(safeDate(formState.birthDate, today));
      } else {
        setTempDueDate(safeDate(formState.dueDate, today));
      }
      requestAnimationFrame(() => setDateModalVisible(true));
    };
    if (isDateModalVisible) {
      setDateModalVisible(false);
      requestAnimationFrame(open);
      return;
    }
    open();
  };

  const closeDatePicker = () => {
    setDateModalVisible(false);
    setActiveDateField(null);
  };

  const handleDateChange = (_: DateTimePickerEvent, pickedDate?: Date) => {
    if (!pickedDate || !activeDateField) return;
    const next = cloneDate(pickedDate);
    if (Number.isNaN(next.getTime())) return;
    if (activeDateField === "birth") {
      setTempBirthDate(next);
    } else {
      setTempDueDate(next);
    }
  };

  const pickerValue = useMemo(() => {
    const raw = activeDateField === "birth" ? tempBirthDate : tempDueDate;
    return raw && !Number.isNaN(raw.getTime()) ? raw : today;
  }, [activeDateField, tempBirthDate, tempDueDate, today]);

  const handleDateConfirm = () => {
    if (!activeDateField) return;
    if (activeDateField === "birth") {
      setFormState((prev) => ({ ...prev, birthDate: toIsoDateString(tempBirthDate) }));
    } else {
      setFormState((prev) => ({ ...prev, dueDate: toIsoDateString(tempDueDate) }));
    }
    closeDatePicker();
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (users.length <= 1) {
      Alert.alert("削除できません", "プロフィールは1件以上必要です。");
      return;
    }
    Alert.alert("削除しますか？", "このプロフィールと記録を削除します。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await deleteUser(existing.id);
          navigation.popToTop();
        },
      },
    ]);
  };

  const title = existing ? "プロフィールを編集" : "新しいこどもを追加";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.headerLeftText}>キャンセル</Text>
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="medium">
          {title}
        </AppText>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>名前</Text>
          <TextInput
            value={formState.name}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, name: text }))}
            style={styles.input}
            placeholder="お名前"
          />
        </View>

        <View style={styles.field}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => openDatePicker("birth")}
            accessibilityRole="button"
            accessibilityLabel="出生日を選択"
          >
            <Text style={styles.dateRowLabel}>出生日</Text>
            <Text style={styles.dateRowValue}>{formState.birthDate} ▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => openDatePicker("due")}
            accessibilityRole="button"
            accessibilityLabel="出産予定日を選択"
          >
            <Text style={styles.dateRowLabel}>出産予定日</Text>
            <Text style={styles.dateRowValue}>{formState.dueDate} ▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>こども表示設定</Text>
          <Text style={styles.description}>ここで変更した設定は、「保存」を押すまで反映されません。</Text>

          <View style={styles.field}>
            <Text style={styles.label}>修正月齢の表示上限</Text>
            <View style={styles.optionRow}>
              {[
                { label: "24か月", value: 24 },
                { label: "36か月", value: 36 },
                { label: "制限なし", value: null },
              ].map((option) => (
                <Pressable
                  key={option.label}
                  style={[
                    styles.optionButton,
                    draftSettings.showCorrectedUntilMonths === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() =>
                    setDraftSettings((prev) => ({ ...prev, showCorrectedUntilMonths: option.value }))
                  }
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      draftSettings.showCorrectedUntilMonths === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>月齢表示形式</Text>
            <View style={styles.optionRow}>
              {[
                { label: "2M4D", value: "md" },
                { label: "1Y2M4D", value: "ymd" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.optionButton, draftSettings.ageFormat === option.value && styles.optionButtonSelected]}
                  onPress={() => setDraftSettings((prev) => ({ ...prev, ageFormat: option.value as UserSettings["ageFormat"] }))}
                >
                  <Text
                    style={[styles.optionLabel, draftSettings.ageFormat === option.value && styles.optionLabelSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>生まれてからの日数表示</Text>
            <View style={styles.switchRow}>
              <Text style={styles.optionLabel}>{draftSettings.showDaysSinceBirth ? "ON" : "OFF"}</Text>
              <Switch
                value={draftSettings.showDaysSinceBirth}
                onValueChange={(value) => setDraftSettings((prev) => ({ ...prev, showDaysSinceBirth: value }))}
              />
            </View>
          </View>
        </View>

      </ScrollView>
      <View style={styles.fixedActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          accessibilityRole="button"
          disabled={!isFormValid}
        >
          <Text style={styles.actionButtonText}>保存</Text>
        </TouchableOpacity>
        {existing ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, users.length <= 1 && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={users.length <= 1}
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>このプロフィールを削除する</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={isDateModalVisible && activeDateField !== null}
        onRequestClose={closeDatePicker}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={closeDatePicker} accessibilityRole="button" />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDatePicker} accessibilityRole="button">
              <Text style={styles.modalHeaderText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{activeDateField === "birth" ? "出生日" : "出産予定日"}</Text>
            <TouchableOpacity onPress={handleDateConfirm} accessibilityRole="button">
              <Text style={styles.modalHeaderText}>完了</Text>
            </TouchableOpacity>
          </View>
          {activeDateField ? (
            <DateTimePicker
              key={activeDateField}
              value={pickerValue}
              mode="date"
              display="inline"
              locale="ja-JP"
              maximumDate={activeDateField === "birth" ? today : undefined}
              onChange={handleDateChange}
            />
          ) : null}
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
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBackground,
  },
  headerLeft: {
    position: "absolute",
    left: 16,
  },
  headerLeftText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accentMain,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  section: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionButtonSelected: {
    borderColor: COLORS.optionSelectedBorder,
  },
  optionLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  optionLabelSelected: {
    color: COLORS.optionSelectedBorder,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  fixedActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actions: {
    gap: 12,
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.filterBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    alignSelf: "center",
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  deleteButton: {
    backgroundColor: COLORS.sunday,
    borderColor: COLORS.sunday,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    color: COLORS.surface,
  },
});

export default ProfileEditScreen;
