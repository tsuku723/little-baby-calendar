import React, { useCallback, useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { DEFAULT_SETTINGS, UserSettings } from "@/types/models";
import { useSettings } from "@/state/SettingsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const MONTH_LIMIT_OPTIONS: Array<UserSettings["showCorrectedUntilMonths"]> = [24, 36, null];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS, ...settings });

  const handleChange = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      // 各入力変更時に即保存（設定画面は即時反映）
      const next = { ...localSettings, [key]: value } as UserSettings;
      setLocalSettings(next);
      await updateSettings({ [key]: value } as Partial<UserSettings>);
    },
    [localSettings, updateSettings]
  );

  const canSave = useMemo(() => !!localSettings.birthDate, [localSettings.birthDate]);

  const handleClose = useCallback(() => {
    // 出生日が空なら警告、問題なければ前画面へ戻る
    if (!localSettings.birthDate) {
      Alert.alert("出生日は必須です", "出生日を入力してください", [{ text: "OK" }]);
      return;
    }
    navigation.goBack();
  }, [localSettings.birthDate, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Button title="＜ 戻る" onPress={handleClose} color="#3A86FF" />
          <Text style={styles.title}>設定</Text>
        </View>

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

        <View style={styles.footer}>
          <Button title="保存して戻る" onPress={handleClose} disabled={!canSave} color="#3A86FF" />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
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
  footer: {
    marginTop: 12,
  },
});

export default SettingsScreen;
