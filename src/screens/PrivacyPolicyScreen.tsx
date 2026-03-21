import React from "react";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { PRIVACY_POLICY_TEXT_JA } from "@/content/legal/ja";
import { SettingsStackParamList } from "@/navigation";
import LegalTextScreen from "@/screens/LegalTextScreen";

type Props = NativeStackScreenProps<SettingsStackParamList, "PrivacyPolicy">;

const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  return <LegalTextScreen text={PRIVACY_POLICY_TEXT_JA} title="プライバシーポリシー" onBack={() => navigation.goBack()} />;
};

export default PrivacyPolicyScreen;
