import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SettingsStackParamList } from "@/navigation";
import { useAppState } from "@/state/AppStateContext";
import { toIsoDateString } from "@/utils/dateUtils";

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

  useEffect(() => {
    if (existing) {
      setFormState({
        name: existing.name,
        birthDate: existing.birthDate,
        dueDate: existing.dueDate ?? "",
      });
    }
  }, [existing]);

  const handleSave = async () => {
    const name = formState.name.trim();
    const birthDate = formState.birthDate.trim();
    const dueDate = formState.dueDate.trim() || null;

    if (!name || !birthDate) {
      Alert.alert("入力エラー", "名前と生年月日は必須です。");
      return;
    }

    if (existing) {
      await updateUser(existing.id, { name, birthDate, dueDate });
    } else {
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
    }

    navigation.goBack();
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>

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
          <Text style={styles.label}>生年月日 (YYYY-MM-DD)</Text>
          <TextInput
            value={formState.birthDate}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, birthDate: text }))}
            style={styles.input}
            placeholder="2023-01-01"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>予定日 (任意)</Text>
          <TextInput
            value={formState.dueDate}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, dueDate: text }))}
            style={styles.input}
            placeholder="未設定なら空のまま"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.actions}>
          {existing ? (
            <Button title="削除" onPress={handleDelete} color={users.length <= 1 ? "#A9A29A" : "#D90429"} />
          ) : null}
          <Button title="保存" onPress={handleSave} color="#3A86FF" />
          <Button title="キャンセル" onPress={() => navigation.goBack()} color="#6B665E" />
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
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
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
    fontSize: 16,
    color: "#2E2A27",
  },
  actions: {
    gap: 12,
  },
});

export default ProfileEditScreen;
