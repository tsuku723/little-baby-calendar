import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalendarScreen from "@/screens/CalendarScreen";
import SetupScreen from "@/screens/SetupScreen";
import { useSettings } from "@/state/SettingsContext";

export type RootStackParamList = {
  Setup: undefined;
  Calendar: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  const { settings, loading } = useSettings();

  if (loading) {
    return null;
  }

  const initialRoute = settings.birthDate ? "Calendar" : "Setup";

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
