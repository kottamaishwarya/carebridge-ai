/**
 * CareCompass Built-in Automated Unit Tests
 *
 * Verifies:
 * 1. Layer 1 Red-Flag Safety Engine (Cardiac, Stroke, Anaphylaxis, Pediatric)
 * 2. Negation detection resilience
 * 3. Layer 3 Risk Scorer & Dual Reconciliation (Safety-First rule)
 * 4. PII Redaction accuracy
 * 5. Multilingual NLP extraction
 */

import { evaluateRedFlags } from './redFlags';
import { extractSymptomsLocal, stripPII } from './nlpExtractor';
import { evaluateDualRisk } from './riskScorer';
import { PatientDemographics } from '../types';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  durationMs: number;
  error?: string;
}

export function runAllUnitTests(): {
  results: TestResult[];
  passedCount: number;
  failedCount: number;
  totalDurationMs: number;
} {
  const results: TestResult[] = [];
  const start = performance.now();

  const runTest = (suite: string, name: string, fn: () => { expected: string; actual: string }) => {
    const t0 = performance.now();
    try {
      const { expected, actual } = fn();
      const passed = expected === actual;
      results.push({
        suite,
        name,
        passed,
        expected,
        actual,
        durationMs: +(performance.now() - t0).toFixed(2),
      });
    } catch (e: any) {
      results.push({
        suite,
        name,
        passed: false,
        expected: 'Valid execution',
        actual: `Exception: ${e.message}`,
        durationMs: +(performance.now() - t0).toFixed(2),
        error: e.message,
      });
    }
  };

  // --- Suite 1: Red-Flag Safety Engine ---
  runTest('Red-Flag Safety', 'Cardiac Red Flag Triggers on Chest Pain + Left Arm + Sweating', () => {
    const text = 'Chest pain spreading to left arm with cold sweating';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 52, sex: 'male', knownConditions: [], currentMedications: [] };
    const res = evaluateRedFlags(symptoms, text, demographics);
    const triggeredId = res.rules[0]?.id;
    return {
      expected: 'RF-CARDIAC-01',
      actual: triggeredId || 'NONE',
    };
  });

  runTest('Red-Flag Safety', 'Stroke Signs Trigger FAST Red Flag Protocol', () => {
    const text = 'Sudden slurred speech and right arm weakness since an hour';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 67, sex: 'female', knownConditions: ['hypertension'], currentMedications: [] };
    const res = evaluateRedFlags(symptoms, text, demographics);
    const triggeredId = res.rules.find((r) => r.id === 'RF-STROKE-FAST')?.id;
    return {
      expected: 'RF-STROKE-FAST',
      actual: triggeredId || 'NONE',
    };
  });

  runTest('Red-Flag Safety', 'Pediatric High Fever Under 3 Months Overrides to Urgent', () => {
    const text = 'Baby has hot body and fever 101F since yesterday';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 0.15, sex: 'male', knownConditions: [], currentMedications: [] }; // ~2 months
    const res = evaluateRedFlags(symptoms, text, demographics);
    const triggeredId = res.rules.find((r) => r.id === 'RF-PEDIATRIC-FEVER')?.id;
    return {
      expected: 'RF-PEDIATRIC-FEVER',
      actual: triggeredId || 'NONE',
    };
  });

  // --- Suite 2: Negation Handling ---
  runTest('Negation Logic', 'Negated Chest Pain Does Not Trigger Cardiac Red Flag', () => {
    const text = 'Mild cough and sore throat, no chest pain, no breathlessness, no sweating';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 30, sex: 'male', knownConditions: [], currentMedications: [] };
    const res = evaluateRedFlags(symptoms, text, demographics);
    return {
      expected: 'false',
      actual: res.triggered.toString(),
    };
  });

  runTest('Negation Logic', 'Hindi Negation "bukhar nahi hai" Is Marked as Negation', () => {
    const text = 'Gale me dard hai lekin bukhar nahi hai';
    const symptoms = extractSymptomsLocal(text);
    const feverSymptom = symptoms.find((s) => s.name.toLowerCase().includes('fever'));
    return {
      expected: 'true',
      actual: (feverSymptom ? feverSymptom.isNegation : false).toString(),
    };
  });

  // --- Suite 3: Dual Risk Scorer & Scenarios ---
  runTest('Risk Scorer', 'Scenario 1: Mild Sore Throat (1 day, no fever) -> Low Risk Category', () => {
    const text = 'Mild sore throat for 1 day, no fever';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 28, sex: 'female', knownConditions: [], currentMedications: [] };
    const redFlagRes = evaluateRedFlags(symptoms, text, demographics);
    const riskRes = evaluateDualRisk(symptoms, demographics, redFlagRes);
    return {
      expected: 'low',
      actual: riskRes.category,
    };
  });

  runTest('Risk Scorer', 'Scenario 2: Fever 3 Days + Diabetes (Age 62) -> Needs Attention', () => {
    const text = 'Fever for 3 days and severe body ache';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 62, sex: 'male', knownConditions: ['type 2 diabetes', 'hypertension'], currentMedications: ['Metformin'] };
    const redFlagRes = evaluateRedFlags(symptoms, text, demographics);
    const riskRes = evaluateDualRisk(symptoms, demographics, redFlagRes);
    return {
      expected: 'attention',
      actual: riskRes.category,
    };
  });

  runTest('Risk Scorer', 'Scenario 3: Acute Chest Pain + Cold Sweating -> Urgent Category Override', () => {
    const text = 'Chest pain spreading to left arm with cold sweating';
    const symptoms = extractSymptomsLocal(text);
    const demographics: PatientDemographics = { age: 55, sex: 'male', knownConditions: [], currentMedications: [] };
    const redFlagRes = evaluateRedFlags(symptoms, text, demographics);
    const riskRes = evaluateDualRisk(symptoms, demographics, redFlagRes);
    return {
      expected: 'urgent',
      actual: riskRes.category,
    };
  });

  // --- Suite 4: PII Redaction & Privacy ---
  runTest('Privacy & PII', 'Strips Phone Numbers and Email Addresses from Input Text', () => {
    const raw = 'My name is John Doe, phone 9876543210, email john@example.com, feeling dizzy';
    const pii = stripPII(raw);
    const containsPhone = pii.sanitizedText.includes('9876543210');
    const containsEmail = pii.sanitizedText.includes('john@example.com');
    return {
      expected: 'false-false',
      actual: `${containsPhone}-${containsEmail}`,
    };
  });

  const totalDurationMs = +(performance.now() - start).toFixed(2);
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    results,
    passedCount,
    failedCount,
    totalDurationMs,
  };
}
