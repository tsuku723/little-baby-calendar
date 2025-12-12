import React from "react";
import { StatusBar, View } from "react-native";

import Navigator from "@/navigation";
import { AppStateProvider } from "@/state/AppStateContext";
import { SettingsProvider } from "@/state/SettingsContext";

const App: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <AppStateProvider>
        <SettingsProvider>
          <Navigator />
        </SettingsProvider>
      </AppStateProvider>
    </View>
  );
};

export default App;
