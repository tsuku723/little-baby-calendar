import React, { useCallback, useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { DEFAULT_SETTINGS, UserSettings } from "@/types/models";
import { useSettings } from "@/state/SettingsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Setup">;

const MONTH_LIMIT_OPTIONS: Array<UserSettings["showCorrectedUntilMonths"]> = [24, 36, null];

const SetupScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS, ...settings });

  const handleChange = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    // 入力値をローカル状態に反映（保存は送信時）
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canSubmit = useMemo(() => !!localSettings.birthDate, [localSettings.birthDate]);

  const handleSubmit = useCallback(async () => {
    // 必須の出生日チェック後、設定を保存してカレンダーへ遷移
    if (!localSettings.birthDate) {
      Alert.alert("出生日は必須です", "出生日を入力してください", [{ text: "OK" }]);
      return;
    }
    await updateSettings({ ...localSettings });
    navigation.replace("Calendar");
  }, [localSettings, navigation, updateSettings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>ようこそ。「リトルベビーカレンダー」へ</Text>
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
              <View key={option === null ? "none" : option} style={styles.optionButton}>
                <Button
                  title={option === null ? "制限なし" : `${option}か月`}
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

        <View style={styles.field}>
          <Text style={styles.label}>生まれてからの日数を表示</Text>
          <View style={styles.toggleRow}>
            <Switch
              value={localSettings.showDaysSinceBirth}
              onValueChange={(value) => handleChange("showDaysSinceBirth", value)}
              trackColor={{ false: "#D7D3CC", true: "#3A86FF" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={styles.notice}>※このアプリの記録は、この端末の中だけに保存されます。</Text>

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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
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
