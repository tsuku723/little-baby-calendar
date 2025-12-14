import React, { useEffect, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { TodayStackParamList } from "@/navigation";
import { useAppState } from "@/state/AppStateContext";
import { toIsoDateString } from "@/utils/dateUtils";

type Props = NativeStackScreenProps<TodayStackParamList, "ProfileManager">;

type FormState = {
  name: string;
  birthDate: string;
  dueDate: string;
};

type EditMode = { mode: "none" } | { mode: "new" } | { mode: "edit"; userId: string };

const createEmptyForm = (): FormState => ({
  name: "",
  birthDate: toIsoDateString(new Date()),
  dueDate: "",
});

const ProfileManagerScreen: React.FC<Props> = ({ navigation }) => {
  const { state, addUser, updateUser, deleteUser } = useAppState();
  const { users } = state;

  const [formState, setFormState] = useState<FormState>(createEmptyForm());
  const [editMode, setEditMode] = useState<EditMode>({ mode: "none" });

  useEffect(() => {
    if (users.length === 0) {
      setEditMode({ mode: "new" });
      setFormState(createEmptyForm());
    }
  }, [users.length]);

  const handleDelete = (userId: string) => {
    if (users.length <= 1) {
      Alert.alert("削除できません", "プロフィールは1件以上必要です。");
      return;
    }
    Alert.alert("削除しますか？", "このプロフィールと記録を削除します。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => void deleteUser(userId),
      },
    ]);
  };

  const handleStartEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setEditMode({ mode: "edit", userId });
    setFormState({
      name: user.name,
      birthDate: user.birthDate,
      dueDate: user.dueDate ?? "",
    });
  };

  const handleStartNew = () => {
    setEditMode({ mode: "new" });
    setFormState(createEmptyForm());
  };

  const handleSubmit = async () => {
    const name = formState.name.trim();
    const birthDate = formState.birthDate.trim();
    const dueDate = formState.dueDate.trim() || null;

    if (!name || !birthDate) {
      Alert.alert("入力エラー", "名前と生年月日は必須です。");
      return;
    }

    if (editMode.mode === "new") {
      await addUser({
        name,
        birthDate,
        dueDate,
        settings: {
          showCorrectedUntilMonths: 24,
          ageFormat: "md",
          showDaysSinceBirth: true,
          lastViewedMonth: null,
        },
      });
      navigation.replace("Today"); // 編集完了後は Today に戻る
    } else if (editMode.mode === "edit") {
      await updateUser(editMode.userId, {
        name,
        birthDate,
        dueDate,
      });
      navigation.replace("Today"); // 編集完了後は Today に戻る
    }

    setEditMode({ mode: "none" });
    setFormState(createEmptyForm());
  };

  const renderForm = () => {
    if (editMode.mode === "none") return null;

    const isNew = editMode.mode === "new";

    // プロフィール情報（出生日・予定日含む）はこの画面の編集モードでのみ入力できるようにする。
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{isNew ? "新しいこどもを追加" : "プロフィール編集"}</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>名前</Text>
          <TextInput
            value={formState.name}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, name: text }))}
            style={styles.input}
            placeholder="お名前"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>生年月日 (YYYY-MM-DD)</Text>
          <TextInput
            value={formState.birthDate}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, birthDate: text }))}
            style={styles.input}
            placeholder="2023-01-01"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>予定日 (任意)</Text>
          <TextInput
            value={formState.dueDate}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, dueDate: text }))}
            style={styles.input}
            placeholder="未設定なら空のまま"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.formActions}>
          <Button title="保存" onPress={handleSubmit} color="#3A86FF" />
          <Button title="キャンセル" onPress={() => setEditMode({ mode: "none" })} color="#6B665E" />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Button title="Todayに戻る" onPress={() => navigation.replace("Today")} color="#3A86FF" />
          <Text style={styles.title}>こどものプロフィールを編集</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>管理するこどもを選択</Text>
          <Text style={styles.sectionNote}>タップしてプロフィールを編集します</Text>
        </View>

        {users.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.card}
            onPress={() => handleStartEdit(user.id)}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>{user.name}</Text>
            <Text style={styles.cardText}>誕生日: {user.birthDate}</Text>
            <Text style={styles.cardText}>予定日: {user.dueDate ?? "なし"}</Text>
            <View style={styles.actionsRow}>
              <Button title="編集" onPress={() => handleStartEdit(user.id)} color="#3A86FF" />
              <Button
                title="削除"
                onPress={() => handleDelete(user.id)}
                color={users.length <= 1 ? "#A9A29A" : "#D90429"}
                disabled={users.length <= 1}
              />
            </View>
          </TouchableOpacity>
        ))}

        {renderForm()}

        <View style={styles.footer}>
          <Button title="＋ 新しいこどもを追加" onPress={handleStartNew} color="#3A86FF" />
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
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E2A27",
    marginBottom: 8,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2A27",
  },
  sectionNote: {
    fontSize: 14,
    color: "#6B665E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1DA",
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2A27",
  },
  cardText: {
    fontSize: 15,
    color: "#2E2A27",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1DA",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2A27",
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: "#2E2A27",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D7D3CC",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  footer: {
    marginTop: 8,
  },
});

export default ProfileManagerScreen;
