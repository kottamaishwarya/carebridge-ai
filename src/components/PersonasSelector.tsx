import React from 'react';
import { DemoScenario } from '../types';
import { DEMO_SCENARIOS } from '../services/storageService';
import { Play, Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, Globe } from 'lucide-react';

interface PersonasSelectorProps {
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const PersonasSelector: React.FC<PersonasSelectorProps> = ({ onSelectScenario }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Judge & Reviewer Fast-Track</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Preloaded 1-Click Clinical Demo Scenarios
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Test the deterministic red-flag safety, ML scoring, follow-ups, and caregiver alerts in one click.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_SCENARIOS.map((scenario) => {
          let badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
          let Icon = CheckCircle2;

          if (scenario.expectedRisk === 'attention') {
            badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-700';
            Icon = AlertTriangle;
          } else if (scenario.expectedRisk === 'urgent') {
            badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-700';
            Icon = AlertOctagon;
          }

          if (scenario.language === 'hi') {
            Icon = Globe;
          }

          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className="group p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>Expected: {scenario.expectedRisk.toUpperCase()}</span>
                  </span>
                  <span className="text-[11px] text-teal-400 font-mono font-medium">
                    {scenario.persona}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors">
                  {scenario.name}
                </h4>

                <p className="text-xs text-slate-300 italic mt-1.5 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800 font-mono">
                  "{scenario.text}"
                </p>

                <p className="text-[11px] text-slate-400 mt-2">
                  <strong className="text-slate-300">Expected Outcome:</strong> {scenario.highlight}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:text-teal-300">
                <span>Run this scenario &rarr;</span>
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                  <Play className="w-3 h-3 fill-current" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
