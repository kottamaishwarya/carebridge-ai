import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Bell,
  Mail,
  Phone,
  Send,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Lock,
  MessageSquare,
  Key,
} from 'lucide-react';
import { Caregiver, CaregiverAlert } from '../types';
import { StorageService } from '../services/storageService';
import { SupportedLanguage } from '../i18n/translations';

interface CaregiverViewProps {
  lang: SupportedLanguage;
}

export const CaregiverView: React.FC<CaregiverViewProps> = ({ lang }) => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [alerts, setAlerts] = useState<CaregiverAlert[]>([]);
  const [viewMode, setViewMode] = useState<'patient_controls' | 'caregiver_dashboard'>('patient_controls');
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Daughter / Son');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Simulated invite code
  const [inviteCode, setInviteCode] = useState('CARE-9482');

  useEffect(() => {
    setCaregivers(StorageService.getCaregivers());
    setAlerts(StorageService.getAlerts());
  }, []);

  const handleToggleConsent = (cgId: string, category: keyof Caregiver['consentedData']) => {
    const updated = caregivers.map((c) => {
      if (c.id === cgId) {
        return {
          ...c,
          consentedData: {
            ...c.consentedData,
            [category]: !c.consentedData[category],
          },
        };
      }
      return c;
    });
    setCaregivers(updated);
    StorageService.saveCaregivers(updated);
  };

  const handleRevoke = (cgId: string) => {
    const updated = caregivers.filter((c) => c.id !== cgId);
    setCaregivers(updated);
    StorageService.saveCaregivers(updated);
  };

  const handleAddCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCg: Caregiver = {
      id: `cg-${Date.now()}`,
      name: name.trim(),
      relationship,
      phone: phone.trim() || '+91 98000 00000',
      email: email.trim() || 'family@example.com',
      consentGranted: true,
      consentedData: {
        urgentAlerts: true,
        missedFollowUps: true,
        worseningTrend: true,
        symptomSummary: true,
        medications: false,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = [...caregivers, newCg];
    setCaregivers(updated);
    StorageService.saveCaregivers(updated);
    setShowAddCaregiver(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Family Caregiver Network</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Caregiver Consent & Alert Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Delegate emergency supervision to trusted family members with granular privacy controls.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => setViewMode('patient_controls')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'patient_controls' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Patient Consent Controls
          </button>
          <button
            onClick={() => setViewMode('caregiver_dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'caregiver_dashboard' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Caregiver Read-Only Portal
          </button>
        </div>
      </div>

      {viewMode === 'patient_controls' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Authorized Caregivers List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Authorized Family Members</h3>
                <p className="text-xs text-slate-500">
                  Caregivers will ONLY be contacted when specific safety rules trigger.
                </p>
              </div>
              <button
                onClick={() => setShowAddCaregiver(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Family Caregiver</span>
              </button>
            </div>

            {caregivers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No caregivers added. Add a trusted contact to receive automated safety alerts.
              </div>
            ) : (
              <div className="space-y-4">
                {caregivers.map((cg) => (
                  <div
                    key={cg.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{cg.name}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                            {cg.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Phone: {cg.phone} • Email: {cg.email}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRevoke(cg.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 self-start sm:self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke All Access</span>
                      </button>
                    </div>

                    {/* Granular Consent Toggles */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Consented Data & Trigger Rules:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {[
                          { key: 'urgentAlerts', label: 'Urgent Red-Flag Alerts (SMS/Call)' },
                          { key: 'missedFollowUps', label: 'Missed Follow-up Checkpoints' },
                          { key: 'worseningTrend', label: 'Worsening Risk Trend Updates' },
                          { key: 'symptomSummary', label: 'Read-only Symptom Summaries' },
                          { key: 'medications', label: 'Current Medication Regimen' },
                        ].map(({ key, label }) => {
                          const isConsented = cg.consentedData[key as keyof Caregiver['consentedData']];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleToggleConsent(cg.id, key as any)}
                              className={`p-2.5 rounded-xl border text-xs text-left font-medium flex items-center justify-between transition-all ${
                                isConsented
                                  ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            >
                              <span>{label}</span>
                              <span className="text-[10px] font-bold">
                                {isConsented ? 'ALLOWED' : 'BLOCKED'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulated Caregiver Dispatched Alerts Feed */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-600" />
                  <span>Simulated Dispatched Alerts Feed</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Simulated log of SMS, email, and push alerts dispatched according to consent rules.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{alerts.length} dispatched</span>
            </div>

            {alerts.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No alerts dispatched yet. Run an Urgent scenario or mark a follow-up as "Missed" to trigger an automated alert.
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span className="font-mono">{new Date(al.dispatchedAt).toLocaleString()}</span>
                      <div className="flex gap-1">
                        {al.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase text-[9px]"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">{al.title}</h5>
                    <p className="text-slate-600">{al.message}</p>
                    <div className="text-[10px] text-teal-700 font-semibold">
                      Recipient: {al.caregiverName} • Status: Delivered
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CAREGIVER READ-ONLY PORTAL */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <div>
                <h4 className="font-bold text-teal-950 text-sm">Caregiver Supervised Dashboard</h4>
                <p className="text-xs text-teal-800">
                  Viewing authorized patient records under consent grant ID: <code className="font-mono font-bold">CARE-9482</code>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              READ-ONLY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Current Monitored Status
              </span>
              <h4 className="text-lg font-bold text-slate-900">Stable at Home</h4>
              <p className="text-xs text-slate-500">
                Last check-in completed within expected timeframe. No active red flags.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Next Expected Follow-Up
              </span>
              <h4 className="text-lg font-bold text-teal-700">BP & Temperature Reading</h4>
              <p className="text-xs text-slate-500">
                Scheduled in 6 hours. Caregiver will receive SMS if delayed by &gt; 2 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Caregiver Modal */}
      {showAddCaregiver && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCaregiver}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-fadeIn"
          >
            <h3 className="text-lg font-bold text-slate-900">Authorize Family Caregiver</h3>
            <p className="text-xs text-slate-500">
              The caregiver will receive an invite code to monitor safety notifications.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Rajesh Sharma"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Daughter / Son">Daughter / Son</option>
                <option value="Spouse / Partner">Spouse / Partner</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Primary Caregiver / Nurse">Primary Caregiver / Nurse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number (for SMS & Emergency)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh.sharma@example.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCaregiver(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Authorize & Send Code
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
