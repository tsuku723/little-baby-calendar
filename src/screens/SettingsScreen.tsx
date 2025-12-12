import React, { useCallback, useMemo, useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { DEFAULT_SETTINGS, UserSettings } from "@/types/models";
import { useSettings } from "@/state/SettingsContext";

// 出生日・予定日はプロフィール編集でのみ扱うため、この画面では表示設定のみを編集する。

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const MONTH_LIMIT_OPTIONS: Array<UserSettings["showCorrectedUntilMonths"]> = [24, 36, null];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS, ...settings });

  const handleChange = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      // birthDate / dueDate はプロフィール側でのみ編集するため、ここでは表示設定だけを即時保存する
      const next = { ...localSettings, [key]: value } as UserSettings;
      setLocalSettings(next);
      await updateSettings({ [key]: value } as Partial<UserSettings>);
    },
    [localSettings, updateSettings]
  );

  const canSave = useMemo(() => true, []);

  const handleClose = useCallback(() => {
    // プロフィール情報の検証は行わない（プロフィール編集に責務を限定するため）
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Button title="← 戻る" onPress={handleClose} color="#3A86FF" />
          <Text style={styles.title}>設定</Text>
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
            {["md", "ymd"].map((option) => (
              <View key={option} style={styles.optionButton}>
                <Button
                  title={option === "md" ? "2m4d" : "1y2m4d"}
                  color={localSettings.ageFormat === option ? "#3A86FF" : "#BABABA"}
                  onPress={() => handleChange("ageFormat", option as UserSettings["ageFormat"])}
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

        <Text style={styles.notice}>※出生情報はプロフィール編集画面でのみ入力できます。</Text>
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
