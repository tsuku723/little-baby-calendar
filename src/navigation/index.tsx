import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CalendarScreen from "@/screens/CalendarScreen";
import TodayScreen from "@/screens/TodayScreen";
import SetupScreen from "@/screens/SetupScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AchievementListScreen from "@/screens/AchievementListScreen";
import ProfileManagerScreen from "@/screens/ProfileManagerScreen";
import { useSettings } from "@/state/SettingsContext";

export type RootStackParamList = {
  Today: { selectedDay?: string } | undefined;
  Setup: undefined;
  Calendar: { initialSelectedDay?: string } | undefined;
  Settings: undefined;
  AchievementList: undefined;
  ProfileManager: undefined;
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
  const { loading } = useSettings();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Today" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Today" component={TodayScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="AchievementList" component={AchievementListScreen} />
        <Stack.Screen name="ProfileManager" component={ProfileManagerScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
