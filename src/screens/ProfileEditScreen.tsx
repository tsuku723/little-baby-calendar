import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { isIsoDateString, normalizeToUtcDate, toIsoDateString } from "@/utils/dateUtils";
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

  const today = useMemo(() => new Date(), []);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

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

    navigation.goBack();
  };

  const birthDateForPicker = useMemo(() => {
    const normalized = normalizeToUtcDate(formState.birthDate);
    if (Number.isNaN(normalized.getTime())) return today;
    return normalized;
  }, [formState.birthDate, today]);

  const dueDateForPicker = useMemo(() => {
    const normalized = normalizeToUtcDate(formState.dueDate);
    if (Number.isNaN(normalized.getTime())) return today;
    return normalized;
  }, [formState.dueDate, today]);

  const handleBirthDateChange = (_: DateTimePickerEvent, pickedDate?: Date) => {
    if (!pickedDate) return;
    setFormState((prev) => ({ ...prev, birthDate: toIsoDateString(pickedDate) }));
    setShowBirthDatePicker(false);
  };

  const handleDueDateChange = (_: DateTimePickerEvent, pickedDate?: Date) => {
    if (!pickedDate) return;
    setFormState((prev) => ({ ...prev, dueDate: toIsoDateString(pickedDate) }));
    setShowDueDatePicker(false);
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
          navigation.goBack();
        },
      },
    ]);
  };

  const title = existing ? "プロフィールを編集" : "新しいこどもを追加";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerButton, styles.headerButtonLeft]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.headerButtonText}>キャンセル</Text>
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="medium">
          {title}
        </AppText>
        <TouchableOpacity
          style={[styles.headerButton, styles.headerButtonRight, !isFormValid && styles.headerButtonDisabled]}
          onPress={handleSave}
          accessibilityRole="button"
          disabled={!isFormValid}
        >
          <Text style={styles.headerButtonText}>保存</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
            onPress={() => {
              setShowBirthDatePicker((prev) => !prev);
              setShowDueDatePicker(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="出生日を選択"
          >
            <Text style={styles.dateRowLabel}>出生日</Text>
            <Text style={styles.dateRowValue}>{formState.birthDate} ▼</Text>
          </TouchableOpacity>
          {showBirthDatePicker ? (
            <View style={styles.datePickerArea}>
              <DateTimePicker
                value={birthDateForPicker}
                mode="date"
                display="inline"
                locale="ja-JP"
                maximumDate={today}
                onChange={handleBirthDateChange}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => {
              setShowDueDatePicker((prev) => !prev);
              setShowBirthDatePicker(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="出産予定日を選択"
          >
            <Text style={styles.dateRowLabel}>出産予定日</Text>
            <Text style={styles.dateRowValue}>{formState.dueDate} ▼</Text>
          </TouchableOpacity>
          {showDueDatePicker ? (
            <View style={styles.datePickerArea}>
              <DateTimePicker
                value={dueDateForPicker}
                mode="date"
                display="inline"
                locale="ja-JP"
                maximumDate={today}
                onChange={handleDueDateChange}
              />
            </View>
          ) : null}
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

        {existing ? (
          <TouchableOpacity
            style={[styles.deleteButton, users.length <= 1 && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={users.length <= 1}
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>削除</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
  },
  headerButtonLeft: {
    left: 16,
  },
  headerButtonRight: {
    right: 16,
  },
  headerButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  headerButtonDisabled: {
    opacity: 0.4,
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
  datePickerArea: {
    gap: 8,
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
  deleteButton: {
    backgroundColor: COLORS.sunday,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ProfileEditScreen;
