import React from 'react';
import { AlertTriangle, PhoneCall, ShieldCheck, Heart, Info } from 'lucide-react';
import { INDIA_EMERGENCY_NUMBERS } from '../engine/careMapper';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface FooterProps {
  lang: SupportedLanguage;
  onNavigate: (view: string) => void;
  onOpenPrivacyAudit: () => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onNavigate, onOpenPrivacyAudit }) => {
  const t = TRANSLATIONS[lang];

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors mt-auto">
      {/* Persistent Medical Disclaimer Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-amber-400 font-medium text-center md:text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t.disclaimerShort}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Emergency Hotlines (India):</span>
            <a
              href={`tel:${INDIA_EMERGENCY_NUMBERS.general}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 font-semibold transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>112 (National)</span>
            </a>
            <a
              href={`tel:${INDIA_EMERGENCY_NUMBERS.ambulance}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 font-semibold transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>108 (Ambulance)</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="font-bold text-white tracking-tight">CareCompass</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800">
                Ethical Health AI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              {t.disclaimerFull}
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-PII transmission • Local-first storage • Deterministic Red-Flag Safety</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors">
                  {t.navDashboard}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('checker')} className="hover:text-white transition-colors">
                  {t.navCheck}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('reminders')} className="hover:text-white transition-colors">
                  {t.navReminders}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('caregiver')} className="hover:text-white transition-colors">
                  {t.navCaregiver}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Privacy & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">
                  {t.navPrivacy}
                </button>
              </li>
              <li>
                <button onClick={onOpenPrivacyAudit} className="hover:text-white transition-colors">
                  View Access Audit Log
                </button>
              </li>
              <li>
                <span className="text-slate-500">HIPAA & DPDP Inspired Minimization</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CareCompass. Built for Responsible Healthcare Decision Support.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Heart className="w-3.5 h-3.5 text-teal-400" /> Patient Safety First
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
