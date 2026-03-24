import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import WebView from "react-native-webview";

import { COLORS } from "@/constants/colors";
import { OSS_LICENSES_URL } from "@/constants/legalUrls";

const OpenSourceLicensesScreen: React.FC = () => (
  <WebView
    source={{ uri: OSS_LICENSES_URL }}
    style={styles.webview}
    renderLoading={() => (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accentMain} />
      </View>
    )}
    startInLoadingState
  />
);

const styles = StyleSheet.create({
  webview: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});

export default OpenSourceLicensesScreen;
