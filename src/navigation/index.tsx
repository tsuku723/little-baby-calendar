import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

import RootNavigator from "./RootNavigator";
import { DateViewProvider } from "@/state/DateViewContext";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFDF9",
    text: "#2E2A27",
    card: "#FFFDF9",
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
