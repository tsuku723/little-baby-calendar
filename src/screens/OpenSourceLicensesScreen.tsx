import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import AppText from "@/components/AppText";
import { SettingsStackParamList } from "@/navigation";
import { COLORS } from "@/constants/colors";
import { License, LICENSES, MIT_LICENSE_TEXT, OFL_LICENSE_TEXT } from "@/content/licenses";

const LICENSE_TEXT: Record<string, string> = {
  MIT: MIT_LICENSE_TEXT,
  "OFL-1.1": OFL_LICENSE_TEXT,
};

const LicenseItem: React.FC<{ item: License }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const licenseText = LICENSE_TEXT[item.license];

  return (
    <View style={styles.item}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.itemInfo}>
          <AppText style={styles.itemName} weight="medium">
            {item.name}
          </AppText>
          <AppText style={styles.itemLicense}>{item.license}</AppText>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.itemBody}>
          <AppText style={styles.copyright}>{item.copyright}</AppText>
          {licenseText && (
            <AppText style={styles.licenseText}>{licenseText}</AppText>
          )}
        </View>
      )}
    </View>
  );
};

type Props = NativeStackScreenProps<SettingsStackParamList, "OpenSourceLicenses">;

const OpenSourceLicensesScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="戻る">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="medium">オープンソースライセンス</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText style={styles.title} weight="medium">
          オープンソースライセンス
        </AppText>
        <AppText style={styles.description}>
          本アプリは以下のオープンソースライブラリを使用しています。各項目をタップするとライセンス全文を確認できます。
        </AppText>
        <View style={styles.list}>
          {LICENSES.map((item) => (
            <LicenseItem key={item.name} item={item} />
          ))}
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
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    lineHeight: 34,
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  list: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: COLORS.surface,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  itemLicense: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  itemBody: {
    padding: 14,
    paddingTop: 0,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  copyright: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  licenseText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: "monospace",
  },
});

export default OpenSourceLicensesScreen;
