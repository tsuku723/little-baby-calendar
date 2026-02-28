import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

import { COLORS } from "@/constants/colors";

const PrivacyPolicyScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.text}>準備中。後で本文を差し替えます。</Text>
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
  },
  text: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
});

export default PrivacyPolicyScreen;
