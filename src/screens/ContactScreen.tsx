import React, { useCallback } from "react";
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS } from "@/constants/colors";

const SUPPORT_EMAIL = "support@example.com";

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
        <Text style={styles.text}>準備中。後で本文を差し替えます。</Text>
        <TouchableOpacity style={styles.button} onPress={handlePressEmail} accessibilityRole="button">
          <Text style={styles.buttonText}>メールでお問い合わせ</Text>
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
  text: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
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
    fontWeight: "700",
  },
});

export default ContactScreen;
