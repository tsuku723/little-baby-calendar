import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RecordDetailScreen from "@/screens/RecordDetailScreen";
import RecordInputScreen from "@/screens/RecordInputScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import { CalendarStackParamList, RootStackParamList } from "./types";
import TabNavigator from "./TabNavigator";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();

const CalendarStackNavigator: React.FC = () => (
  <CalendarStack.Navigator initialRouteName="Calendar" screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
  </CalendarStack.Navigator>
);

const RootNavigator: React.FC = () => {
  return (
    // RootStack は全体の画面遷移ハブ。Phase 1 の構成を保ちつつ記録詳細・入力を管理する。
    <RootStack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen name="CalendarStack" component={CalendarStackNavigator} />
      <RootStack.Screen name="RecordInput" component={RecordInputScreen} />
      <RootStack.Screen name="RecordDetail" component={RecordDetailScreen} />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
