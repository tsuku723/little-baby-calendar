import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

type Weight = "regular" | "medium" | "bold";

type AppTextProps = TextProps & {
  weight?: Weight;
};

const fontForWeight = (weight: Weight): string => {
  if (weight === "medium" || weight === "bold") {
    return "ZenMaruGothic-Medium";
  }
  return "ZenMaruGothic-Regular";
};

const AppText: React.FC<AppTextProps> = ({ style, weight = "regular", ...rest }) => {
  return <Text {...rest} style={[styles.base, { fontFamily: fontForWeight(weight) }, style]} />;
};

const styles = StyleSheet.create({
  base: {
    color: "#000",
  },
});

export default AppText;
