import React, { useCallback, useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { DEFAULT_SETTINGS, UserSettings } from "@/types/models";
import { useSettings } from "@/state/SettingsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Setup">;

const MONTH_LIMIT_OPTIONS = [24, 36, 999] as const;

const SetupScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS, ...settings });

  const handleChange = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canSubmit = useMemo(() => !!localSettings.birthDate, [localSettings.birthDate]);

  const handleSubmit = useCallback(async () => {
    if (!localSettings.birthDate) {
      Alert.alert("出生日は必須です", "出生日を入力してください。", [{ text: "OK" }]);
      return;
    }
    await updateSettings({ ...localSettings });
    navigation.replace("Calendar");
  }, [localSettings, navigation, updateSettings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>ようこそ。「比べないカレンダー」へ</Text>
        <Text style={styles.subtitle}>はじめに、お子さんの情報をそっと教えてください。</Text>

        <View style={styles.field}>
          <Text style={styles.label}>出生日*</Text>
          <TextInput
            accessibilityLabel="出生日"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            value={localSettings.birthDate}
            onChangeText={(text) => handleChange("birthDate", text)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>出産予定日（任意）</Text>
          <TextInput
            accessibilityLabel="出産予定日"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            value={localSettings.dueDate ?? ""}
            onChangeText={(text) => handleChange("dueDate", text || null)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>修正月齢の表示上限</Text>
          <View style={styles.optionsRow}>
            {MONTH_LIMIT_OPTIONS.map((option) => (
              <View key={option} style={styles.optionButton}>
                <Button
                  title={option === 999 ? "制限なし" : `${option}か月`}
                  color={localSettings.showCorrectedUntilMonths === option ? "#3A86FF" : "#BABABA"}
                  onPress={() => handleChange("showCorrectedUntilMonths", option)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>表示形式</Text>
          <View style={styles.optionsRow}>
            {(["md", "ymd"] as UserSettings["ageFormat"][]).map((option) => (
              <View key={option} style={styles.optionButton}>
                <Button
                  title={option === "md" ? "2m4d" : "1y2m4d"}
                  color={localSettings.ageFormat === option ? "#3A86FF" : "#BABABA"}
                  onPress={() => handleChange("ageFormat", option)}
                />
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.notice}>※このアプリの記録は、この端末の中だけにそっと保存されます。</Text>

        <View style={styles.submit}>
          <Button title="カレンダーへ" onPress={handleSubmit} disabled={!canSubmit} color="#3A86FF" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
  },
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2E2A27",
  },
  subtitle: {
    fontSize: 16,
    color: "#2E2A27",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: "#2E2A27",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D7D3CC",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
    color: "#2E2A27",
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
  },
  notice: {
    fontSize: 14,
    color: "#2E2A27",
    backgroundColor: "#F2EFEA",
    padding: 12,
    borderRadius: 8,
  },
  submit: {
    marginTop: 12,
  },
});

export default SetupScreen;
