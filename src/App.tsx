import React from "react";
import { StatusBar, View } from "react-native";

import Navigator from "@/navigation";
import { AppStateProvider } from "@/state/AppStateContext";
import { AchievementsProvider } from "@/state/AchievementsContext";
import { SettingsProvider } from "@/state/SettingsContext";

const App: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <AppStateProvider>
        <SettingsProvider>
          <AchievementsProvider>
            <Navigator />
          </AchievementsProvider>
        </SettingsProvider>
      </AppStateProvider>
    </View>
  );
};

export default App;
