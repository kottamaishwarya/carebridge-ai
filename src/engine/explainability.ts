/**
 * Layer 4: Explainable Reasoning Engine
 *
 * Generates:
 * 1. "Why this result?" breakdown with normalized feature contributions for bar charting
 * 2. Non-diagnostic warning patterns (e.g. "possible respiratory infection pattern")
 * 3. 6th-grade plain-language explanation (accessible, calm, zero medical jargon)
 * 4. Counterfactual reasoning ("What would change this category?")
 * 5. Immediate danger red flags ("When to seek help immediately")
 */

import { ContributingFactor, ExtractedSymptom, PatientDemographics, RiskLevel } from '../types';
import { RedFlagCheckResult } from './redFlags';
import { DualRiskScoreResult } from './riskScorer';

export interface ExplainabilityOutput {
  warningPatternTitle: string;
  warningPatternDescription: string;
  plainLanguageExplanation: string;
  contributingFactors: ContributingFactor[];
  whatWouldChangeCategory: string[];
  whenToSeekHelpImmediately: string[];
}

export function generateExplanation(
  symptoms: ExtractedSymptom[],
  demographics: PatientDemographics,
  redFlagResult: RedFlagCheckResult,
  scoreResult: DualRiskScoreResult
): ExplainabilityOutput {
  const affirmative = symptoms.filter((s) => !s.isNegation);
  const { category, finalScore, chosenBy } = scoreResult;

  // 1. Identify non-diagnostic warning pattern
  let warningPatternTitle = 'General Health Warning Pattern';
  let warningPatternDescription = 'Symptoms suggest a mild systemic or localized physical reaction.';

  const hasChest = affirmative.some((s) => s.bodyArea === 'chest');
  const hasResp = affirmative.some((s) => s.bodyArea === 'respiratory');
  const hasThroat = affirmative.some((s) => s.bodyArea === 'throat');
  const hasFever = affirmative.some((s) => s.name.toLowerCase().includes('fever') || s.name.toLowerCase().includes('bukhar') || s.name.toLowerCase().includes('jwaram'));
  const hasNeuro = affirmative.some((s) => s.bodyArea === 'neurological' || s.bodyArea === 'head');
  const hasGI = affirmative.some((s) => s.bodyArea === 'abdomen');

  if (redFlagResult.triggered) {
    const rf = redFlagResult.rules[0];
    warningPatternTitle = `High Priority Warning Pattern (${rf.title})`;
    warningPatternDescription = `Deterministic clinical safety rules identified acute indicators that require immediate medical attention.`;
  } else if (hasChest) {
    warningPatternTitle = 'Cardiovascular / Thoracic Precautionary Pattern';
    warningPatternDescription = 'Symptoms involve the chest or upper torso region, requiring cautious clinical observation.';
  } else if (hasResp && hasFever) {
    warningPatternTitle = 'Possible Acute Respiratory & Febrile Pattern';
    warningPatternDescription = 'Symptoms resemble an inflammatory or infectious pattern affecting the respiratory passages alongside temperature changes.';
  } else if (hasResp) {
    warningPatternTitle = 'Possible Upper/Lower Respiratory Pattern';
    warningPatternDescription = 'Symptoms primarily cluster around breathing passages or cough reflexes.';
  } else if (hasThroat && !hasFever) {
    warningPatternTitle = 'Mild Upper Airway / Pharyngeal Irritation Pattern';
    warningPatternDescription = 'Symptoms indicate localized irritation in the throat or vocal area without acute systemic spread.';
  } else if (hasGI) {
    warningPatternTitle = 'Possible Gastrointestinal Discomfort Pattern';
    warningPatternDescription = 'Symptoms reflect abdominal sensitivity or digestive tract irritation.';
  } else if (hasNeuro) {
    warningPatternTitle = 'Cranial / Neurological Sensitivity Pattern';
    warningPatternDescription = 'Symptoms localize around the head or balance systems.';
  }

  // 2. Plain Language Explanation (6th Grade Reading Level)
  let plainLanguageExplanation = '';
  if (category === 'urgent') {
    plainLanguageExplanation =
      'Your symptoms show urgent signs that doctors take very seriously. Because fast action protects your health, we urge you to get emergency help right away. Do not wait to see if it improves on its own.';
  } else if (category === 'attention') {
    plainLanguageExplanation =
      `Based on what you shared${demographics.knownConditions.length > 0 ? ` and your personal health history (${demographics.knownConditions.join(', ')})` : ''}, your body is showing signals that need professional medical attention soon. You should schedule a visit or online consultation with a healthcare provider in the next 24 to 48 hours to get checked out.`;
  } else {
    plainLanguageExplanation =
      'Your symptoms currently appear mild and manageable with home care, proper rest, and plenty of fluids. We did not find any dangerous red flags. However, your body can change, so we will help you monitor your recovery over the next couple of days.';
  }

  // 3. Contributing factors for Bar Chart (Feature Contributions)
  const contributingFactors: ContributingFactor[] = [];

  for (const item of scoreResult.featureBreakdown) {
    let cat: ContributingFactor['category'] = 'symptom';
    if (item.name.includes('Age')) cat = 'demographic';
    else if (item.name.includes('Duration')) cat = 'duration';
    else if (item.name.includes('Comorbidity')) cat = 'comorbidity';

    contributingFactors.push({
      factor: item.name,
      category: cat,
      weight: item.impactOnScore,
      impactText: `Adds +${item.impactOnScore} pts to safety index`,
    });
  }

  // Add negations as protective factors (- points)
  const negations = symptoms.filter((s) => s.isNegation);
  for (const neg of negations) {
    contributingFactors.push({
      factor: `Absence of ${neg.name}`,
      category: 'symptom',
      weight: -12,
      impactText: 'Protective factor (reduces urgency by 12 pts)',
    });
  }

  // 4. What would change this category? (Counterfactuals)
  const whatWouldChangeCategory: string[] = [];
  if (category === 'low') {
    whatWouldChangeCategory.push('If a high fever (> 101°F / 38.3°C) develops or persists beyond 3 days.');
    whatWouldChangeCategory.push('If you experience sudden breathlessness, severe chest pain, or fainting.');
    whatWouldChangeCategory.push('If pain severity climbs above 6/10 or you cannot keep down liquids.');
  } else if (category === 'attention') {
    whatWouldChangeCategory.push('Would lower to Low: If symptoms steadily decrease within 24-48 hours with home care.');
    whatWouldChangeCategory.push('Would elevate to Urgent: If shortness of breath worsens, chest tightness starts, or you feel confused/dizzy.');
    whatWouldChangeCategory.push('Would elevate to Urgent: If high fever fails to respond to antipyretics or persists past day 4.');
  } else {
    whatWouldChangeCategory.push('Requires immediate ER evaluation first; category only steps down after complete physician clearance.');
    whatWouldChangeCategory.push('Do not delay emergency transport for self-monitoring.');
  }

  // 5. When to seek help immediately
  const whenToSeekHelpImmediately = [
    'Sudden chest pressure, squeezing, or pain spreading to the neck, jaw, back, or left arm.',
    'Sudden trouble speaking, facial droop, or weakness in one arm or leg.',
    'Severe shortness of breath where you struggle to speak in full sentences.',
    'Coughing or vomiting blood, or fainting / collapsing suddenly.',
    'Sudden confusion, extreme drowsiness, or inability to wake up.',
  ];

  return {
    warningPatternTitle,
    warningPatternDescription,
    plainLanguageExplanation,
    contributingFactors,
    whatWouldChangeCategory,
    whenToSeekHelpImmediately,
  };
}
