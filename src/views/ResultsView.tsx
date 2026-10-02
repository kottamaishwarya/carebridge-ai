import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Volume2,
  VolumeX,
  FileText,
  MapPin,
  Calendar,
  Share2,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Send,
  HelpCircle,
  PhoneCall,
  Activity,
  Layers,
} from 'lucide-react';
import { AssessmentRecord, RiskAnalysisResult } from '../types';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { DoctorSummaryModal } from '../components/DoctorSummaryModal';
import { NearbyCareModal } from '../components/NearbyCareModal';
import { AudioService } from '../services/audioService';
import { StorageService } from '../services/storageService';
import { INDIA_EMERGENCY_NUMBERS } from '../engine/careMapper';

interface ResultsViewProps {
  assessment: AssessmentRecord;
  lang: SupportedLanguage;
  onNavigate: (view: string) => void;
  onNewCheck: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  assessment,
  lang,
  onNavigate,
  onNewCheck,
}) => {
  const t = TRANSLATIONS[lang];
  const { result, demographics, extractedSymptoms } = assessment;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDoctorSummary, setShowDoctorSummary] = useState(false);
  const [showNearbyCare, setShowNearbyCare] = useState(false);
  const [caregiverNotified, setCaregiverNotified] = useState(false);

  // Toggle voice narration of the clinical outcome
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      AudioService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const speechScript = `CareCompass Health Navigation Report. Your current risk level is ${result.riskLevel.toUpperCase()}. ${result.plainLanguageExplanation} Recommended next step: ${result.careRecommendation.title}. ${result.careRecommendation.urgencyTimeline}.`;
      AudioService.speakText(speechScript, lang);
      setIsSpeaking(true);
    }
  };

  // Trigger caregiver alert simulation
  const handleAlertCaregiver = () => {
    const caregivers = StorageService.getCaregivers();
    const primary = caregivers[0] || {
      id: 'cg-1',
      name: 'Family Member',
      phone: '+91 98450 12345',
      email: 'caregiver@example.com',
    };

    StorageService.triggerCaregiverAlert({
      caregiverId: primary.id,
      caregiverName: primary.name,
      patientName: assessment.patientName || 'Primary Patient',
      type: result.riskLevel === 'urgent' ? 'urgent_risk' : 'worsening_trend',
      title: `${result.riskLevel === 'urgent' ? 'URGENT MEDICAL ALERT' : 'Health Status Update'}: ${result.warningPatternTitle}`,
      message: `CareCompass identified ${result.riskLevel.toUpperCase()} priority warning pattern for ${assessment.patientName || 'Patient'}. Recommended care: ${result.careRecommendation.title} (${result.careRecommendation.urgencyTimeline}).`,
      channels: ['sms', 'email', 'push'],
    });

    setCaregiverNotified(true);
  };

  // Visual risk styles
  let riskBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-100';
  let riskIcon = CheckCircle2;
  let riskText = t.riskLow;
  let riskScoreColor = 'text-emerald-700';

  if (result.riskLevel === 'attention') {
    riskBadgeColor = 'bg-amber-50 text-amber-900 border-amber-300 ring-amber-100';
    riskIcon = AlertTriangle;
    riskText = t.riskAttention;
    riskScoreColor = 'text-amber-700';
  } else if (result.riskLevel === 'urgent') {
    riskBadgeColor = 'bg-rose-50 text-rose-900 border-rose-300 ring-rose-100';
    riskIcon = AlertOctagon;
    riskText = t.riskUrgent;
    riskScoreColor = 'text-rose-700';
  }

  const RiskIconComponent = riskIcon;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Urgent Emergency Banner if level is urgent */}
      {result.riskLevel === 'urgent' && (
        <EmergencyBanner
          redFlags={result.redFlagsTriggered}
          onOpenNearbyCare={() => setShowNearbyCare(true)}
          onNotifyCaregiver={handleAlertCaregiver}
          caregiverNotified={caregiverNotified}
        />
      )}

      {/* Main Triage Outcome Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Assessment Completed • {new Date(assessment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {result.warningPatternTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {result.warningPatternDescription}
            </p>
          </div>

          {/* Color-Independent Risk Indicator (Shape + Icon + Text + Badge) */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <div
              className={`px-4 py-2 rounded-2xl border-2 ring-4 text-sm font-black flex items-center gap-2 shadow-xs ${riskBadgeColor}`}
            >
              <RiskIconComponent className="w-5 h-5 shrink-0" />
              <span>{riskText}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Safety Score: <span className={`font-bold ${riskScoreColor}`}>{result.finalScore} / 100</span> • {(result.confidence * 100).toFixed(0)}% Confidence
            </div>
          </div>
        </div>

        {/* Plain Language 6th Grade Explanation with Read Aloud */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Plain-Language Patient Brief (6th-Grade Level)</span>
            </h3>
            <button
              onClick={handleToggleSpeak}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-teal-600" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Listen Aloud (TTS)</span>
                </>
              )}
            </button>
          </div>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
            "{result.plainLanguageExplanation}"
          </p>
        </div>

        {/* Recommended Healthcare Navigation Service */}
        <div className="bg-teal-900 text-white rounded-2xl p-6 sm:p-7 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-800 text-teal-200 text-xs font-bold uppercase tracking-wider">
              {t.recommendedCare}
            </div>
            <span className="text-xs font-bold text-teal-300">
              ⏱ {result.careRecommendation.urgencyTimeline}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight">
              {result.careRecommendation.title}
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 mt-1 leading-relaxed">
              {result.careRecommendation.description}
            </p>
          </div>

          {result.careRecommendation.suggestedSpecialist && (
            <div className="p-3 bg-teal-950/60 rounded-xl text-xs text-teal-200 border border-teal-800">
              <strong>Relevant Care Focus:</strong> {result.careRecommendation.suggestedSpecialist}
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              Immediate Action Steps:
            </span>
            <ul className="space-y-1 text-xs text-teal-50">
              {result.careRecommendation.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowNearbyCare(true)}
              className="px-4 py-2.5 bg-white text-teal-950 hover:bg-teal-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Locate Nearby Care Providers</span>
            </button>

            <button
              onClick={() => setShowDoctorSummary(true)}
              className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-teal-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Prepare Doctor Consultation SBAR</span>
            </button>
          </div>
        </div>

        {/* EXPLAINABLE REASONING: Feature Contributions Bar Chart */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                <span>Why this result? (Feature Contribution Weights)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Transparent safety model breakdown showing which factors raised or lowered the risk index.
              </p>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {result.contributingFactors.map((factor, idx) => {
              const isPositive = factor.weight > 0;
              const widthPercent = Math.min(100, Math.abs(factor.weight) * 3);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800">{factor.factor}</span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isPositive ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {factor.impactText}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Counterfactuals: What Would Change This Category? */}
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>What would change this triage category? (Counterfactual Analysis)</span>
          </h4>
          <ul className="list-disc list-inside text-xs text-amber-950 space-y-1">
            {result.whatWouldChangeCategory.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Immediate Danger Red Flags List */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            When to seek help immediately (Do not wait):
          </h4>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            {result.whenToSeekHelpImmediately.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Navigation & Action Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={onNewCheck}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Check Another Symptom
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('reminders')}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>View Follow-up Reminders</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DoctorSummaryModal
        isOpen={showDoctorSummary}
        onClose={() => setShowDoctorSummary(false)}
        assessment={assessment}
      />

      <NearbyCareModal
        isOpen={showNearbyCare}
        onClose={() => setShowNearbyCare(false)}
      />
    </div>
  );
};
