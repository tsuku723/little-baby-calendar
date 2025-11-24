import React from "react";
import { StatusBar, View } from "react-native";

import Navigator from "@/navigation";
import { AchievementsProvider } from "@/state/AchievementsContext";
import { SettingsProvider } from "@/state/SettingsContext";

const App: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <SettingsProvider>
        <AchievementsProvider>
          <Navigator />
        </AchievementsProvider>
      </SettingsProvider>
    </View>
  );
};

export default App;
