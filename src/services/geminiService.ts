/**
 * NLP & Risk Analysis Service
 *
 * Implements:
 * 1. PII Stripping before external network transfer
 * 2. Backend `/api/extract-symptoms` call with Gemini 3.8 Flash structured JSON schema
 * 3. Graceful offline / local regex & dictionary fallback if offline or no backend
 * 4. Pipeline event emitter for the Live Judge Pipeline Inspector drawer
 */

import { ExtractedSymptom, PatientDemographics, PipelineStageEvent, RiskAnalysisResult } from '../types';
import { extractSymptomsLocal, stripPII } from '../engine/nlpExtractor';
import { evaluateRedFlags } from '../engine/redFlags';
import { evaluateDualRisk } from '../engine/riskScorer';
import { generateExplanation } from '../engine/explainability';
import { generateFollowUpReminders, mapCareRecommendation } from '../engine/careMapper';
import { StorageService } from './storageService';

export interface ExtractionResponse {
  symptoms: ExtractedSymptom[];
  source: 'gemini_llm' | 'local_fallback';
  redactedPiiCount: number;
}

export const GeminiService = {
  /**
   * Extracts symptoms from free text or voice transcript
   */
  async extractSymptoms(rawText: string, language: 'en' | 'hi' | 'te' = 'en'): Promise<ExtractionResponse> {
    const piiResult = stripPII(rawText);
    const sanitizedText = piiResult.sanitizedText;

    if (piiResult.redactedItems.length > 0) {
      StorageService.addAuditLog(
        'pii_redacted',
        `Stripped ${piiResult.redactedItems.length} personal identifiers (${piiResult.redactedItems.map((r) => r.type).join(', ')}) before NLP processing.`
      );
    }

    try {
      const response = await fetch('/api/extract-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sanitizedText,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.symptoms) && data.symptoms.length > 0) {
          return {
            symptoms: data.symptoms,
            source: 'gemini_llm',
            redactedPiiCount: piiResult.redactedItems.length,
          };
        }
      }
    } catch {
      // Backend not running or offline; seamlessly continue with local fallback
    }

    // Local deterministic multilingual fallback
    const fallbackSymptoms = extractSymptomsLocal(sanitizedText);
    return {
      symptoms: fallbackSymptoms,
      source: 'local_fallback',
      redactedPiiCount: piiResult.redactedItems.length,
    };
  },

  /**
   * Executes the full 6-Layer Decision-Support Pipeline
   * Captures each stage's inputs/outputs for the live technical inspector
   */
  runFullPipeline(
    rawText: string,
    confirmedSymptoms: ExtractedSymptom[],
    demographics: PatientDemographics,
    onStageEvent?: (event: PipelineStageEvent) => void
  ): RiskAnalysisResult {
    const startTime = performance.now();

    // STAGE 1: Raw Intake
    onStageEvent?.({
      stage: 1,
      name: 'Intake & Context Capture',
      description: 'Capturing free text / voice input along with patient demographic multipliers',
      input: { rawText, demographics },
      output: { charCount: rawText.length, knownConditions: demographics.knownConditions },
      processingTimeMs: +(performance.now() - startTime).toFixed(1),
    });

    // STAGE 2: PII Redaction
    const tPii = performance.now();
    const piiResult = stripPII(rawText);
    onStageEvent?.({
      stage: 2,
      name: 'Client-Side Data Minimization (PII Stripping)',
      description: 'Identifies and scrubs phone numbers, emails, names, and government IDs prior to processing',
      input: rawText,
      output: {
        sanitizedText: piiResult.sanitizedText,
        redactedCount: piiResult.redactedItems.length,
        redactions: piiResult.redactedItems,
      },
      processingTimeMs: +(performance.now() - tPii).toFixed(1),
    });

    // STAGE 3: NLP Extracted Structured Entities
    const tNlp = performance.now();
    onStageEvent?.({
      stage: 3,
      name: 'NLP Entity Extraction & Negation Check',
      description: 'Maps natural language phrases to canonical symptom entities with severity, duration, and negation',
      input: piiResult.sanitizedText,
      output: confirmedSymptoms,
      processingTimeMs: +(performance.now() - tNlp).toFixed(1),
    });

    // STAGE 4: Layer 1 Deterministic Red-Flag Safety Engine
    const tRf = performance.now();
    const redFlagResult = evaluateRedFlags(confirmedSymptoms, rawText, demographics);
    onStageEvent?.({
      stage: 4,
      name: 'Deterministic Red-Flag Safety Engine (Layer 1)',
      description: 'Auditable rule evaluation that unconditionally overrides risk to Urgent if acute danger signs trigger',
      input: { symptoms: confirmedSymptoms.map((s) => s.name), rawText },
      output: {
        triggered: redFlagResult.triggered,
        triggeredRules: redFlagResult.rules.map((r) => `${r.id}: ${r.title}`),
        reasons: redFlagResult.reasons,
      },
      processingTimeMs: +(performance.now() - tRf).toFixed(1),
      isRedFlagTriggered: redFlagResult.triggered,
    });

    // STAGE 5: Layer 3 Dual Risk Scorer (Deterministic Rule + Statistical ML Classifier)
    const tScore = performance.now();
    const scoreResult = evaluateDualRisk(confirmedSymptoms, demographics, redFlagResult);
    onStageEvent?.({
      stage: 5,
      name: 'Dual Scoring Engine: Clinical Rules vs Logistic Regression ML (Layer 3)',
      description: 'Evaluates severity curves alongside synthetic ML model, selecting the more cautious outcome (Safety-First)',
      input: { symptomCount: confirmedSymptoms.length, age: demographics.age, conditions: demographics.knownConditions },
      output: {
        ruleScore: scoreResult.ruleScore,
        mlScore: scoreResult.mlScore,
        finalScore: scoreResult.finalScore,
        resolvedCategory: scoreResult.category,
        chosenBy: scoreResult.chosenBy,
        probabilities: scoreResult.mlProbabilities,
      },
      processingTimeMs: +(performance.now() - tScore).toFixed(1),
    });

    // STAGE 6: Layer 4 & 5 Explainability, Care Mapping, and Reminders
    const tExplain = performance.now();
    const explanation = generateExplanation(confirmedSymptoms, demographics, redFlagResult, scoreResult);
    const careRecommendation = mapCareRecommendation(scoreResult.category, confirmedSymptoms, demographics);

    onStageEvent?.({
      stage: 6,
      name: 'Explainability & Care Navigation Synthesis (Layer 4 & 5)',
      description: 'Generates non-diagnostic warning pattern, 6th-grade explanation, care level, and follow-up timeline',
      input: { category: scoreResult.category },
      output: {
        warningPattern: explanation.warningPatternTitle,
        careLevel: careRecommendation.level,
        urgencyTimeline: careRecommendation.urgencyTimeline,
        contributingFactorsCount: explanation.contributingFactors.length,
      },
      processingTimeMs: +(performance.now() - tExplain).toFixed(1),
    });

    return {
      riskLevel: scoreResult.category,
      ruleScore: scoreResult.ruleScore,
      mlScore: scoreResult.mlScore,
      finalScore: scoreResult.finalScore,
      confidence: scoreResult.confidence,
      redFlagsTriggered: redFlagResult.rules,
      contributingFactors: explanation.contributingFactors,
      warningPatternTitle: explanation.warningPatternTitle,
      warningPatternDescription: explanation.warningPatternDescription,
      plainLanguageExplanation: explanation.plainLanguageExplanation,
      whatWouldChangeCategory: explanation.whatWouldChangeCategory,
      careRecommendation,
      whenToSeekHelpImmediately: explanation.whenToSeekHelpImmediately,
      timestamp: new Date().toISOString(),
    };
  },
};
