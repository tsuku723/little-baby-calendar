import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

import RootNavigator from "./RootNavigator";
import { DateViewProvider } from "@/state/DateViewContext";
import { COLORS } from "@/constants/colors";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    text: COLORS.textPrimary,
    card: COLORS.background,
  },
};

const Navigator: React.FC = () => {
  return (
    <NavigationContainer theme={navTheme}>
      <DateViewProvider>
        <RootNavigator />
      </DateViewProvider>
    </NavigationContainer>
  );
};

export default Navigator;
export * from "./types";
