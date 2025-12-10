import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Achievement } from "@/models/dataModels";

interface Props {
  item: Achievement;
  onEdit: (item: Achievement) => void;
  onDelete: (item: Achievement) => void;
}

const typeLabel = (type: Achievement["type"]): string => (type === "did" ? "できた" : "頑張った");

const AchievementItem: React.FC<Props> = ({ item, onEdit, onDelete }) => (
  <TouchableOpacity style={styles.container} onPress={() => onEdit(item)}>
    <View style={styles.header}>
      <Text style={styles.type}>{typeLabel(item.type)}</Text>
      <TouchableOpacity onPress={() => onDelete(item)} accessibilityRole="button">
        <Text style={styles.delete}>削除</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.title} numberOfLines={2}>
      {item.title}
    </Text>
    {item.memo ? (
      <Text style={styles.memo} numberOfLines={3}>
        {item.memo}
      </Text>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderColor: "#E6E2DA",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  type: {
    fontSize: 16,
    color: "#3A86FF",
    fontWeight: "600",
  },
  delete: {
    fontSize: 14,
    color: "#D9534F",
  },
  title: {
    fontSize: 16,
    color: "#2E2A27",
    fontWeight: "500",
  },
  memo: {
    fontSize: 14,
    color: "#4A453D",
    lineHeight: 20,
  },
});

export default AchievementItem;
