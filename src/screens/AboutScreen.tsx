import React from "react";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ABOUT_TEXT_JA } from "@/content/legal/ja";
import { SettingsStackParamList } from "@/navigation";
import LegalTextScreen from "@/screens/LegalTextScreen";

type Props = NativeStackScreenProps<SettingsStackParamList, "About">;

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  return <LegalTextScreen text={ABOUT_TEXT_JA} title="このアプリについて" onBack={() => navigation.goBack()} />;
};

export default AboutScreen;
