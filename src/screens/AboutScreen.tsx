import React from "react";

import { ABOUT_TEXT_JA } from "@/content/legal/ja";
import LegalTextScreen from "@/screens/LegalTextScreen";

const AboutScreen: React.FC = () => {
  return <LegalTextScreen text={ABOUT_TEXT_JA} />;
};

export default AboutScreen;
