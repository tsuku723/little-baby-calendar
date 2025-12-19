import React from "react";
import { StatusBar, View } from "react-native";

import Navigator from "@/navigation";
import { AppStateProvider } from "@/state/AppStateContext";
import { AchievementsProvider } from "@/state/AchievementsContext";

const App: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <AppStateProvider>
        <AchievementsProvider>
          <Navigator />
        </AchievementsProvider>
      </AppStateProvider>
    </View>
  );
};

export default App;
