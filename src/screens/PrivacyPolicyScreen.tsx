import React from "react";

import { PRIVACY_POLICY_TEXT_JA } from "@/content/legal/ja";
import LegalTextScreen from "@/screens/LegalTextScreen";

const PrivacyPolicyScreen: React.FC = () => {
  return <LegalTextScreen text={PRIVACY_POLICY_TEXT_JA} />;
};

export default PrivacyPolicyScreen;
