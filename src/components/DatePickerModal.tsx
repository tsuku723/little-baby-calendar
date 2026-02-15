import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { COLORS } from "@/constants/colors";

type Props = {
  visible: boolean;
  title: string;
  value: Date;
  minimumDate: Date;
  maximumDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const clampDate = (date: Date, min: Date, max: Date): Date => {
  if (date.getTime() < min.getTime()) return new Date(min.getTime());
  if (date.getTime() > max.getTime()) return new Date(max.getTime());
  return new Date(date.getTime());
};

const sanitizeDate = (date: Date, fallback: Date): Date => {
  if (!isValidDate(date)) return new Date(fallback.getTime());
  return new Date(date.getTime());
};

const normalizeDate = (date: Date, minimumDate: Date, maximumDate: Date): Date => {
  const todayClamped = clampDate(new Date(), minimumDate, maximumDate);
  const sanitized = sanitizeDate(date, todayClamped);
  return clampDate(sanitized, minimumDate, maximumDate);
};

const DatePickerModal: React.FC<Props> = ({
  visible,
  title,
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}) => {
  const normalizedInitial = useMemo(
    () => normalizeDate(value, minimumDate, maximumDate),
    [value, minimumDate, maximumDate]
  );
  const [tempDate, setTempDate] = useState<Date>(normalizedInitial);

  useEffect(() => {
    if (!visible) return;
    setTempDate(normalizeDate(value, minimumDate, maximumDate));
  }, [maximumDate, minimumDate, value, visible]);

  const handleDateChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (event.type === "dismissed") return;
    if (!pickedDate) return;
    setTempDate(normalizeDate(pickedDate, minimumDate, maximumDate));
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel} accessibilityRole="button" />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} accessibilityRole="button">
            <Text style={styles.headerText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={() => onConfirm(tempDate)} accessibilityRole="button">
            <Text style={styles.headerText}>完了</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="spinner"
          locale="ja-JP"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleDateChange}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accentMain,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});

export default DatePickerModal;
