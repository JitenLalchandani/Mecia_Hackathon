// frontend/src/utils/translations.js

export const translations = {
  English: {
    investigate: "Investigate",
    trustScore: "Trust Score",
    risk: "Risk",
    safestNextStep: "Safest Next Step",
    recentInvestigations: "Recent Investigations"
  },
  Hindi: {
    investigate: "जांच करें",
    trustScore: "विश्वसनीयता स्कोर",
    risk: "जोखिम",
    safestNextStep: "सबसे सुरक्षित अगला कदम",
    recentInvestigations: "हाल की जांच"
  },
  Gujarati: {
    investigate: "તપાસ કરો",
    trustScore: "વિશ્વાસ સ્કોર",
    risk: "જોખમ",
    safestNextStep: "સૌથી સુરક્ષિત આગળનું પગલું",
    recentInvestigations: "તાજેતરની તપાસ"
  }
};

export const t = (key, lang = "English") => {
  return translations[lang]?.[key] || translations["English"][key] || key;
};