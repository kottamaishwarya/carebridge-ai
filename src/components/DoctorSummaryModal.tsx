import React, { useState } from 'react';
import { X, Printer, Copy, Check, FileText, Stethoscope, AlertTriangle } from 'lucide-react';
import { AssessmentRecord } from '../types';

interface DoctorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentRecord | null;
}

export const DoctorSummaryModal: React.FC<DoctorSummaryModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !assessment) return null;

  const { demographics, extractedSymptoms, result, createdAt, rawInputText } = assessment;

  const sbarContent = `=====================================================
CARECOMPASS CLINICAL PRE-CONSULTATION SUMMARY (SBAR)
Decision-Support & Triage Context for Attending Physician
Generated: ${new Date(createdAt).toLocaleString()}
=====================================================

1. SITUATION
- Chief Complaint / Intake: "${rawInputText}"
- CareCompass Triage Category: ${result.riskLevel.toUpperCase()}
- Warning Pattern Cluster: ${result.warningPatternTitle}

2. BACKGROUND (PATIENT CONTEXT)
- Age / Biological Sex: ${demographics.age} years / ${demographics.sex}
- Pregnancy Status: ${demographics.isPregnant ? 'Yes' : 'No / Not Applicable'}
- Known Chronic Conditions: ${demographics.knownConditions.length > 0 ? demographics.knownConditions.join(', ') : 'None Reported'}
- Current Medications: ${demographics.currentMedications.length > 0 ? demographics.currentMedications.join(', ') : 'None Reported'}

3. ASSESSMENT & EXTRACTED SYMPTOMS
${extractedSymptoms
  .map(
    (s) =>
      `• ${s.name}: ${s.isNegation ? 'EXPLICITLY DENIED/ABSENT' : `Severity ${s.severity}/10, Duration: ${s.duration}, Region: ${s.bodyArea}`}`
  )
  .join('\n')}

- Deterministic Red-Flag Rules Triggered: ${
    result.redFlagsTriggered.length > 0
      ? result.redFlagsTriggered.map((r) => `${r.id} (${r.title})`).join('; ')
      : 'None'
  }
- Safety Risk Index: ${result.finalScore}/100 (Clinical Rule Score: ${result.ruleScore}, ML Score: ${result.mlScore})
- Algorithmic Confidence: ${(result.confidence * 100).toFixed(0)}%

4. CARE NAVIGATION & CONTEMPORARY RECOMMENDATION
- Level of Care Recommended: ${result.careRecommendation.title}
- Recommended Urgency Window: ${result.careRecommendation.urgencyTimeline}
- Plain Language Patient Brief: "${result.plainLanguageExplanation}"

=====================================================
IMPORTANT CLINICAL DISCLAIMER:
CareCompass is a health awareness and decision-support system, NOT a diagnostic system.
This summary is prepared to assist clinical history taking and triage. Final diagnostic
evaluation and treatment decisions rest solely with the licensed physician.
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sbarContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Doctor Consultation Handover</h3>
              <p className="text-xs text-slate-500">Structured SBAR summary to share with your physician</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Show this summary to your doctor or nurse during your consultation.</span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {sbarContent}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
