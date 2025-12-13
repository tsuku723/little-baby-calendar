import React from "react";
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "@/navigation";

// TODO (Phase 2): 記録入力フォームと保存処理を実装する
type Props = NativeStackScreenProps<RootStackParamList, "RecordInput">;

const RecordInputScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>RecordInputScreen</Text>
        <Text style={styles.note}>記録入力フォームは Phase 2 で実装予定</Text>
        <Button title="閉じる" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF9",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2A27",
  },
  note: {
    fontSize: 14,
    color: "#6B665E",
  },
});

export default RecordInputScreen;
