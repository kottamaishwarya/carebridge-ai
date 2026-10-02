/**
 * CareCompass Multilingual Localization
 * Supports: English, Hindi (हिन्दी), Telugu (తెలుగు)
 */

export type SupportedLanguage = 'en' | 'hi' | 'te';

export interface Translations {
  appName: string;
  tagline: string;
  disclaimerShort: string;
  disclaimerFull: string;
  emergencyCall: string;
  checkSymptoms: string;
  tryDemoPersonas: string;
  howItWorksTitle: string;
  howItWorksSub: string;
  privacyTitle: string;
  privacySub: string;
  navDashboard: string;
  navCheck: string;
  navReminders: string;
  navCaregiver: string;
  navPrivacy: string;
  navPipelineDemo: string;
  riskLow: string;
  riskAttention: string;
  riskUrgent: string;
  confidenceScore: string;
  deterministicRules: string;
  mlClassifier: string;
  symptomInputPlaceholder: string;
  voiceStart: string;
  voiceListening: string;
  voiceStop: string;
  extractedChipsTitle: string;
  addSymptom: string;
  severityLabel: string;
  durationLabel: string;
  bodyAreaLabel: string;
  negationTag: string;
  resultsTitle: string;
  whyThisResult: string;
  recommendedCare: string;
  remindersTitle: string;
  caregiverTitle: string;
  auditLog: string;
  exportData: string;
  deleteAllData: string;
  close: string;
  save: string;
  cancel: string;
  step1Demographics: string;
  step2Symptoms: string;
  step3Review: string;
  step4Results: string;
  age: string;
  gender: string;
  knownConditions: string;
  currentMeds: string;
  pregnantQuestion: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'CareCompass',
    tagline: 'AI Health Risk Awareness & Care Navigation',
    disclaimerShort: 'Decision-support & awareness tool only. Not a medical diagnosis. In emergency call 112 or 108.',
    disclaimerFull:
      'CareCompass is an educational decision-support tool. It does not provide medical diagnoses, prescribe medications, or substitute for professional clinical judgment. If you are experiencing a life-threatening medical emergency, immediately dial 112 or 108.',
    emergencyCall: 'Emergency Call 112 / 108',
    checkSymptoms: 'Check Symptoms Now',
    tryDemoPersonas: 'Try Demo Personas',
    howItWorksTitle: 'How CareCompass Works',
    howItWorksSub: 'A 6-stage clinical decision-support pipeline designed with safety-first determinism.',
    privacyTitle: 'Privacy-First Architecture',
    privacySub: 'Local-first data storage with automated PII stripping before any external NLP.',
    navDashboard: 'Dashboard',
    navCheck: 'Check Symptoms',
    navReminders: 'Follow-ups',
    navCaregiver: 'Caregiver Mode',
    navPrivacy: 'Privacy & Data',
    navPipelineDemo: 'Pipeline Inspector',
    riskLow: 'Low Risk',
    riskAttention: 'Needs Attention',
    riskUrgent: 'Urgent Attention Needed',
    confidenceScore: 'Model Confidence',
    deterministicRules: 'Safety Red-Flag Rules',
    mlClassifier: 'Statistical / ML Scorer',
    symptomInputPlaceholder: 'Type or speak your symptoms (e.g., "Mild sore throat since yesterday, no fever")...',
    voiceStart: 'Speak Symptoms',
    voiceListening: 'Listening... speak clearly',
    voiceStop: 'Stop Recording',
    extractedChipsTitle: 'Structured Symptoms Identified (Review & Confirm)',
    addSymptom: 'Add Symptom',
    severityLabel: 'Severity',
    durationLabel: 'Duration',
    bodyAreaLabel: 'Body Area',
    negationTag: 'Absent / Denied',
    resultsTitle: 'Care Triage & Health Navigation Report',
    whyThisResult: 'Why this result? (Transparent Reasoning)',
    recommendedCare: 'Recommended Level of Healthcare',
    remindersTitle: 'Follow-up Reminders & Monitoring Schedule',
    caregiverTitle: 'Caregiver Consent & Alert Management',
    auditLog: 'Privacy Audit Log',
    exportData: 'Export Health Records (JSON)',
    deleteAllData: 'Delete All My Data',
    close: 'Close',
    save: 'Save Changes',
    cancel: 'Cancel',
    step1Demographics: '1. Health Profile',
    step2Symptoms: '2. Symptom Intake',
    step3Review: '3. Verify & Adjust',
    step4Results: '4. Triage Guidance',
    age: 'Age',
    gender: 'Biological Sex',
    knownConditions: 'Known Medical Conditions',
    currentMeds: 'Current Medications',
    pregnantQuestion: 'Currently pregnant?',
  },
  hi: {
    appName: 'केयरकम्पास (CareCompass)',
    tagline: 'एआई स्वास्थ्य जोखिम जागरूकता एवं देखभाल मार्गदर्शन',
    disclaimerShort: 'यह केवल जागरूकता और निर्णय-समर्थन उपकरण है। आपात स्थिति में तुरंत 112 या 108 डायल करें।',
    disclaimerFull:
      'केयरकम्पास एक गैर-निदान निर्णय-समर्थन प्रणाली है। यह डॉक्टर की जगह नहीं लेता और दवाइयां नहीं लिखता। गंभीर आपात स्थिति में तुरंत 112 या 108 पर कॉल करें।',
    emergencyCall: 'आपातकालीन कॉल 112 / 108',
    checkSymptoms: 'लक्षणों की जांच करें',
    tryDemoPersonas: 'डेमो प्रोफाइल आज़माएं',
    howItWorksTitle: 'केयरकम्पास कैसे काम करता है',
    howItWorksSub: '6-स्तरीय क्लिनिकल सुरक्षा पाइपलाइन जो सुरक्षा को सर्वोपरि रखती है।',
    privacyTitle: 'गोपनीयता और डेटा सुरक्षा',
    privacySub: 'आपका डेटा आपके डिवाइस में सुरक्षित रहता है। व्यक्तिगत पहचान (PII) पहले ही हटा दी जाती है।',
    navDashboard: 'डैशबोर्ड',
    navCheck: 'लक्षण जांच',
    navReminders: 'फॉलो-अप रिमाइंडर',
    navCaregiver: 'देखभालकर्ता मोड',
    navPrivacy: 'गोपनीयता',
    navPipelineDemo: 'पाइपलाइन इंस्पेक्टर',
    riskLow: 'कम जोखिम (Low)',
    riskAttention: 'ध्यान देने योग्य (Needs Attention)',
    riskUrgent: 'अत्यंत गंभीर / तत्काल सहायता (Urgent)',
    confidenceScore: 'मॉडल विश्वसनीयता',
    deterministicRules: 'रेड-फ्लैग सुरक्षा नियम',
    mlClassifier: 'सांख्यिकीय एमएल स्कोरर',
    symptomInputPlaceholder: 'अपने लक्षण लिखें या बोलें (जैसे: "कल से गले में खराश है, बुखार नहीं है")...',
    voiceStart: 'बोलकर बताएं',
    voiceListening: 'सुन रहे हैं... स्पष्ट बोलें',
    voiceStop: 'रिकॉर्डिंग बंद करें',
    extractedChipsTitle: 'पहचाने गए लक्षण (जांचें और पुष्टि करें)',
    addSymptom: 'लक्षण जोड़ें',
    severityLabel: 'तीव्रता',
    durationLabel: 'अवधि',
    bodyAreaLabel: 'शरीर का अंग',
    negationTag: 'अनुपस्थित / नहीं है',
    resultsTitle: 'स्वास्थ्य जोखिम एवं देखभाल रिपोर्ट',
    whyThisResult: 'यह परिणाम क्यों आया? (स्पष्टीकरण)',
    recommendedCare: 'अनुशंसित चिकित्सा स्तर',
    remindersTitle: 'फॉलो-अप और समय सारिणी',
    caregiverTitle: 'देखभालकर्ता अलर्ट और सहमति',
    auditLog: 'गोपनीयता ऑडिट लॉग',
    exportData: 'डेटा निर्यात करें (JSON)',
    deleteAllData: 'सभी डेटा मिटाएं',
    close: 'बंद करें',
    save: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    step1Demographics: '1. स्वास्थ्य प्रोफ़ाइल',
    step2Symptoms: '2. लक्षण विवरण',
    step3Review: '3. समीक्षा और पुष्टि',
    step4Results: '4. मार्गदर्शन रिपोर्ट',
    age: 'आयु',
    gender: 'लिंग',
    knownConditions: 'पुरानी बीमारियां',
    currentMeds: 'वर्तमान दवाएं',
    pregnantQuestion: 'क्या आप गर्भवती हैं?',
  },
  te: {
    appName: 'కేర్ కంపాస్ (CareCompass)',
    tagline: 'ఏఐ ఆరోగ్య ప్రమాద అవగాహన మరియు సంరక్షణ మార్గదర్శి',
    disclaimerShort: 'ఇది కేవలం అవగాహన మరియు నిర్ణయ-మద్దతు సాధనం. అత్యవసర పరిస్థితుల్లో 112 లేదా 108 కు కాల్ చేయండి.',
    disclaimerFull:
      'కేర్ కంపాస్ అనేది రోగనిర్ధారణ సాధనం కాదు. ఇది వైద్యుని సంప్రదింపులను భర్తీ చేయదు. అత్యవసర ప్రాణాపాయ పరిస్థితుల్లో వెంటనే 112 లేదా 108 నంబర్లకు ఫోన్ చేయండి.',
    emergencyCall: 'అత్యవసర కాల్ 112 / 108',
    checkSymptoms: 'లక్షణాలను తనిఖీ చేయండి',
    tryDemoPersonas: 'డెమో ప్రొఫైల్స్ ప్రయత్నించండి',
    howItWorksTitle: 'కేర్ కంపాస్ ఎలా పనిచేస్తుంది',
    howItWorksSub: 'భద్రతకు ప్రాధాన్యతనిచ్చే 6-దశల క్లినికల్ డెసిషన్ పైప్‌లైన్.',
    privacyTitle: 'వ్యక్తిగత గోప్యత & భద్రత',
    privacySub: 'మీ డేటా స్థానికంగా భద్రపరచబడుతుంది మరియు వ్యక్తిగత వివరాలు సురక్షితంగా తొలగించబడతాయి.',
    navDashboard: 'డ్యాష్‌బోర్డ్',
    navCheck: 'లక్షణాల తనిఖీ',
    navReminders: 'రిమైండర్లు',
    navCaregiver: 'సంరక్షకుల మోడ్',
    navPrivacy: 'గోప్యత',
    navPipelineDemo: 'పైప్‌లైన్ ఇన్‌స్పెక్టర్',
    riskLow: 'తక్కువ ప్రమాదం (Low)',
    riskAttention: 'శ్రద్ధ వహించాలి (Needs Attention)',
    riskUrgent: 'తక్షణ వైద్యం అవసరం (Urgent)',
    confidenceScore: 'ఖచ్చితత్వ సూచిక',
    deterministicRules: 'రెడ్-ఫ్లాగ్ భద్రతా నియమాలు',
    mlClassifier: 'ఎంఎల్ వర్గీకరణ స్కోర్',
    symptomInputPlaceholder: 'మీ లక్షణాలను టైప్ చేయండి లేదా మాట్లాడండి (ఉదా: "నిన్నటి నుండి గొంతు నొప్పి, జ్వరం లేదు")...',
    voiceStart: 'మాట్లాడండి',
    voiceListening: 'వింటున్నాము... స్పష్టంగా చెప్పండి',
    voiceStop: 'ఆపండి',
    extractedChipsTitle: 'గుర్తించిన లక్షణాలు (సరిచూసుకోండి)',
    addSymptom: 'లక్షణం జోడించండి',
    severityLabel: 'తీవ్రత',
    durationLabel: 'వ్యవధి',
    bodyAreaLabel: 'శరీర భాగం',
    negationTag: 'లేదు / లేనిది',
    resultsTitle: 'ఆరోగ్య నివేదిక మరియు సంరక్షణ సూచనలు',
    whyThisResult: 'ఈ ఫలితం ఎందుకు వచ్చింది? (వివరణ)',
    recommendedCare: 'సిఫార్సు చేయబడిన సంరక్షణ స్థాయి',
    remindersTitle: 'ఫాలో-అప్ మరియు హెల్త్ షెడ్యూల్',
    caregiverTitle: 'సంరక్షకుల అలర్ట్స్ & సమ్మతి',
    auditLog: 'ఆడిట్ లాగ్',
    exportData: 'డేటాను డౌన్‌లోడ్ చేయండి (JSON)',
    deleteAllData: 'మొత్తం డేటాను తొలగించండి',
    close: 'మూసివేయి',
    save: 'భద్రపరచు',
    cancel: 'రద్దు చేయి',
    step1Demographics: '1. ప్రొఫైల్',
    step2Symptoms: '2. లక్షణాలు',
    step3Review: '3. సమీక్ష',
    step4Results: '4. మార్గదర్శకత్వం',
    age: 'వయస్సు',
    gender: 'లింగం',
    knownConditions: 'దీర్ఘకాలిక సమస్యలు',
    currentMeds: 'వాడుతున్న మందులు',
    pregnantQuestion: 'గర్భవతిగా ఉన్నారా?',
  },
};
