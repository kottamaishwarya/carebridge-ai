import React, { useState } from 'react';
import {
  Terminal,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  ShieldAlert,
  BarChart3,
  Send,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { PipelineStageEvent } from '../types';
import { runAllUnitTests, TestResult } from '../engine/testEngine';

interface DemoPipelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stageEvents: PipelineStageEvent[];
}

export const DemoPipelineDrawer: React.FC<DemoPipelineDrawerProps> = ({
  isOpen,
  onClose,
  stageEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tests' | 'architecture'>('pipeline');
  const [testResults, setTestResults] = useState<{
    results: TestResult[];
    passedCount: number;
    failedCount: number;
    totalDurationMs: number;
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const res = runAllUnitTests();
      setTestResults(res);
      setIsRunningTests(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  CareCompass Engine Inspector
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700">
                  Judge / Demo Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditable 6-stage clinical decision-support pipeline inspection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Live Pipeline Trace ({stageEvents.length} stages)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tests');
              if (!testResults) handleRunTests();
            }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Automated Unit Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Safety Constitution</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs font-mono">
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                <span className="text-teal-400 font-bold">Pipeline Architecture Overview:</span> This live inspector observes each intake in real time: Raw Input &rarr; Client PII Scrub &rarr; NLP Extraction &rarr; Layer 1 Red Flag Override &rarr; Layer 3 Dual Scoring &rarr; Care Navigation & Alerts.
              </div>

              {stageEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-3">
                  <Cpu className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p>No pipeline events in buffer yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Run an assessment via "Check Symptoms" or click any Demo Scenario on the landing page to populate live trace telemetry.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stageEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        evt.isRedFlagTriggered
                          ? 'bg-red-950/30 border-red-800/80 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 font-bold text-[10px]">
                            STAGE {evt.stage}
                          </span>
                          <span className="font-bold text-white text-xs">{evt.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{evt.processingTimeMs}ms</span>
                      </div>

                      <p className="text-slate-400 text-[11px] mb-3">{evt.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                          <span className="text-slate-500 uppercase font-bold text-[9px] block mb-1">
                            Input
                          </span>
                          <pre className="text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                            {JSON.stringify(evt.input, null, 2)}
                          </pre>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                          <span className="text-teal-500 uppercase font-bold text-[9px] block mb-1">
                            Output & Outcome
                          </span>
                          <pre className="text-teal-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                            {JSON.stringify(evt.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm">Automated Test Harness</h4>
                  <p className="text-[11px] text-slate-400">
                    Deterministic unit tests covering Red-Flags, Negation resilience, Dual scoring, and PII scrubbing.
                  </p>
                </div>
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests ? 'Running...' : 'Rerun Suite'}</span>
                </button>
              </div>

              {testResults && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 px-2 py-1 text-xs">
                    <span className="text-emerald-400 font-bold">
                      ✓ {testResults.passedCount} Passed
                    </span>
                    {testResults.failedCount > 0 && (
                      <span className="text-red-400 font-bold">
                        ✕ {testResults.failedCount} Failed
                      </span>
                    )}
                    <span className="text-slate-400">
                      Total Duration: {testResults.totalDurationMs}ms
                    </span>
                  </div>

                  <div className="space-y-2">
                    {testResults.results.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-[11px] flex items-start justify-between gap-3 ${
                          t.passed
                            ? 'bg-slate-950/70 border-emerald-900/40 text-slate-300'
                            : 'bg-red-950/50 border-red-800 text-red-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {t.suite}
                            </span>
                            <span className="font-bold text-white">{t.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Expected: <code className="text-teal-300">{t.expected}</code> | Actual:{' '}
                            <code className={t.passed ? 'text-emerald-400' : 'text-red-400'}>
                              {t.actual}
                            </code>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.passed
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {t.passed ? 'PASS' : 'FAIL'}
                          </span>
                          <div className="text-[9px] text-slate-500 mt-1">{t.durationMs}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-teal-400 text-sm">Decision-Support Safety Constitution</h4>
                <p className="text-[11px] text-slate-400">
                  CareCompass is engineered under strict clinical safety boundaries:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[11px]">
                  <li>
                    <strong className="text-white">Layer 1 Non-Bypassable:</strong> Red-flag deterministic engine always executes first. Even if an LLM or ML classifier outputs low confidence, red flags immediately force category to Urgent.
                  </li>
                  <li>
                    <strong className="text-white">Safety-First Maximum Operator:</strong> Final risk category is resolved as <code className="text-teal-300">max(RuleScore, MLScore)</code>. The app never gambles on the lenient score.
                  </li>
                  <li>
                    <strong className="text-white">Zero Diagnosis:</strong> Warning patterns are named descriptive clusters ("Possible Cardiac Warning Pattern", "Possible Respiratory Febrile Pattern"), never definitive diagnostic pronouncements.
                  </li>
                  <li>
                    <strong className="text-white">Data Minimization:</strong> Client-side PII scrub removes phone numbers, email addresses, names, and government IDs prior to external LLM calls.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
