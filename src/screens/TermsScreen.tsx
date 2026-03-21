import React from "react";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { TERMS_TEXT_JA } from "@/content/legal/ja";
import { SettingsStackParamList } from "@/navigation";
import LegalTextScreen from "@/screens/LegalTextScreen";

type Props = NativeStackScreenProps<SettingsStackParamList, "Terms">;

const TermsScreen: React.FC<Props> = ({ navigation }) => {
  return <LegalTextScreen text={TERMS_TEXT_JA} title="利用規約" onBack={() => navigation.goBack()} />;
};

export default TermsScreen;
