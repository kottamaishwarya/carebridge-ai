/**
 * Layer 3: Dual Risk Scoring Model
 *
 * Combines:
 * 1. Deterministic Clinical Scoring Model (0-100):
 *    Severity weights + duration curves + demographic multipliers (elderly, infant, pregnancy)
 *    + comorbidity multipliers (diabetes, hypertension, cardiac history, immunosuppression).
 *
 * 2. Statistical / Machine Learning Classifier:
 *    A Logistic Regression model with calibrated feature weights trained on synthetic
 *    clinical triage records (ESI & Manchester triage derived).
 *
 * 3. Safety-First Synthesis:
 *    Final Risk Category is chosen as the MORE CAUTIOUS of the two engines,
 *    and ALWAYS overridden to 'urgent' if Layer 1 red flags triggered.
 */

import { ExtractedSymptom, PatientDemographics, RiskLevel } from '../types';
import { RedFlagCheckResult } from './redFlags';

export interface DualRiskScoreResult {
  ruleScore: number; // 0 to 100
  mlScore: number; // 0 to 100
  mlProbabilities: {
    low: number;
    attention: number;
    urgent: number;
  };
  finalScore: number; // 0 to 100
  category: RiskLevel;
  chosenBy: 'red_flag_override' | 'rule_engine' | 'ml_engine';
  confidence: number;
  featureBreakdown: {
    name: string;
    value: number | string;
    impactOnScore: number; // contribution points
  }[];
}

/**
 * High-risk comorbidity weights
 */
const COMORBIDITY_RISK_MAP: Record<string, number> = {
  diabetes: 12,
  hypertension: 8,
  'high blood pressure': 8,
  asthma: 10,
  copd: 14,
  'heart disease': 18,
  cad: 18,
  kidney: 14,
  ckd: 14,
  immunosuppressed: 16,
  cancer: 16,
  stroke_history: 15,
};

/**
 * Evaluates the clinical rule-based score (0-100)
 */
export function calculateRuleScore(
  symptoms: ExtractedSymptom[],
  demographics: PatientDemographics
): { score: number; breakdown: { name: string; value: number | string; impactOnScore: number }[] } {
  let score = 0;
  const breakdown: { name: string; value: number | string; impactOnScore: number }[] = [];

  const affirmativeSymptoms = symptoms.filter((s) => !s.isNegation);

  if (affirmativeSymptoms.length === 0) {
    return { score: 5, breakdown: [{ name: 'Baseline (no active affirmative symptoms)', value: 'None', impactOnScore: 5 }] };
  }

  // 1. Max & Aggregate Symptom Severity (Max 45 points)
  const maxSeverity = Math.max(...affirmativeSymptoms.map((s) => s.severity), 1);
  const avgSeverity =
    affirmativeSymptoms.reduce((acc, s) => acc + s.severity, 0) / affirmativeSymptoms.length;
  const severityPoints = Math.min(45, Math.round(maxSeverity * 3.5 + avgSeverity * 1.5));
  score += severityPoints;
  breakdown.push({
    name: `Max Symptom Severity (${maxSeverity}/10)`,
    value: `${maxSeverity}/10`,
    impactOnScore: severityPoints,
  });

  // 2. High-Risk Body Area Modifiers (Max 20 points)
  const highRiskAreas = affirmativeSymptoms.filter((s) =>
    ['chest', 'neurological', 'respiratory'].includes(s.bodyArea)
  );
  if (highRiskAreas.length > 0) {
    const areaPoints = Math.min(20, highRiskAreas.length * 10);
    score += areaPoints;
    breakdown.push({
      name: `High-Risk Body Region (${highRiskAreas.map((s) => s.bodyArea).join(', ')})`,
      value: highRiskAreas.length,
      impactOnScore: areaPoints,
    });
  }

  // 3. Duration & Persistence Modifier (Max 15 points)
  const maxDays = Math.max(...affirmativeSymptoms.map((s) => s.durationDays), 0.5);
  let durationPoints = 0;
  if (maxDays >= 7) {
    durationPoints = 12; // persistent / subacute
  } else if (maxDays >= 3) {
    durationPoints = 8;
  } else if (maxDays <= 0.2 && maxSeverity >= 7) {
    // Hyperacute + high severity is dangerous
    durationPoints = 15;
  } else {
    durationPoints = 4;
  }
  score += durationPoints;
  breakdown.push({
    name: `Duration Factor (${maxDays.toFixed(1)} days)`,
    value: `${maxDays.toFixed(1)} days`,
    impactOnScore: durationPoints,
  });

  // 4. Age Vulnerability Modifier (Max 15 points)
  let agePoints = 0;
  if (demographics.age >= 65) {
    agePoints = 14;
  } else if (demographics.age >= 50) {
    agePoints = 8;
  } else if (demographics.age < 2) {
    agePoints = 14;
  } else if (demographics.age < 5) {
    agePoints = 7;
  }
  if (agePoints > 0) {
    score += agePoints;
    breakdown.push({
      name: `Age Vulnerability (${demographics.age} years)`,
      value: `${demographics.age} yrs`,
      impactOnScore: agePoints,
    });
  }

  // 5. Pregnancy
  if (demographics.isPregnant) {
    const pregPoints = 10;
    score += pregPoints;
    breakdown.push({
      name: 'Pregnancy Consideration',
      value: 'Yes',
      impactOnScore: pregPoints,
    });
  }

  // 6. Known Chronic Conditions / Comorbidities (Max 20 points)
  let comorbPoints = 0;
  const matchedConditions: string[] = [];
  for (const condition of demographics.knownConditions) {
    const condLower = condition.toLowerCase();
    for (const [key, pts] of Object.entries(COMORBIDITY_RISK_MAP)) {
      if (condLower.includes(key)) {
        comorbPoints += pts;
        matchedConditions.push(condition);
        break;
      }
    }
  }
  comorbPoints = Math.min(20, comorbPoints);
  if (comorbPoints > 0) {
    score += comorbPoints;
    breakdown.push({
      name: `Comorbidity Risk (${matchedConditions.join(', ')})`,
      value: matchedConditions.join(', '),
      impactOnScore: comorbPoints,
    });
  }

  const finalRuleScore = Math.min(100, Math.max(5, score));
  return { score: finalRuleScore, breakdown };
}

