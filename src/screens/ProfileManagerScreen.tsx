import React, { useLayoutEffect } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { SettingsStackParamList } from "@/navigation";
import AppText from "@/components/AppText";
import { useAppState } from "@/state/AppStateContext";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<SettingsStackParamList, "ProfileManager">;

const ProfileManagerScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useAppState();
  const { users } = state;

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({ tabBarStyle: { display: "flex" } });
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="medium">
          プロフィール編集
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerTextBlock}>
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
              <Button
                title="編集"
                onPress={() => navigation.navigate("ProfileEdit", { profileId: user.id })}
                color={COLORS.accentMain}
              />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("ProfileEdit")}
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>＋ 新しいこどもを追加</Text>
          </TouchableOpacity>
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
  backButton: {
    position: "absolute",
    left: 16,
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  container: {
    padding: 16,
    gap: 12,
  },
  headerTextBlock: {
    gap: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  cardMeta: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  footer: {
    marginTop: 12,
  },
  addButton: {
    backgroundColor: COLORS.filterBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ProfileManagerScreen;
