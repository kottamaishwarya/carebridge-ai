/**
 * Local-First Privacy Storage Service
 *
 * Stores patient assessments, reminders, caregiver configurations, and audit logs
 * in local storage. Guarantees patient sovereignty: one-click data export and one-click total wipe.
 */

import { AssessmentRecord, AuditLogEntry, Caregiver, CaregiverAlert, DemoScenario, FollowUpReminder, PatientDemographics } from '../types';

const STORAGE_KEYS = {
  ASSESSMENTS: 'carecompass_assessments_v1',
  REMINDERS: 'carecompass_reminders_v1',
  CAREGIVERS: 'carecompass_caregivers_v1',
  ALERTS: 'carecompass_caregiver_alerts_v1',
  AUDIT_LOGS: 'carecompass_audit_logs_v1',
  PROFILE: 'carecompass_patient_profile_v1',
  SETTINGS: 'carecompass_settings_v1',
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-low-sorethroat',
    name: 'Scenario 1: Mild Sore Throat (Low Risk)',
    persona: 'Young Adult (26y, Healthy)',
    age: 26,
    sex: 'female',
    conditions: [],
    text: 'Mild sore throat for 1 day, no fever, slight throat irritation when swallowing, no breathing difficulty',
    language: 'en',
    expectedRisk: 'low',
    highlight: 'Maps to Self-Care + 48h Recovery Check-in Reminder.',
  },
  {
    id: 'demo-attention-diabetic-fever',
    name: 'Scenario 2: Fever in Elderly Diabetic (Needs Attention)',
    persona: 'Senior Citizen (62y, Type-2 Diabetes & Hypertension)',
    age: 62,
    sex: 'male',
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    text: 'Fever for 3 days, continuous body ache, feeling weak and tired, temperature 101F, no chest pain',
    language: 'en',
    expectedRisk: 'attention',
    highlight: 'Age & comorbidity multiplier triggers GP Visit within 24h + Caregiver summary alert.',
  },
  {
    id: 'demo-urgent-cardiac',
    name: 'Scenario 3: Acute Chest Pain + Left Arm + Sweating (Urgent)',
    persona: 'Adult (54y, Smoker)',
    age: 54,
    sex: 'male',
    conditions: ['High Blood Pressure'],
    text: 'Severe chest tightness spreading to left arm with cold sweating and dizziness since 2 hours',
    language: 'en',
    expectedRisk: 'urgent',
    highlight: 'Layer 1 Deterministic Red Flag RF-CARDIAC-01 triggers instant Emergency screen (112/108) + Caregiver SMS alert.',
  },
  {
    id: 'demo-multilingual-hindi',
    name: 'Scenario 4: Hindi Symptom Input (सीने में दर्द व सांस फूलना)',
    persona: 'Hindi Speaking Patient (58y)',
    age: 58,
    sex: 'female',
    conditions: ['Asthma'],
    text: 'सीने में तेज जकड़न है और सांस लेने में बहुत तकलीफ हो रही है, बहुत पसीना आ रहा है',
    language: 'hi',
    expectedRisk: 'urgent',
    highlight: 'Multilingual NLP extraction correctly extracts Devanagari Hindi and fires cardiac/respiratory red flag.',
  },
];

export interface AppSettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  soundEnabled: boolean;
  simpleLanguageMode: boolean;
  developerPipelineMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  highContrast: false,
  fontSize: 'normal',
  soundEnabled: true,
  simpleLanguageMode: false,
  developerPipelineMode: false,
};

const DEFAULT_CAREGIVER: Caregiver = {
  id: 'cg-primary',
  name: 'Sunita Sharma',
  relationship: 'Daughter / Primary Caregiver',
  phone: '+91 98450 12345',
  email: 'sunita.sharma@example.com',
  consentGranted: true,
  consentedData: {
    urgentAlerts: true,
    missedFollowUps: true,
    worseningTrend: true,
    symptomSummary: true,
    medications: true,
  },
  createdAt: new Date().toISOString(),
};

