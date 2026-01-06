import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Achievement } from "@/models/dataModels";
import { COLORS } from "@/constants/colors";

interface Props {
  item: Achievement;
  onEdit: (item: Achievement) => void;
  onDelete: (item: Achievement) => void;
}

const AchievementItem: React.FC<Props> = ({ item, onEdit, onDelete }) => (
  <TouchableOpacity style={styles.container} onPress={() => onEdit(item)}>
    <TouchableOpacity onPress={() => onDelete(item)} accessibilityRole="button" style={styles.deleteButton}>
      <Text style={styles.delete}>削除</Text>
    </TouchableOpacity>
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
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  deleteButton: {
    alignSelf: "flex-end",
  },
  delete: {
    fontSize: 14,
    color: COLORS.sunday,
  },
  title: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  memo: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default AchievementItem;