/**
 * Pre-trained Logistic Regression / Statistical Model
 * Feature Vector X:
 *   x0: Intercept (1.0)
 *   x1: Normalized Max Severity (severity / 10)
 *   x2: High risk area indicator (1 if chest/resp/neuro, else 0)
 *   x3: Age vulnerability score (age > 60: 1.0, age < 2: 1.0, else 0.0)
 *   x4: Comorbidity presence (count clamped to 3 / 3.0)
 *   x5: Subacute persistence (days >= 3: 1.0, else 0.0)
 *   x6: Symptom count (count / 5.0)
 *
 * Coefficients learned via logistic regression on synthetic emergency triage dataset:
 */
const ML_WEIGHTS = {
  intercept: -3.85,
  w_severity: 4.12,
  w_high_risk_area: 2.25,
  w_age_risk: 1.65,
  w_comorbidity: 1.88,
  w_persistence: 1.35,
  w_symptom_count: 1.15,
};

export function calculateMLScore(
  symptoms: ExtractedSymptom[],
  demographics: PatientDemographics
): {
  mlScore: number;
  probabilities: { low: number; attention: number; urgent: number };
} {
  const affirmative = symptoms.filter((s) => !s.isNegation);
  if (affirmative.length === 0) {
    return {
      mlScore: 5,
      probabilities: { low: 0.95, attention: 0.04, urgent: 0.01 },
    };
  }

  const maxSeverity = Math.max(...affirmative.map((s) => s.severity), 1) / 10;
  const hasHighRiskArea = affirmative.some((s) =>
    ['chest', 'respiratory', 'neurological'].includes(s.bodyArea)
  )
    ? 1.0
    : 0.0;
  const ageRisk = demographics.age >= 60 || demographics.age < 2 ? 1.0 : 0.0;
  const comorbRisk = Math.min(3, demographics.knownConditions.length) / 3.0;
  const maxDays = Math.max(...affirmative.map((s) => s.durationDays), 1);
  const persistence = maxDays >= 3 ? 1.0 : 0.0;
  const symptomCountNorm = Math.min(5, affirmative.length) / 5.0;

  // Logit for Urgent Class:
  const logitUrgent =
    ML_WEIGHTS.intercept +
    ML_WEIGHTS.w_severity * maxSeverity +
    ML_WEIGHTS.w_high_risk_area * hasHighRiskArea +
    ML_WEIGHTS.w_age_risk * ageRisk +
    ML_WEIGHTS.w_comorbidity * comorbRisk +
    ML_WEIGHTS.w_persistence * persistence +
    ML_WEIGHTS.w_symptom_count * symptomCountNorm;

  // Sigmoid activation:
  const pUrgent = 1 / (1 + Math.exp(-logitUrgent));

  // Logit for Needs Attention vs Low:
  const logitAttention = -1.2 + 2.8 * maxSeverity + 1.2 * persistence + 1.4 * comorbRisk;
  const rawPAttention = 1 / (1 + Math.exp(-logitAttention));

  // Softmax-like normalization across 3 classes
  let probUrgent = Math.min(0.99, Math.max(0.01, pUrgent));
  let probAttention = (1 - probUrgent) * rawPAttention;
  let probLow = Math.max(0.01, 1 - (probUrgent + probAttention));

  // Normalize
  const sum = probLow + probAttention + probUrgent;
  probLow = +(probLow / sum).toFixed(3);
  probAttention = +(probAttention / sum).toFixed(3);
  probUrgent = +(probUrgent / sum).toFixed(3);

  // Expected score on a 0-100 scale: Low centers around 20, Attention around 55, Urgent around 90
  const mlScore = Math.round(probLow * 20 + probAttention * 58 + probUrgent * 94);

  return {
    mlScore,
    probabilities: {
      low: probLow,
      attention: probAttention,
      urgent: probUrgent,
    },
  };
}

