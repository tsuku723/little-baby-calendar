import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";
import { useAppState } from "@/state/AppStateContext";
import { toIsoDateString } from "@/utils/dateUtils";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileManager">;

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
  const { state, addUser, updateUser, deleteUser, setActiveUser } = useAppState();
  const { users, activeUserId } = state;

  const [formState, setFormState] = useState<FormState>(createEmptyForm());
  const [editMode, setEditMode] = useState<EditMode>({ mode: "none" });

  useEffect(() => {
    if (users.length === 0) {
      setEditMode({ mode: "new" });
      setFormState(createEmptyForm());
    }
  }, [users.length]);

  const activeLabel = useMemo(() => new Set([activeUserId]), [activeUserId]);

  const handleSelect = (userId: string) => {
    void setActiveUser(userId);
  };

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
      navigation.navigate("Today");
    } else if (editMode.mode === "edit") {
      await updateUser(editMode.userId, {
        name,
        birthDate,
        dueDate,
      });
      navigation.navigate("Today");
    }

    setEditMode({ mode: "none" });
    setFormState(createEmptyForm());
  };

  const renderForm = () => {
    if (editMode.mode === "none") return null;

    const isNew = editMode.mode === "new";

    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{isNew ? "新規プロフィール" : "プロフィール編集"}</Text>
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
        <Text style={styles.title}>プロフィール管理</Text>

        {users.map((user) => {
          const isActive = activeLabel.has(user.id);
          return (
            <View key={user.id} style={[styles.card, isActive ? styles.activeCard : null]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, isActive ? styles.activeText : null]}>
                  {user.name} {isActive ? "(選択中)" : ""}
                </Text>
              </View>
              <Text style={styles.cardText}>誕生日: {user.birthDate}</Text>
              <Text style={styles.cardText}>予定日: {user.dueDate ?? "なし"}</Text>
              <View style={styles.actionsRow}>
                <Button title="選択" onPress={() => handleSelect(user.id)} color="#3A86FF" />
                <Button title="編集" onPress={() => handleStartEdit(user.id)} color="#6B665E" />
                <Button
                  title="削除"
                  onPress={() => handleDelete(user.id)}
                  color={users.length <= 1 ? "#A9A29A" : "#D90429"}
                  disabled={users.length <= 1}
                />
              </View>
            </View>
          );
        })}

        {renderForm()}

        <View style={styles.footer}>
          <Button title="新規プロフィール追加" onPress={handleStartNew} color="#3A86FF" />
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E2A27",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1DA",
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  activeCard: {
    borderColor: "#3A86FF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2A27",
  },
  activeText: {
    color: "#3A86FF",
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
