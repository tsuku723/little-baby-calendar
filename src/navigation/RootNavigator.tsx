import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RecordInputScreen from "@/screens/RecordInputScreen";
import { RootStackParamList } from "./types";
import TabNavigator from "./TabNavigator";

const RootStack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    // RootStack は全体の画面遷移ハブ。Phase 1 では MainTabs と RecordInput だけを管理する。
    <RootStack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen name="RecordInput" component={RecordInputScreen} />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
