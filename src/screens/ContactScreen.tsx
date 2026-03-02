import React, { useCallback } from "react";
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import AppText from "@/components/AppText";
import { LEGAL_META } from "@/content/legal/ja";
import { COLORS } from "@/constants/colors";

const SUPPORT_EMAIL = LEGAL_META.contactEmail;

const ContactScreen: React.FC = () => {
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
