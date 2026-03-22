import React, { useCallback } from "react";
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import AppText from "@/components/AppText";
import { LEGAL_META } from "@/content/legal/ja";
import { SettingsStackParamList } from "@/navigation";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<SettingsStackParamList, "Contact">;

const SUPPORT_EMAIL = LEGAL_META.contactEmail;

const ContactScreen: React.FC<Props> = ({ navigation }) => {
  const handlePressEmail = useCallback(async () => {
    const encodedSubject = encodeURIComponent("お問い合わせ");
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);

    if (!canOpen) {
      Alert.alert("メールを開けません", "メールアプリが利用できるか確認してください。");
      return;
    }

    await Linking.openURL(mailtoUrl);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="戻る">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="medium">お問い合わせ</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText style={styles.description}>
          ご意見・ご不明点がございましたら、以下のメールアドレスまでご連絡ください。
        </AppText>
        <View style={styles.emailCard}>
          <AppText style={styles.emailLabel} weight="medium">
            メールアドレス
          </AppText>
          <AppText style={styles.emailValue}>{SUPPORT_EMAIL}</AppText>
        </View>
        <TouchableOpacity style={styles.button} onPress={handlePressEmail} accessibilityRole="button">
          <AppText style={styles.buttonText} weight="medium">
            メールを起動する
          </AppText>
        </TouchableOpacity>
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
    padding: 24,
    gap: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  emailCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
    gap: 8,
  },
  emailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emailValue: {
    fontSize: 18,
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.filterBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});

export default ContactScreen;
