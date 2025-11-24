import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Achievement } from "@/types/models";

interface Props {
  item: Achievement;
  onEdit: (item: Achievement) => void;
  onDelete: (item: Achievement) => void;
}

const AchievementItem: React.FC<Props> = ({ item, onEdit, onDelete }) => (
  <TouchableOpacity style={styles.container} onPress={() => onEdit(item)}>
    <View style={styles.header}>
      <Text style={styles.type}>{item.type}</Text>
      <TouchableOpacity onPress={() => onDelete(item)} accessibilityRole="button">
        <Text style={styles.delete}>削除</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.comment} numberOfLines={3}>
      {item.comment}
    </Text>
    {item.photoUri ? <Image source={{ uri: item.photoUri }} style={styles.photo} /> : null}
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
  comment: {
    fontSize: 16,
    color: "#2E2A27",
    lineHeight: 22,
  },
  photo: {
    height: 160,
    borderRadius: 12,
  },
});

export default AchievementItem;
