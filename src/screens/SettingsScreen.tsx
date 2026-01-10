/**
 * NOTE:
 * データエクスポート機能は MVP では一旦見送る。
 *
 * 理由:
 * - Expo Go / iOS / Android では FileSystem / Sharing に制約あり
 * - 実行環境による挙動差が大きいため
 *
 * 追記:
 * - Development Build / 製品版アプリでは再検討可能
 */
import React, { useCallback } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SettingsStackParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useAppState } from "@/state/AppStateContext";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setActiveUser } = useAppState();

  const handleSelectChild = useCallback(
    async (userId: string) => {
      await setActiveUser(userId);
    },
    [setActiveUser]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <AppText style={styles.title} weight="medium">
          設定
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>ベビーを選択</Text>
          <View style={styles.childList}>
            {state.users.map((child) => {
              const isActive = child.id === state.activeUserId;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={styles.childRow}
                  onPress={() => handleSelectChild(child.id)}
                  accessibilityRole="button"
                >
                  <View style={styles.childInfo}>
                    <Text style={[styles.childName, isActive && styles.childNameActive]}>
                      {child.name || "名前未設定"}
                    </Text>
                    <Text style={styles.childMeta}>{child.birthDate ? child.birthDate : "生年月日未設定"}</Text>
                  </View>
                  <Text style={[styles.childCheck, isActive && styles.childCheckActive]}>{isActive ? "✓" : ""}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.addRow}
            onPress={() => navigation.navigate("ProfileManager")}
            accessibilityRole="button"
          >
            <Text style={styles.addRowText}>＋ 子どもを追加・編集</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.notice}>※出生情報はプロフィール編集画面でのみ入力できます。</Text>
        <Text style={styles.notice}>※このアプリの記録は、この端末の中だけに保存されます。</Text>
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
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  childList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  childInfo: {
    gap: 4,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  childNameActive: {
    color: COLORS.saturday,
  },
  childMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  childCheck: {
    width: 24,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: 18,
  },
  childCheckActive: {
    color: COLORS.saturday,
    fontWeight: "700",
  },
  addRow: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addRowText: {
    color: COLORS.accentMain,
    fontSize: 16,
    fontWeight: "700",
  },
  notice: {
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cellDimmed,
    padding: 12,
    borderRadius: 8,
  },
});

export default SettingsScreen;