export const StorageService = {
  getAssessments(): AssessmentRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAssessment(record: AssessmentRecord): void {
    const list = this.getAssessments();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(list));
    this.addAuditLog('assessment_created', `Assessment saved: ${record.result.riskLevel.toUpperCase()}`);
  },

  getReminders(): FollowUpReminder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (data) return JSON.parse(data);
      // Seed default initial reminders if empty
      const initial: FollowUpReminder[] = [
        {
          id: 'rem-seed-1',
          title: 'Daily Blood Pressure & Pulse Log',
          description: 'Measure your resting blood pressure in the morning before breakfast.',
          dueDate: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
          type: 'vitals_check',
          status: 'pending',
          autoEscalateCaregiver: true,
          escalated: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rem-seed-2',
          title: 'Hydration & Electrolyte Check-in',
          description: 'Drink at least 2 glasses of water with oral rehydration salts.',
          dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          type: 'custom',
          status: 'pending',
          autoEscalateCaregiver: false,
          escalated: false,
          createdAt: new Date().toISOString(),
        },
      ];
      this.saveReminders(initial);
      return initial;
    } catch {
      return [];
    }
  },

  saveReminders(reminders: FollowUpReminder[]): void {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  },

  addReminders(newReminders: FollowUpReminder[]): void {
    const current = this.getReminders();
    this.saveReminders([...newReminders, ...current]);
  },

  updateReminderStatus(id: string, status: FollowUpReminder['status']): void {
    const list = this.getReminders().map((r) => (r.id === id ? { ...r, status } : r));
    this.saveReminders(list);
  },

  getCaregivers(): Caregiver[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAREGIVERS);
      if (data) return JSON.parse(data);
      const seed = [DEFAULT_CAREGIVER];
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(seed));
      return seed;
    } catch {
      return [DEFAULT_CAREGIVER];
    }
  },

  saveCaregivers(caregivers: Caregiver[]): void {
    localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(caregivers));
    this.addAuditLog('consent_modified', `Caregiver permissions updated (${caregivers.length} active)`);
  },

  getAlerts(): CaregiverAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  triggerCaregiverAlert(alert: Omit<CaregiverAlert, 'id' | 'dispatchedAt' | 'status'>): CaregiverAlert {
    const newAlert: CaregiverAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      dispatchedAt: new Date().toISOString(),
      status: 'delivered',
    };
    const list = this.getAlerts();
    list.unshift(newAlert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(list));
    this.addAuditLog('caregiver_alert_sent', `Dispatched ${newAlert.type} alert to ${newAlert.caregiverName} via ${newAlert.channels.join('/')}`);
    return newAlert;
  },

  getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addAuditLog(action: AuditLogEntry['action'], details: string): void {
    const logs = this.getAuditLogs();
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      actor: 'Local Patient Session',
      details,
      privacySafe: true,
    };
    logs.unshift(entry);
    // keep max 100 entries
    if (logs.length > 100) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  getPatientProfile(): PatientDemographics {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
      return {
        age: 38,
        sex: 'female',
        isPregnant: false,
        knownConditions: ['Hypertension'],
        currentMedications: ['Amlodipine 5mg'],
      };
    } catch {
      return { age: 38, sex: 'female', knownConditions: [], currentMedications: [] };
    }
  },

  savePatientProfile(profile: PatientDemographics): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  exportAllData(): string {
    const dump = {
      exportTimestamp: new Date().toISOString(),
      app: 'CareCompass AI',
      profile: this.getPatientProfile(),
      assessments: this.getAssessments(),
      reminders: this.getReminders(),
      caregivers: this.getCaregivers(),
      alerts: this.getAlerts(),
      auditLogs: this.getAuditLogs(),
    };
    this.addAuditLog('data_exported', 'User downloaded complete local health archive.');
    return JSON.stringify(dump, null, 2);
  },

  deleteAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.addAuditLog('data_deleted', 'All local patient health records and logs were permanently wiped.');
  },
};
