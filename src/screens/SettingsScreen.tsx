/**
 * NOTE:
 * 繝・・繧ｿ繧ｨ繧ｯ繧ｹ繝昴・繝域ｩ溯・縺ｯ MVP 縺ｧ縺ｯ荳譌ｦ隕矩√ｋ縲・ *
 * 逅・罰・・ * - Expo Go・・OS・峨〒縺ｯ FileSystem / Sharing 縺ｫ蛻ｶ邏・′縺ゅｊ
 * - 螳溯｡檎腸蠅・↓繧医ｋ謖吝虚蟾ｮ縺悟､ｧ縺阪＞縺溘ａ
 *
 * 蟆・擂・・ * - Development Build / 陬ｽ蜩∫沿繧｢繝励Μ縺ｧ縺ｯ蜀肴､懆ｨ主庄閭ｽ
 */
import React, { useCallback } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SettingsStackParamList } from "@/navigation";
import { useAppState } from "@/state/AppStateContext";
import { COLORS } from "@/constants/colors";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setActiveUser } = useAppState();

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSelectChild = useCallback(
    async (userId: string) => {
      await setActiveUser(userId);
    },
    [setActiveUser]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Button title="竊・謌ｻ繧・ onPress={handleClose} color=COLORS.accentMain />
          <Text style={styles.title}>險ｭ螳・/Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>繝吶ン繝ｼ繧帝∈謚・/Text>
          <View style={styles.childList}>
            {state.users.map((child) => {
              const isActive = child.id === state.activeUserId;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={styles.childRow}
                  onPress={() => handleSelectChild(child.id)}
                  accessibilityRole="button"
                >
                  <View style={styles.childInfo}>
                    <Text style={[styles.childName, isActive && styles.childNameActive]}>
                      {child.name || "蜷榊燕譛ｪ險ｭ螳・}
                    </Text>
                    <Text style={styles.childMeta}>{child.birthDate ? child.birthDate : "逕溷ｹｴ譛域律譛ｪ險ｭ螳・}</Text>
                  </View>
                  <Text style={[styles.childCheck, isActive && styles.childCheckActive]}>{isActive ? "笨・ : ""}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.addRow}
            onPress={() => navigation.navigate("ProfileManager")}
            accessibilityRole="button"
          >
            <Text style={styles.addRowText}>・・蟄舌←繧ゅ・霑ｽ蜉繝ｻ邱ｨ髮・/Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.notice}>窶ｻ蜃ｺ逕滓ュ蝣ｱ縺ｯ繝励Ο繝輔ぅ繝ｼ繝ｫ邱ｨ髮・判髱｢縺ｧ縺ｮ縺ｿ蜈･蜉帙〒縺阪∪縺吶・/Text>
        <Text style={styles.notice}>窶ｻ縺薙・繧｢繝励Μ縺ｮ險倬鹸縺ｯ縲√％縺ｮ遶ｯ譛ｫ縺ｮ荳ｭ縺縺代↓菫晏ｭ倥＆繧後∪縺吶・/Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  childList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  childInfo: {
    gap: 4,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  childNameActive: {
    color: COLORS.saturday,
  },
  childMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  childCheck: {
    width: 24,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: 18,
  },
  childCheckActive: {
    color: COLORS.saturday,
    fontWeight: "700",
  },
  addRow: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addRowText: {
    color: COLORS.accentMain,
    fontSize: 16,
    fontWeight: "700",
  },
  notice: {
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cellDimmed,
    padding: 12,
    borderRadius: 8,
  },
});

export default SettingsScreen;

