import React from "react";
import { Image, StyleSheet, View } from "react-native";

type Props = {
  topOffset?: number;
};

const CalendarDecorations: React.FC<Props> = ({ topOffset = 0 }) => (
  <View style={styles.container} pointerEvents="none" accessible={false}>
    <Image
      source={require("../../assets/balloon1.png")}
      style={[styles.balloon, { top: topOffset + 4 }]}
    />
    <Image
      source={require("../../assets/clover2.png")}
      style={[styles.clover, { top: topOffset + 6 }]}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  balloon: {
    position: "absolute",
    left: 12,
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  clover: {
    position: "absolute",
    right: 12,
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
});

export default CalendarDecorations;
