import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import AppText from "@/components/AppText";
import { COLORS } from "@/constants/colors";

type Props = {
  text: string;
  title: string;
  onBack: () => void;
};

const LegalTextScreen: React.FC<Props> = ({ text, title, onBack }) => {
  const lines = text.split("\n");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="戻る">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="medium">{title}</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {lines.map((line, index) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <View key={`${index}-space`} style={styles.space} />;
          }

          if (trimmed === "---") {
            return <View key={`${index}-divider`} style={styles.divider} />;
          }

          if (trimmed.startsWith("## ")) {
            return (
              <AppText key={`${index}-h2`} style={styles.heading} weight="medium">
                {trimmed.slice(3)}
              </AppText>
            );
          }

          if (trimmed.startsWith("# ")) {
            return (
              <AppText key={`${index}-h1`} style={styles.sectionTitle} weight="medium">
                {trimmed.slice(2)}
              </AppText>
            );
          }

          return (
            <AppText key={`${index}-p`} style={styles.body}>
              {trimmed}
            </AppText>
          );
        })}
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 32,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 28,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 18,
  },
  space: {
    height: 10,
  },
});

export default LegalTextScreen;
