import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AchievementListScreen from "@/screens/AchievementListScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import ProfileEditScreen from "@/screens/ProfileEditScreen";
import ProfileManagerScreen from "@/screens/ProfileManagerScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import TodayScreen from "@/screens/TodayScreen";
import { CalendarStackParamList, RecordListStackParamList, SettingsStackParamList, TabParamList, TodayStackParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const RecordListStack = createNativeStackNavigator<RecordListStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const TodayStackNavigator: React.FC = () => (
  <TodayStack.Navigator initialRouteName="Today" screenOptions={{ headerShown: false }}>
    <TodayStack.Screen name="Today" component={TodayScreen} />
  </TodayStack.Navigator>
);

const CalendarStackNavigator: React.FC = () => (
  <CalendarStack.Navigator initialRouteName="Calendar" screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
  </CalendarStack.Navigator>
);

const RecordListStackNavigator: React.FC = () => (
  <RecordListStack.Navigator initialRouteName="AchievementList" screenOptions={{ headerShown: false }}>
    <RecordListStack.Screen name="AchievementList" component={AchievementListScreen} />
  </RecordListStack.Navigator>
);

const SettingsStackNavigator: React.FC = () => (
  <SettingsStack.Navigator initialRouteName="Settings" screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    <SettingsStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    <SettingsStack.Screen name="ProfileManager" component={ProfileManagerScreen} />
  </SettingsStack.Navigator>
);

const TabNavigator: React.FC = () => {
  return (
    // グラフは記録一覧画面の表示切替に集約したためタブから削除
    <Tab.Navigator initialRouteName="TodayStack" screenOptions={{ headerShown: false }}>
      <Tab.Screen name="TodayStack" component={TodayStackNavigator} options={{ tabBarLabel: "Today" }} />
      <Tab.Screen name="CalendarStack" component={CalendarStackNavigator} options={{ tabBarLabel: "カレンダー" }} />
      <Tab.Screen name="RecordListStack" component={RecordListStackNavigator} options={{ tabBarLabel: "記録一覧" }} />
      <Tab.Screen name="SettingsStack" component={SettingsStackNavigator} options={{ tabBarLabel: "設定" }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
