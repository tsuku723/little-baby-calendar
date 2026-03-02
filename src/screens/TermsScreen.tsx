import React from "react";

import { TERMS_TEXT_JA } from "@/content/legal/ja";
import LegalTextScreen from "@/screens/LegalTextScreen";

const TermsScreen: React.FC = () => {
  return <LegalTextScreen text={TERMS_TEXT_JA} />;
};

export default TermsScreen;