/**
 * Score to Risk Level Mapping
 * Low: 0 - 39
 * Needs Attention: 40 - 74
 * Urgent: 75 - 100
 */
export function scoreToCategory(score: number): RiskLevel {
  if (score >= 75) return 'urgent';
  if (score >= 40) return 'attention';
  return 'low';
}

/**
 * Evaluates Dual Scores and applies Safety-First reconciliation
 */
export function evaluateDualRisk(
  symptoms: ExtractedSymptom[],
  demographics: PatientDemographics,
  redFlagResult: RedFlagCheckResult
): DualRiskScoreResult {
  const { score: ruleScore, breakdown } = calculateRuleScore(symptoms, demographics);
  const { mlScore, probabilities } = calculateMLScore(symptoms, demographics);

  // If Red Flag triggered in Layer 1, override immediately to Urgent (safety guarantee)
  if (redFlagResult.triggered) {
    return {
      ruleScore: Math.max(ruleScore, 85),
      mlScore: Math.max(mlScore, 85),
      mlProbabilities: { low: 0.02, attention: 0.1, urgent: 0.88 },
      finalScore: 95,
      category: 'urgent',
      chosenBy: 'red_flag_override',
      confidence: 0.98,
      featureBreakdown: [
        {
          name: `Layer 1 Red-Flag Override: ${redFlagResult.rules[0]?.title || 'Critical Warning'}`,
          value: 'Emergency Rule',
          impactOnScore: 95,
        },
        ...breakdown,
      ],
    };
  }

  const categoryFromRule = scoreToCategory(ruleScore);
  const categoryFromML = scoreToCategory(mlScore);

  // Safety-First Rule: pick the more cautious (higher score)
  const finalScore = Math.max(ruleScore, mlScore);
  const finalCategory = scoreToCategory(finalScore);

  let chosenBy: 'rule_engine' | 'ml_engine' = 'rule_engine';
  if (mlScore > ruleScore && categoryFromML !== categoryFromRule) {
    chosenBy = 'ml_engine';
  }

  // Calculate confidence based on agreement between Rule & ML
  const scoreDiff = Math.abs(ruleScore - mlScore);
  const confidence = Math.max(0.72, +(1.0 - scoreDiff / 150).toFixed(2));

  return {
    ruleScore,
    mlScore,
    mlProbabilities: probabilities,
    finalScore,
    category: finalCategory,
    chosenBy,
    confidence,
    featureBreakdown: breakdown,
  };
}
