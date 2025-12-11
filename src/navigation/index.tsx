import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import CalendarScreen from "@/screens/CalendarScreen";
import TodayScreen from "@/screens/TodayScreen";
import SetupScreen from "@/screens/SetupScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AchievementListScreen from "@/screens/AchievementListScreen";
import { useSettings } from "@/state/SettingsContext";
import AchievementSheet from "@/components/AchievementSheet";

export type RootStackParamList = {
  Today: undefined;
  Setup: undefined;
  Calendar: { initialSelectedDay?: string } | undefined;
  Settings: undefined;
  AchievementList: undefined;
  AchievementSheet: { isoDay: string } | undefined;
  ProfileManager: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AchievementSheetScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "AchievementSheet"
>;

const AchievementSheetScreen: React.FC<AchievementSheetScreenProps> = ({
  route,
  navigation,
}) => (
  <AchievementSheet
    isoDay={route.params?.isoDay ?? null}
    visible
    onClose={() => navigation.goBack()}
  />
);

const ProfileManagerPlaceholder: React.FC = () => (
  <SafeAreaView style={styles.placeholderContainer}>
    <View>
      <Text style={styles.placeholderTitle}>プロフィール切り替え</Text>
      <Text style={styles.placeholderText}>後続フェーズで提供予定です。</Text>
    </View>
  </SafeAreaView>
);

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
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AchievementList" component={AchievementListScreen} />
        <Stack.Screen
          name="AchievementSheet"
          component={AchievementSheetScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="ProfileManager" component={ProfileManagerPlaceholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    backgroundColor: "#FFFDF9",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E2A27",
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: "#2E2A27",
  },
});
