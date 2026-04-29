import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("react-native-google-mobile-ads", () => ({
  BannerAd: () => null,
  BannerAdSize: { BANNER: "BANNER" },
}));

describe("AdBanner", () => {
  const originalDev = __DEV__;

  afterEach(() => {
    // @ts-ignore
    global.__DEV__ = originalDev;
    jest.resetModules();
  });

  test("__DEV__ === true のとき、プレースホルダーを表示する", () => {
    // @ts-ignore
    global.__DEV__ = true;
    const AdBanner = require("../src/components/AdBanner").default;
    const { getByTestId } = render(<AdBanner />);
    expect(getByTestId("ad-banner-placeholder")).toBeTruthy();
  });

  test("__DEV__ === false のとき、AdMob バナーをレンダリングする", () => {
    // @ts-ignore
    global.__DEV__ = false;
    const AdBanner = require("../src/components/AdBanner").default;
    const { getByTestId } = render(<AdBanner />);
    expect(getByTestId("ad-banner-real")).toBeTruthy();
  });
});
