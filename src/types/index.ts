/**
 * CareCompass Core Types & Interfaces
 */

export type RiskLevel = 'low' | 'attention' | 'urgent';

export interface ExtractedSymptom {
  id: string;
  name: string;
  duration: string;
  durationDays: number;
  severity: number; // 1 to 10
  bodyArea: BodyArea;
  isNegation: boolean; // e.g. "no fever"
  rawText?: string;
  confidence: number; // 0.0 to 1.0
}

export type BodyArea =
  | 'head'
  | 'chest'
  | 'abdomen'
  | 'back'
  | 'limbs'
  | 'throat'
  | 'skin'
  | 'systemic'
  | 'respiratory'
  | 'neurological'
  | 'other';

export interface PatientDemographics {
  age: number;
  sex: 'male' | 'female' | 'other';
  isPregnant?: boolean;
  knownConditions: string[];
  currentMedications: string[];
}

export interface RedFlagRule {
  id: string;
  title: string;
  description: string;
  category: 'cardiac' | 'stroke' | 'respiratory' | 'anaphylaxis' | 'sepsis' | 'trauma' | 'pediatric' | 'psychiatric' | 'general';
  severityOverride: RiskLevel;
  emergencyActionText: string;
}

export interface ContributingFactor {
  factor: string;
  category: 'symptom' | 'demographic' | 'duration' | 'comorbidity' | 'vitals';
  weight: number; // -100 to +100
  impactText: string;
}

export interface RiskAnalysisResult {
  riskLevel: RiskLevel;
  ruleScore: number; // 0 - 100
  mlScore: number; // 0 - 100
  finalScore: number; // 0 - 100 (cautious higher score)
  confidence: number; // 0.0 - 1.0
  redFlagsTriggered: RedFlagRule[];
  contributingFactors: ContributingFactor[];
  warningPatternTitle: string;
  warningPatternDescription: string;
  plainLanguageExplanation: string; // 6th grade reading level
  whatWouldChangeCategory: string[];
  careRecommendation: CareRecommendation;
  whenToSeekHelpImmediately: string[];
  timestamp: string;
}

export type CareLevel =
  | 'self_care'
  | 'pharmacist'
  | 'teleconsult'
  | 'gp_clinic'
  | 'specialist'
  | 'urgent_care'
  | 'emergency';

export interface CareRecommendation {
  level: CareLevel;
  title: string;
  description: string;
  urgencyTimeline: string;
  suggestedSpecialist?: string;
  actionItems: string[];
  emergencyNumbers?: {
    general: string;
    ambulance: string;
    womenHelpline?: string;
    telehealth?: string;
  };
}

export interface FollowUpReminder {
  id: string;
  assessmentId?: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  type: 'recheck' | 'gp_visit' | 'medication' | 'vitals_check' | 'custom';
  status: 'pending' | 'completed' | 'snoozed' | 'missed';
  autoEscalateCaregiver: boolean;
  escalated: boolean;
  createdAt: string;
}

export interface Caregiver {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  consentGranted: boolean;
  consentedData: {
    urgentAlerts: boolean;
    missedFollowUps: boolean;
    worseningTrend: boolean;
    symptomSummary: boolean;
    medications: boolean;
  };
  createdAt: string;
}

export interface CaregiverAlert {
  id: string;
  caregiverId: string;
  caregiverName: string;
  patientName: string;
  type: 'urgent_risk' | 'missed_followup' | 'worsening_trend';
  title: string;
  message: string;
  channels: ('sms' | 'email' | 'push')[];
  dispatchedAt: string;
  status: 'delivered' | 'read';
}

export interface AssessmentRecord {
  id: string;
  patientName: string;
  demographics: PatientDemographics;
  rawInputText: string;
  inputLanguage: 'en' | 'hi' | 'te';
  extractedSymptoms: ExtractedSymptom[];
  result: RiskAnalysisResult;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'assessment_created' | 'pii_redacted' | 'data_exported' | 'data_deleted' | 'caregiver_alert_sent' | 'consent_modified' | 'symptom_extracted';
  actor: string;
  details: string;
  privacySafe: boolean;
}

export interface DemoScenario {
  id: string;
  name: string;
  persona: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  conditions: string[];
  text: string;
  language: 'en' | 'hi' | 'te';
  expectedRisk: RiskLevel;
  highlight: string;
}

export interface PipelineStageEvent {
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  description: string;
  input: any;
  output: any;
  processingTimeMs: number;
  isRedFlagTriggered?: boolean;
}
