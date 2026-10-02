import React from 'react';
import {
  HeartPulse,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Lock,
  Clock,
  Layers,
  Users,
  Compass,
  FileCheck,
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { PersonasSelector } from '../components/PersonasSelector';
import { DemoScenario } from '../types';

interface LandingViewProps {
  lang: SupportedLanguage;
  onStartChecker: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
  onNavigate: (view: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  lang,
  onStartChecker,
  onSelectScenario,
  onNavigate,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 border border-teal-800/40 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-500/30">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>Ethical Clinical Decision Support</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Know When to Rest, <br className="hidden sm:inline" />
            When to Consult, and <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-100">
              When to Act Fast.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            CareCompass helps you recognize early health warning patterns, connects you to the right level of medical care, and keeps loved ones reassured—with a deterministic safety-first AI engine.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartChecker}
              className="px-6 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-base flex items-center gap-2 shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <HeartPulse className="w-5 h-5 text-slate-950" />
              <span>{t.checkSymptoms}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl text-base border border-white/20 transition-all hover:scale-[1.02]"
            >
              <span>View Patient Dashboard</span>
            </button>
          </div>

          {/* Clinical Non-diagnostic Guarantee */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-teal-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Not a diagnosis • Decision-support only</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Zero-PII transfer • Local-first storage</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>Direct 112 / 108 Emergency Access</span>
            </div>
          </div>
        </div>

        {/* Decorative background aura */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* 1-Click Demo Scenarios for Judges */}
      <section>
        <PersonasSelector onSelectScenario={onSelectScenario} />
      </section>

      {/* 6-Step How It Works */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t.howItWorksTitle}
          </h2>
          <p className="text-sm text-slate-600">{t.howItWorksSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Voice & Free-Text Intake',
              desc: 'Describe symptoms naturally in English, Hindi, or Telugu. Speech-to-text works on mobile with body-area mapping.',
              icon: Activity,
            },
            {
              step: '02',
              title: 'Client-Side PII Scrub',
              desc: 'Phone numbers, emails, names, and IDs are redacted on device before any external analysis.',
              icon: Lock,
            },
            {
              step: '03',
              title: 'Deterministic Red-Flag Layer',
              desc: 'Layer 1 clinical rules run first. Unconditionally overrides to Urgent if cardiac, stroke FAST, or anaphylaxis signs are present.',
              icon: ShieldCheck,
            },
            {
              step: '04',
              title: 'Dual Scoring (Rule + ML)',
              desc: 'Severity curves run side-by-side with a trained logistic regression model. The safety-first engine picks the cautious category.',
              icon: Layers,
            },
            {
              step: '05',
              title: 'Explainable Reasoning & Care',
              desc: 'Clear 6th-grade explanation, feature contribution breakdown, and precise routing (Self-care, GP, Specialist, or ER).',
              icon: FileCheck,
            },
            {
              step: '06',
              title: 'Follow-ups & Caregiver Alerts',
              desc: 'Auto-generates reminder timelines and safely alerts designated family members if symptoms worsen or check-ins are missed.',
              icon: Users,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-teal-400/50 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-teal-600/40">
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Safety & Responsible AI Pledge Card */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Responsible AI Framework</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Built Under Clinical Safety Guardrails
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            CareCompass adheres to strict non-diagnostic principles: it empowers individuals with actionable clinical triage guidance without hallucinating prescriptions, dosages, or unfounded diagnostic certainties.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <h4 className="font-bold text-teal-300 text-sm mb-1">Never Prescribes</h4>
            <p className="text-xs text-slate-400">
              Only licensed healthcare professionals can diagnose and prescribe medication.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <h4 className="font-bold text-teal-300 text-sm mb-1">Safety-First Max Operator</h4>
            <p className="text-xs text-slate-400">
              When clinical rules and statistical ML differ, the app resolves to the more cautious category.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <h4 className="font-bold text-teal-300 text-sm mb-1">Data Sovereignty</h4>
            <p className="text-xs text-slate-400">
              You own your health logs. Export or permanently delete your entire record anytime with 1 click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
