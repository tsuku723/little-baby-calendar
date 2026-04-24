import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TEST_BANNER_ID = "ca-app-pub-3940256099942544/2934735716";
const BANNER_HEIGHT = 50;

const AdBanner: React.FC = () => {
  if (__DEV__) {
    return (
      <View style={styles.placeholder} testID="ad-banner-placeholder">
        <Text style={styles.placeholderText}>広告エリア</Text>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = require("react-native-google-mobile-ads");
  return (
    <View testID="ad-banner-real">
      <BannerAd unitId={TEST_BANNER_ID} size={BannerAdSize.BANNER} />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    height: BANNER_HEIGHT,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 12,
  },
});

export default AdBanner;
