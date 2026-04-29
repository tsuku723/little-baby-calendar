import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SettingsStackParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useAppState } from "@/state/AppStateContext";
import { createBackup } from "@/services/backupService";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

type SupportRoute =
  | "About"
  | "PrivacyPolicy"
  | "Terms"
  | "OpenSourceLicenses"
  | "Contact";

const supportMenus: Array<{ label: string; route: SupportRoute }> = [
  { label: "このアプリについて", route: "About" },
  { label: "プライバシーポリシー", route: "PrivacyPolicy" },
  { label: "利用規約", route: "Terms" },
  { label: "オープンソースライセンス", route: "OpenSourceLicenses" },
  { label: "お問い合わせ", route: "Contact" },
];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setActiveUser } = useAppState();
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleSelectChild = useCallback(
    async (userId: string) => {
      await setActiveUser(userId);
    },
    [setActiveUser]
  );

  const handleCreateBackup = useCallback(async () => {
    setBackupLoading(true);
    setBackupError(null);
    try {
      const uri = await createBackup(state.users, state.achievements);
      await Sharing.shareAsync(uri);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラーが発生しました";
      setBackupError(message);
    } finally {
      setBackupLoading(false);
    }
  }, [state.users, state.achievements]);

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
            style={styles.addButton}
            onPress={() => navigation.navigate("ProfileManager")}
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>＋ 子どもを追加・編集</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.notice}>※出生情報はプロフィール編集画面でのみ入力できます。</Text>
        <Text style={styles.notice}>※このアプリの記録は、この端末の中だけに保存されます。</Text>

        <View style={styles.backupSection}>
          <Text style={styles.label}>データ</Text>
          <TouchableOpacity
            testID="backup-button"
            style={[styles.backupButton, backupLoading && styles.backupButtonDisabled]}
            onPress={handleCreateBackup}
            disabled={backupLoading}
            accessibilityRole="button"
          >
            {backupLoading ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.backupButtonText}>バックアップを作成</Text>
            )}
          </TouchableOpacity>
          {backupError !== null && (
            <Text style={styles.backupError}>{backupError}</Text>
          )}
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.label}>サポート</Text>
          <View style={styles.supportMenuContainer}>
            {supportMenus.map((menu, index) => {
              const isLast = index === supportMenus.length - 1;
              return (
                <TouchableOpacity
                  key={menu.route}
                  style={[styles.supportMenuRow, isLast && styles.supportMenuRowLast]}
                  onPress={() => navigation.navigate(menu.route)}
                  accessibilityRole="button"
                >
                  <Text style={styles.supportMenuLabel}>{menu.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
  addButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.filterBackground,
  },
  addButtonText: {
    color: COLORS.textPrimary,
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
  backupSection: {
    gap: 8,
  },
  backupButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.filterBackground,
    alignItems: "center",
  },
  backupButtonDisabled: {
    opacity: 0.5,
  },
  backupButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  backupError: {
    fontSize: 13,
    color: "#D32F2F",
    paddingHorizontal: 4,
  },
  supportSection: {
    gap: 8,
    marginBottom: 16,
  },
  supportMenuContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  supportMenuRow: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  supportMenuRowLast: {
    borderBottomWidth: 0,
  },
  supportMenuLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});

export default SettingsScreen;
