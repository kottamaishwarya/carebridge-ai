/**
 * Layer 1: Rule-based RED-FLAG SAFETY ENGINE
 *
 * Deterministic, auditable safety engine that runs before any statistical or ML classification.
 * If any critical red flag triggers, it immediately overrides the outcome to 'urgent'
 * and outputs mandatory emergency protocols.
 */

import { ExtractedSymptom, PatientDemographics, RedFlagRule } from '../types';

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: 'RF-CARDIAC-01',
    title: 'Possible Acute Coronary / Cardiac Warning',
    description: 'Chest tightness/pain associated with breathlessness, radiation to arm/neck/jaw, or sudden cold sweats.',
    category: 'cardiac',
    severityOverride: 'urgent',
    emergencyActionText: 'Call emergency ambulance (112 or 108) immediately. Rest calmly in a seated position; do not drive yourself.',
  },
  {
    id: 'RF-STROKE-FAST',
    title: 'Suspected Acute Stroke Signs (FAST Protocol)',
    description: 'Sudden facial droop, arm weakness or numbness, slurred speech, or acute loss of balance.',
    category: 'stroke',
    severityOverride: 'urgent',
    emergencyActionText: 'Immediate hospital transfer needed. Note the exact time symptoms started for acute stroke intervention.',
  },
  {
    id: 'RF-RESPIRATORY-01',
    title: 'Severe Respiratory Distress / Stridor',
    description: 'Severe difficulty breathing, inability to speak full sentences, blue lips/fingertips (cyanosis), or audible stridor.',
    category: 'respiratory',
    severityOverride: 'urgent',
    emergencyActionText: 'Call 112/108 immediately. Sit upright and loosen tight clothing around the neck and chest.',
  },
  {
    id: 'RF-ANAPHYLAXIS',
    title: 'Suspected Severe Allergic Reaction / Anaphylaxis',
    description: 'Sudden tongue/throat swelling, severe wheezing, hives spreading rapidly, or dizziness following insect sting, medication, or food intake.',
    category: 'anaphylaxis',
    severityOverride: 'urgent',
    emergencyActionText: 'Administer Epinephrine auto-injector if prescribed and available. Call 112/108 immediately.',
  },
  {
    id: 'RF-BLEEDING-SHOCK',
    title: 'Severe Uncontrolled Bleeding or Signs of Circulatory Shock',
    description: 'Rapid blood loss, coughing up significant blood, vomiting coffee-ground blood, or fainting with extreme pale/clammy skin.',
    category: 'trauma',
    severityOverride: 'urgent',
    emergencyActionText: 'Apply direct firm pressure with clean cloth. Elevate legs if fainting unless head/spine trauma suspected.',
  },
  {
    id: 'RF-PEDIATRIC-FEVER',
    title: 'Infant / Neonatal High Fever Warning',
    description: 'Fever (>= 38°C / 100.4°F) in an infant under 3 months of age, or lethargy/refusal to feed in baby.',
    category: 'pediatric',
    severityOverride: 'urgent',
    emergencyActionText: 'Seek immediate pediatric emergency or hospital care. Newborn fevers require urgent evaluation.',
  },
  {
    id: 'RF-SEPSIS',
    title: 'Suspected Sepsis / Severe Infection Warning',
    description: 'High fever or very low body temperature with confusion, extreme shivering, fast heartbeat, and mottling or rash.',
    category: 'sepsis',
    severityOverride: 'urgent',
    emergencyActionText: 'Emergency evaluation required immediately to rule out severe systemic infection.',
  },
  {
    id: 'RF-PSYCHIATRIC-CRISIS',
    title: 'Acute Crisis / Harm Warning',
    description: 'Severe thoughts of self-harm, suicide, or inability to keep oneself safe.',
    category: 'psychiatric',
    severityOverride: 'urgent',
    emergencyActionText: 'Contact emergency helpline (112) or National Tele-MANAS mental health helpline (14416) immediately.',
  },
];

export interface RedFlagCheckResult {
  triggered: boolean;
  rules: RedFlagRule[];
  reasons: string[];
  auditLog: string[];
}

/**
 * Evaluates symptoms and free text against deterministic red flag safety rules.
 * Supports multilingual cues (English, Hindi, Telugu, and transliterations).
 */
