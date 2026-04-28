import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BANNER_AD_UNIT_ID = "ca-app-pub-8166243489339783/3517337126";
const BANNER_HEIGHT = 50;

const AdBanner: React.FC = () => {
  if (__DEV__) {
    return (
      <View style={styles.placeholder} testID="ad-banner-placeholder">
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = require("react-native-google-mobile-ads");
  return (
    <View testID="ad-banner-real">
      <BannerAd unitId={BANNER_AD_UNIT_ID} size={BannerAdSize.BANNER} />
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
