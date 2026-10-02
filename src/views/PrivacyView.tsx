import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { stripPII } from '../engine/nlpExtractor';
import { SupportedLanguage } from '../i18n/translations';
import { AuditLogModal } from '../components/AuditLogModal';

interface PrivacyViewProps {
  lang: SupportedLanguage;
  onRefreshData?: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ lang, onRefreshData }) => {
  const [testText, setTestText] = useState('My name is Ramesh Kumar, phone +91 9845012345, email ramesh@gmail.com, chest pain');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  const piiResult = stripPII(testText);

  const handleExportData = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carecompass-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  const handleDeleteAll = () => {
    StorageService.deleteAllData();
    setDeleteConfirmOpen(false);
    onRefreshData?.();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>Patient Privacy Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Data Minimization & Patient Sovereignty
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          CareCompass is built around privacy-by-design. Your health data stays in your browser's local storage by default. No personal identifiers are ever sent to an external language model.
        </p>
      </div>

      {/* "What We Send" Live PII Redaction Interactive Sandbox */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <span>"What We Send to AI" Transparency Sandbox</span>
            </h3>
            <p className="text-xs text-slate-500">
              Type or test any input containing names, phone numbers, or emails to see real-time automated redaction.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
            Live Redactor Active
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Raw User Input (Type anything to test):
          </label>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl text-slate-100 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-teal-400 border-b border-slate-800 pb-2">
            <span>What Leaves Your Device:</span>
            <span>{piiResult.redactedItems.length} Identifiers Stripped</span>
          </div>
          <p className="text-emerald-300 font-semibold leading-relaxed">
            "{piiResult.sanitizedText}"
          </p>
          {piiResult.redactedItems.length > 0 && (
            <div className="pt-2 text-[10px] text-slate-400 space-y-0.5">
              {piiResult.redactedItems.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-bold">✕ Scrubbed {r.type}:</span>
                  <span className="line-through text-slate-500">"{r.original}"</span>
                  <span>&rarr;</span>
                  <span className="text-teal-300">{r.placeholder}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Data */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Export Health Record</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Download your entire symptom history, follow-up reminders, and audit trail in an open JSON format.
          </p>
          <button
            onClick={handleExportData}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Export All Data (.json)
          </button>
          {exportNotice && (
            <p className="text-[11px] text-emerald-700 font-semibold">
              ✓ Archive downloaded successfully.
            </p>
          )}
        </div>

        {/* Delete Data */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Permanent Data Erasure</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instantly wipe all local records, demographics, caregivers, and assessment histories from this browser.
          </p>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            Delete All My Data
          </button>
        </div>
      </div>

      {/* Audit Log Trigger */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-base">Access & Event Audit Log</h4>
          <p className="text-xs text-slate-500">
            Inspect the timestamped trail of assessments created, PII redacted, and alerts dispatched.
          </p>
        </div>
        <button
          onClick={() => setShowAuditModal(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
        >
          View Audit Log
        </button>
      </div>

      {/* Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Confirm Complete Data Wipe</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action is permanent and cannot be undone. All symptom logs, past assessments, and custom follow-up schedules will be deleted from your browser storage.
            </p>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}

      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};