export function evaluateRedFlags(
  symptoms: ExtractedSymptom[],
  rawText: string,
  demographics: PatientDemographics
): RedFlagCheckResult {
  const triggeredRules: RedFlagRule[] = [];
  const reasons: string[] = [];
  const auditLog: string[] = [];

  const lowerText = rawText.toLowerCase();

  // Helper to check affirmative symptom presence
  const hasAffirmativeSymptom = (keywords: string[]) => {
    // Check extracted symptoms
    const foundInSymptoms = symptoms.some(
      (s) => !s.isNegation && keywords.some((kw) => s.name.toLowerCase().includes(kw))
    );
    if (foundInSymptoms) return true;

    // Check raw text with negation protection
    return keywords.some((kw) => {
      const idx = lowerText.indexOf(kw);
      if (idx === -1) return false;
      // Negation lookbehind in English, Hindi, Telugu
      const prefix = lowerText.substring(Math.max(0, idx - 20), idx);
      const suffix = lowerText.substring(idx + kw.length, Math.min(lowerText.length, idx + kw.length + 20));
      const hasNegation =
        /\b(no|not|without|denies|neither|never|nahi|nahin|ledhu|ledu)\b/.test(prefix) ||
        /\b(nahi|nahin|ledhu|ledu)\b/.test(suffix);
      return !hasNegation;
    });
  };

  auditLog.push(`[Layer 1 Rule Check Initiated] Evaluating ${symptoms.length} symptoms and text length ${rawText.length}`);

  // 1. CARDIAC RED FLAG
  const cardiacChestPain = hasAffirmativeSymptom([
    'chest pain',
    'chest tightness',
    'chest pressure',
    'chhati me dard',
    'seene me dard',
    'chathi noppi',
    'gunde noppi',
    'substernal',
    'angina',
    'heaviness in chest',
  ]);
  const cardiacAssociated = hasAffirmativeSymptom([
    'left arm',
    'arm pain',
    'jaw pain',
    'neck pain',
    'sweating',
    'cold sweat',
    'breathlessness',
    'shortness of breath',
    'dizzy',
    'dizziness',
    'lightheaded',
    'pasina',
    'ghamandalu',
    'aayasam',
  ]);

  if (cardiacChestPain && cardiacAssociated) {
    const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-CARDIAC-01')!;
    triggeredRules.push(rule);
    reasons.push('Co-occurrence of chest pain/tightness with radiation or autonomic symptoms (sweating/breathlessness/dizziness).');
    auditLog.push(`TRIGGERED: ${rule.id} - Chest symptoms + autonomic/radiation signs detected`);
  }

  // 2. STROKE FAST RED FLAG
  const strokeKeywords = hasAffirmativeSymptom([
    'facial droop',
    'face drooping',
    'slurred speech',
    'speech slurred',
    'arm weakness',
    'leg weakness',
    'one side weak',
    'one side numb',
    'sudden loss of vision',
    'loss of balance',
    'bolne me dikkat',
    'muh tedha',
    'lakwa',
    'pakshavatham',
  ]);

  if (strokeKeywords) {
    const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-STROKE-FAST')!;
    triggeredRules.push(rule);
    reasons.push('Acute neurological deficit consistent with FAST stroke warning indicators.');
    auditLog.push(`TRIGGERED: ${rule.id} - FAST stroke sign detected`);
  }

  // 3. RESPIRATORY SEVERE RED FLAG
  const severeRespiratory = hasAffirmativeSymptom([
    'gasping for air',
    'cannot breathe',
    'unable to speak',
    'blue lips',
    'blue fingers',
    'stridor',
    'suffocating',
    'saans lene me bahut takleef',
    'oopiri aadatledu',
  ]);

  if (severeRespiratory) {
    const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-RESPIRATORY-01')!;
    triggeredRules.push(rule);
    reasons.push('Severe acute respiratory distress compromising ventilation.');
    auditLog.push(`TRIGGERED: ${rule.id} - Acute respiratory distress detected`);
  }

  // 4. ANAPHYLAXIS RED FLAG
  const throatSwelling = hasAffirmativeSymptom([
    'throat swelling',
    'tongue swelling',
    'swollen tongue',
    'throat closing',
    'difficulty swallowing with hives',
    'anaphylaxis',
    'gale me sujan',
    'gonthu vachadam',
  ]);

  if (throatSwelling) {
    const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-ANAPHYLAXIS')!;
    triggeredRules.push(rule);
    reasons.push('Rapid airway compromise or acute angioedema / anaphylaxis warning signs.');
    auditLog.push(`TRIGGERED: ${rule.id} - Anaphylaxis / Airway swelling detected`);
  }

  // 5. SEVERE BLEEDING / HEMORRHAGE
  const severeBleeding = hasAffirmativeSymptom([
    'severe bleeding',
    'coughing blood',
    'vomiting blood',
    'blood in vomit',
    'black tarry stool',
    'khoon ki ulti',
    'raktham kakkadam',
  ]);

  if (severeBleeding) {
    const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-BLEEDING-SHOCK')!;
    triggeredRules.push(rule);
    reasons.push('Significant acute hemorrhage requiring urgent stabilization.');
    auditLog.push(`TRIGGERED: ${rule.id} - Acute hemorrhage signs`);
  }

  // 6. PEDIATRIC HIGH FEVER RED FLAG
  if (demographics.age > 0 && demographics.age < 0.25) {
    // Under 3 months
    const hasFever = hasAffirmativeSymptom(['fever', 'high fever', 'bukhar', 'jwaram', 'hot body', 'temperature']);
    if (hasFever) {
      const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-PEDIATRIC-FEVER')!;
      triggeredRules.push(rule);
      reasons.push('Fever in an infant under 3 months is a clinical red flag requiring urgent evaluation.');
      auditLog.push(`TRIGGERED: ${rule.id} - Age < 3 months with fever`);
    }
  }

  // 7. PSYCHIATRIC CRISIS
  const psychiatricCrisis = hasAffirmativeSymptom([
    'suicide',
    'suicidal',
    'kill myself',
    'end my life',
    'self harm',
    'atmahatya',
  ]);

  if (psychiatricCrisis) {
    const rule = RED_FLAG_RULES.find((r) => r.id === 'RF-PSYCHIATRIC-CRISIS')!;
    triggeredRules.push(rule);
    reasons.push('Acute psychiatric distress / crisis markers requiring immediate compassionate intervention.');
    auditLog.push(`TRIGGERED: ${rule.id} - Crisis markers identified`);
  }

  const triggered = triggeredRules.length > 0;
  auditLog.push(`[Layer 1 Complete] Result: ${triggered ? 'RED FLAGS DETECTED' : 'CLEAR - Proceed to Layer 2 & 3'}`);

  return {
    triggered,
    rules: triggeredRules,
    reasons,
    auditLog,
  };
}
