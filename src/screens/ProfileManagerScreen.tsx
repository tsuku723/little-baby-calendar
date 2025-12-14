import React from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SettingsStackParamList } from "@/navigation";
import { useAppState } from "@/state/AppStateContext";

type Props = NativeStackScreenProps<SettingsStackParamList, "ProfileManager">;

const ProfileManagerScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useAppState();
  const { users } = state;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>こどものプロフィールを編集</Text>
          <Text style={styles.subtitle}>編集したいこどもを選んでください</Text>
        </View>

        {users.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.card}
            onPress={() => navigation.navigate("ProfileEdit", { profileId: user.id })}
            accessibilityRole="button"
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{user.name || "名前未設定"}</Text>
                <Text style={styles.cardMeta}>誕生日: {user.birthDate}</Text>
                <Text style={styles.cardMeta}>予定日: {user.dueDate ?? "なし"}</Text>
              </View>
              <Button title="編集" onPress={() => navigation.navigate("ProfileEdit", { profileId: user.id })} color="#3A86FF" />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Button title="＋ 新しいこどもを追加" onPress={() => navigation.navigate("ProfileEdit")} color="#3A86FF" />
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
    gap: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E2A27",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B665E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1DA",
    borderRadius: 8,
    padding: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2A27",
  },
  cardMeta: {
    fontSize: 14,
    color: "#2E2A27",
  },
  footer: {
    marginTop: 12,
  },
});

export default ProfileManagerScreen;
