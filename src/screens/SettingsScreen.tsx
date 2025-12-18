import React, { useCallback } from "react";
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SettingsStackParamList } from "@/navigation";
import { useAppState } from "@/state/AppStateContext";
import { exportAppDataToJson } from "@/services/exportService";

// 出生日・予定日はプロフィール編集でのみ扱うため、この画面では表示設定を扱わない。

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setActiveUser } = useAppState();

  const handleClose = useCallback(() => {
    // プロフィール情報の検証は行わない（プロフィール編集に責務を限定するため）
    navigation.goBack();
  }, [navigation]);

  const handleSelectChild = useCallback(
    async (userId: string) => {
      await setActiveUser(userId);
    },
    [setActiveUser]
  );

  const handleExportPress = useCallback(() => {
    Alert.alert(
      "データを書き出します",
      "この端末に保存されているデータをJSONファイルとして書き出します。\n写真は含まれません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              await exportAppDataToJson({ profiles: state.users, achievements: state.achievements });
            } catch (error) {
              Alert.alert("エラー", "書き出しに失敗しました。");
            }
          },
        },
      ]
    );
  }, [state.achievements, state.users]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Button title="← 戻る" onPress={handleClose} color="#3A86FF" />
          <Text style={styles.title}>設定</Text>
        </View>

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
                    <Text style={[styles.childName, isActive && styles.childNameActive]}>{child.name || "名前未設定"}</Text>
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
            <Text style={styles.addRowText}>＋ 子どもの追加・編集</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.notice}>※出生情報はプロフィール編集画面でのみ入力できます。</Text>
        <Text style={styles.notice}>※このアプリの記録は、この端末の中だけに保存されます。</Text>

        <View style={styles.field}>
          <Text style={styles.label}>データ管理</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>この端末に保存されているデータを書き出します。</Text>
            <Text style={styles.descriptionText}>写真は含まれません。</Text>
            <Text style={styles.descriptionText}>自動バックアップは行われません。</Text>
          </View>
          <Button title="データを書き出す（JSON）" onPress={handleExportPress} color="#3A86FF" />
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
  childList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    overflow: "hidden",
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E1DA",
    backgroundColor: "#FFFFFF",
  },
  childInfo: {
    gap: 4,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    color: "#2E2A27",
    fontWeight: "600",
  },
  childNameActive: {
    color: "#1D5BBF",
  },
  childMeta: {
    fontSize: 13,
    color: "#6B665E",
  },
  childCheck: {
    width: 24,
    textAlign: "center",
    color: "#2E2A27",
    fontSize: 18,
  },
  childCheckActive: {
    color: "#1D5BBF",
    fontWeight: "700",
  },
  addRow: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    backgroundColor: "#FFFFFF",
  },
  addRowText: {
    color: "#3A86FF",
    fontSize: 16,
    fontWeight: "700",
  },
  notice: {
    fontSize: 14,
    color: "#2E2A27",
    backgroundColor: "#F2EFEA",
    padding: 12,
    borderRadius: 8,
  },
  descriptionBox: {
    gap: 4,
    padding: 12,
    backgroundColor: "#F7F3EC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E1DA",
  },
  descriptionText: {
    fontSize: 14,
    color: "#2E2A27",
  },
});

export default SettingsScreen;
