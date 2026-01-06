import React from "react";
import { View, StyleSheet } from "react-native";

const CalendarDecorations: React.FC = () => (
  <View style={styles.container} pointerEvents="none" accessible={false} />
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160, // 上部左右にスペースを確保
  },
});

export default CalendarDecorations;
