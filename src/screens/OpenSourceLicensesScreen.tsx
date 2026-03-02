import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/components/AppText";
import { COLORS } from "@/constants/colors";

const OpenSourceLicensesScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText style={styles.title} weight="medium">
          オープンソースライセンス
        </AppText>
        <View style={styles.card}>
          <AppText style={styles.text}>準備中</AppText>
          <AppText style={styles.subText}>
            後続で自動生成したライセンス一覧 JSON を表示する想定です。
          </AppText>
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
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 34,
    color: COLORS.textPrimary,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
    gap: 8,
  },
  text: {
    fontSize: 18,
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default OpenSourceLicensesScreen;
