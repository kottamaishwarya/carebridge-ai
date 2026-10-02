import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Layers,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { BodyArea, ExtractedSymptom, PatientDemographics, PipelineStageEvent, RiskAnalysisResult } from '../types';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { BodyMap } from '../components/BodyMap';
import { AudioService } from '../services/audioService';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface SymptomCheckerWizardProps {
  lang: SupportedLanguage;
  initialDemographics?: PatientDemographics;
  initialText?: string;
  onCompleteAssessment: (result: RiskAnalysisResult, symptoms: ExtractedSymptom[], demographics: PatientDemographics, rawText: string) => void;
  onCancel: () => void;
  onStageEvent?: (event: PipelineStageEvent) => void;
}

const COMMON_CONDITIONS = [
  'Hypertension (High BP)',
  'Type 2 Diabetes',
  'Asthma / Chronic Bronchitis',
  'Heart Disease / CAD',
  'Chronic Kidney Disease',
  'Migraine',
  'Thyroid Disorder',
  'None',
];

export const SymptomCheckerWizard: React.FC<SymptomCheckerWizardProps> = ({
  lang,
  initialDemographics,
  initialText = '',
  onCompleteAssessment,
  onCancel,
  onStageEvent,
}) => {
  const t = TRANSLATIONS[lang];

  // Wizard Step: 1 = Demographics, 2 = Intake (Text/Voice/BodyMap), 3 = Structured Review & Adaptive Questions, 4 = Analyzing
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Demographics state
  const [demographics, setDemographics] = useState<PatientDemographics>(() => {
    return (
      initialDemographics || {
        age: 35,
        sex: 'female',
        isPregnant: false,
        knownConditions: [],
        currentMedications: [],
      }
    );
  });

  // Intake text state
  const [rawText, setRawText] = useState(initialText);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Body map selected area
  const [selectedBodyArea, setSelectedBodyArea] = useState<BodyArea | null>(null);

  // Extracted symptoms chips
  const [symptoms, setSymptoms] = useState<ExtractedSymptom[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSource, setExtractionSource] = useState<'gemini_llm' | 'local_fallback'>('local_fallback');

  // Adaptive follow-up answers
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Record<string, string>>({});

  // Medication input temp
  const [medInput, setMedInput] = useState('');

  // Start speech recognition
  const toggleSpeech = () => {
    if (isListening) {
      speechRecognizer?.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      const recognizer = AudioService.createRecognizer(
        lang,
        (transcript) => {
          setRawText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        (err) => {
          setSpeechError(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      if (recognizer.isSupported) {
        setSpeechRecognizer(recognizer);
        recognizer.start();
        setIsListening(true);
      } else {
        setSpeechError('Microphone speech input is not supported on this browser.');
      }
    }
  };

  // When body area is clicked in Step 2, provide quick suggestions
  const handleBodyAreaSelect = (area: BodyArea) => {
    setSelectedBodyArea(area);
    const areaKeywords: Record<BodyArea, string> = {
      head: 'Headache or dizziness',
      throat: 'Sore throat or pain when swallowing',
      chest: 'Chest tightness or discomfort',
      respiratory: 'Shortness of breath or persistent cough',
      abdomen: 'Abdominal pain or nausea',
      back: 'Lower back stiffness or ache',
      limbs: 'Limb weakness or joint pain',
      skin: 'Skin rash or itching',
      systemic: 'Fever, fatigue, or body ache',
      neurological: 'Dizziness or tingling sensation',
      other: 'Generalized discomfort',
    };
    const suggestion = areaKeywords[area];
    if (suggestion && !rawText.toLowerCase().includes(suggestion.toLowerCase())) {
      setRawText((prev) => (prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion));
    }
  };

  // Proceed to Step 3 (NLP Extraction)
  const handleExtractAndReview = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setStep(3);

    try {
      const response = await GeminiService.extractSymptoms(rawText, lang);
      setSymptoms(response.symptoms);
      setExtractionSource(response.source);
    } catch {
      // Handled via local fallback in GeminiService
    } finally {
      setIsExtracting(false);
    }
  };

  // Add custom symptom chip manually
  const handleAddSymptomChip = () => {
    const newChip: ExtractedSymptom = {
      id: `custom-${Date.now()}`,
      name: 'New Symptom',
      duration: '1-2 days',
      durationDays: 1.5,
      severity: 5,
      bodyArea: selectedBodyArea || 'systemic',
      isNegation: false,
      confidence: 1.0,
    };
    setSymptoms((prev) => [...prev, newChip]);
  };

  // Delete symptom chip
  const handleDeleteSymptom = (id: string) => {
    setSymptoms((prev) => prev.filter((s) => s.id !== id));
  };

  // Update symptom property
  const handleUpdateSymptom = (id: string, updates: Partial<ExtractedSymptom>) => {
    setSymptoms((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Run final pipeline
  const handleRunFullAssessment = () => {
    setStep(4);
    setTimeout(() => {
      const finalResult = GeminiService.runFullPipeline(
        rawText,
        symptoms,
        demographics,
        onStageEvent
      );
      onCompleteAssessment(finalResult, symptoms, demographics, rawText);
    }, 700);
  };

  // Dynamic adaptive follow-up questions based on extracted symptoms
  const getAdaptiveQuestions = () => {
    const questions: { id: string; prompt: string; options: string[] }[] = [];
    const names = symptoms.filter((s) => !s.isNegation).map((s) => s.name.toLowerCase());

    if (names.some((n) => n.includes('chest') || n.includes('pain') || n.includes('tightness'))) {
      questions.push({
        id: 'q-chest-radiate',
        prompt: 'Does the chest discomfort radiate to your left arm, shoulder, neck, or jaw?',
        options: ['No radiation', 'Yes, to left arm', 'Yes, to jaw / neck', 'Unsure'],
      });
      questions.push({
        id: 'q-chest-sweat',
        prompt: 'Are you experiencing sudden cold sweats, nausea, or dizziness alongside the chest sensation?',
        options: ['None of these', 'Yes, cold sweats', 'Yes, dizziness', 'Both sweats and dizziness'],
      });
    }

    if (names.some((n) => n.includes('fever') || n.includes('temperature') || n.includes('bukhar'))) {
      questions.push({
        id: 'q-fever-duration',
        prompt: 'Has the fever exceeded 101°F (38.3°C) or lasted longer than 48 hours without breaking?',
        options: ['Under 101°F / under 2 days', 'Above 101°F', 'Lasted 3+ days', 'Not measured with thermometer'],
      });
    }

    if (names.some((n) => n.includes('breath') || n.includes('cough') || n.includes('saans'))) {
      questions.push({
        id: 'q-resp-speech',
        prompt: 'Can you speak full sentences without pausing to catch your breath?',
        options: ['Yes, normal speaking', 'Can speak short sentences only', 'Struggling to speak a single word'],
      });
    }

    return questions;
  };

  const adaptiveQuestions = getAdaptiveQuestions();

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Stepper Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        {[
          { num: 1, label: t.step1Demographics },
          { num: 2, label: t.step2Symptoms },
          { num: 3, label: t.step3Review },
          { num: 4, label: t.step4Results },
        ].map((s) => {
          const isCurrent = step === s.num;
          const isPast = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                    : isPast
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isPast ? '✓' : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isCurrent ? 'text-slate-900 font-bold' : isPast ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: Demographics & Health Profile */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Patient Health Profile & Context</h3>
            <p className="text-xs text-slate-500">
              Age, biological factors, and chronic conditions calibrate clinical safety thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Age: <span className="text-teal-600 font-mono text-sm">{demographics.age} years</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="100"
                step="0.5"
                value={demographics.age}
                onChange={(e) => setDemographics({ ...demographics, age: parseFloat(e.target.value) })}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Infant (0.1y)</span>
                <span>Adult (35y)</span>
                <span>Senior (75y+)</span>
              </div>
            </div>

            {/* Biological Sex */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Biological Sex
              </label>
              <div className="flex gap-2">
                {(['female', 'male', 'other'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setDemographics({ ...demographics, sex: gender })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      demographics.sex === gender
                        ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold ring-2 ring-teal-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pregnancy Toggle if Female */}
          {demographics.sex === 'female' && demographics.age >= 12 && demographics.age <= 55 && (
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-950 block">Are you currently pregnant?</span>
                <span className="text-[11px] text-teal-700">Applies maternal-fetal triage safety thresholds</span>
              </div>
              <button
                onClick={() => setDemographics({ ...demographics, isPregnant: !demographics.isPregnant })}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  demographics.isPregnant
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {demographics.isPregnant ? 'Yes, Pregnant' : 'No'}
              </button>
            </div>
          )}

          {/* Known Conditions Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Known Chronic Conditions (Comorbidities)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_CONDITIONS.map((cond) => {
                const checked = demographics.knownConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      if (cond === 'None') {
                        setDemographics({ ...demographics, knownConditions: [] });
                      } else {
                        const current = demographics.knownConditions.filter((c) => c !== 'None');
                        const next = checked ? current.filter((c) => c !== cond) : [...current, cond];
                        setDemographics({ ...demographics, knownConditions: next });
                      }
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      checked
                        ? 'bg-teal-50 border-teal-600 text-teal-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cond}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Medications */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Current Medications (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={medInput}
                onChange={(e) => setMedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && medInput.trim()) {
                    e.preventDefault();
                    setDemographics({
                      ...demographics,
                      currentMedications: [...demographics.currentMedications, medInput.trim()],
                    });
                    setMedInput('');
                  }
                }}
                placeholder="e.g., Metformin 500mg, Amlodipine, Aspirin (press Enter to add)"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (medInput.trim()) {
                    setDemographics({
                      ...demographics,
                      currentMedications: [...demographics.currentMedications, medInput.trim()],
                    });
                    setMedInput('');
                  }
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Add
              </button>
            </div>
            {demographics.currentMedications.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {demographics.currentMedications.map((m, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs border border-slate-200"
                  >
                    <span>{m}</span>
                    <button
                      onClick={() =>
                        setDemographics({
                          ...demographics,
                          currentMedications: demographics.currentMedications.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 1 Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                StorageService.savePatientProfile(demographics);
                setStep(2);
              }}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <span>Continue to Symptom Intake</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Symptom Intake (Text, Voice, BodyMap) */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Describe What You Are Feeling</h3>
                <p className="text-xs text-slate-500">
                  Speak or type naturally in English, Hindi, or Telugu. Mention duration, severity, and any absent signs (e.g. "no fever").
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                Language: {lang.toUpperCase()}
              </span>
            </div>

            {/* Textarea + Voice Button */}
            <div className="relative">
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={t.symptomInputPlaceholder}
                className="w-full p-4 text-sm text-slate-900 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent leading-relaxed"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>{t.voiceListening}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t.voiceStart}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {speechError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {speechError}
              </p>
            )}

            {/* Quick Sample Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Prompts:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'Mild sore throat since yesterday, no fever',
                  'Fever for 3 days and severe body ache',
                  'Chest tightness spreading to left arm with cold sweating',
                  'सीने में दर्द और पसीना आ रहा है',
                  'తీవ్రమైన దగ్గు మరియు ఆయాసం',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawText(sample)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            {/* BodyMap Section */}
            <div className="pt-2">
              <BodyMap
                selectedArea={selectedBodyArea}
                onSelectArea={handleBodyAreaSelect}
              />
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Profile
              </button>
              <button
                onClick={handleExtractAndReview}
                disabled={!rawText.trim() || isExtracting}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <span>{isExtracting ? 'Extracting Symptoms...' : 'Extract & Review Symptoms'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Review Structured Symptom Chips & Adaptive Questions */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t.extractedChipsTitle}</h3>
                <p className="text-xs text-slate-500">
                  Review extracted parameters. You can adjust severity, duration, or mark symptoms as denied.
                </p>
              </div>
              <button
                onClick={handleAddSymptomChip}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addSymptom}</span>
              </button>
            </div>

            {/* Extraction Chips List */}
            <div className="space-y-3">
              {symptoms.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No symptoms identified. Click "{t.addSymptom}" to add manually.
                </div>
              ) : (
                symptoms.map((symptom) => (
                  <div
                    key={symptom.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      symptom.isNegation
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : symptom.severity >= 7
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { isNegation: !symptom.isNegation })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            symptom.isNegation
                              ? 'bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-teal-100 text-teal-800 border-teal-300'
                          }`}
                        >
                          {symptom.isNegation ? 'Absent (Denied)' : 'Present'}
                        </button>
                        <div>
                          <input
                            type="text"
                            value={symptom.name}
                            onChange={(e) => handleUpdateSymptom(symptom.id, { name: e.target.value })}
                            className="font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-hidden"
                          />
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">
                            Region: {symptom.bodyArea}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSymptom(symptom.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-md"
                        title="Delete symptom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!symptom.isNegation && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                        {/* Severity Slider */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>{t.severityLabel}:</span>
                            <span className="font-mono text-teal-700">{symptom.severity} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={symptom.severity}
                            onChange={(e) =>
                              handleUpdateSymptom(symptom.id, { severity: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-teal-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Mild (1-3)</span>
                            <span>Moderate (4-6)</span>
                            <span>Severe (7-10)</span>
                          </div>
                        </div>

                        {/* Duration Selector */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {t.durationLabel}:
                          </label>
                          <select
                            value={symptom.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              let days = 1;
                              if (val.includes('hour') || val.includes('morning')) days = 0.5;
                              else if (val.includes('3')) days = 3;
                              else if (val.includes('week')) days = 7;
                              handleUpdateSymptom(symptom.id, { duration: val, durationDays: days });
                            }}
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                          >
                            <option value="Since morning / < 12h">Since morning / &lt; 12h</option>
                            <option value="1 day">1 day</option>
                            <option value="2-3 days">2-3 days</option>
                            <option value="4-7 days">4-7 days</option>
                            <option value="1+ weeks">1+ weeks</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Adaptive Follow-up Questions */}
            {adaptiveQuestions.length > 0 && (
              <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-200/80 space-y-4">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Adaptive Clinical Clarifications</span>
                </div>
                <div className="space-y-3">
                  {adaptiveQuestions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-800">{q.prompt}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const isSelected = adaptiveAnswers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setAdaptiveAnswers((prev) => ({ ...prev, [q.id]: opt }));
                                // If affirmative to chest radiation, ensure symptom chip reflects it
                                if (opt.includes('left arm') || opt.includes('sweats')) {
                                  setRawText((prev) => `${prev} with ${opt.toLowerCase()}`);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Intake
              </button>
              <button
                onClick={handleRunFullAssessment}
                className="px-7 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Run Safety & Care Navigation Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Analyzing State */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-6 max-w-lg mx-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto animate-spin">
            <Activity className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Evaluating Clinical Safety Pipeline</h3>
            <p className="text-xs text-slate-500">
              Executing Layer 1 Red-Flag engine, scoring severity curves, running statistical classifier, and generating transparent reasoning...
            </p>
          </div>
          <div className="space-y-1.5 max-w-xs mx-auto text-left font-mono text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-emerald-700">✓ PII stripped locally</div>
            <div className="text-emerald-700">✓ Layer 1 Red Flags audited</div>
            <div className="text-teal-700 animate-pulse">⟳ Computing dual score & care level...</div>
          </div>
        </div>
      )}
    </div>
  );
};
