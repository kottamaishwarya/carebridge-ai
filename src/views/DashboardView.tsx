import React, { useState, useEffect } from 'react';
import {
  Activity,
  HeartPulse,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  Plus,
  ShieldCheck,
  FileText,
  PhoneCall,
} from 'lucide-react';
import { AssessmentRecord, FollowUpReminder, PatientDemographics } from '../types';
import { StorageService } from '../services/storageService';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { DoctorSummaryModal } from '../components/DoctorSummaryModal';

interface DashboardViewProps {
  lang: SupportedLanguage;
  onStartChecker: () => void;
  onNavigate: (view: string) => void;
  onViewAssessment: (record: AssessmentRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  onStartChecker,
  onNavigate,
  onViewAssessment,
}) => {
  const t = TRANSLATIONS[lang];
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [profile, setProfile] = useState<PatientDemographics>(StorageService.getPatientProfile());
  const [selectedAssessmentForModal, setSelectedAssessmentForModal] = useState<AssessmentRecord | null>(null);

  useEffect(() => {
    setAssessments(StorageService.getAssessments());
    setReminders(StorageService.getReminders());
  }, []);

  const latestAssessment = assessments[0];

  const handleCompleteReminder = (id: string) => {
    StorageService.updateReminderStatus(id, 'completed');
    setReminders(StorageService.getReminders());
  };

  const handleSnoozeReminder = (id: string) => {
    StorageService.updateReminderStatus(id, 'snoozed');
    setReminders(StorageService.getReminders());
  };

  // Generate SVG points for Risk Trend Line Chart
  const trendData = assessments.slice(0, 7).reverse();
  const chartHeight = 120;
  const chartWidth = 400;

  const points = trendData.map((a, idx) => {
    const x = trendData.length > 1 ? (idx / (trendData.length - 1)) * (chartWidth - 40) + 20 : chartWidth / 2;
    // Score is 0 - 100, invert for SVG y coordinates (100 = 10, 0 = chartHeight - 10)
    const y = chartHeight - (a.result.finalScore / 100) * (chartHeight - 30) - 15;
    return { x, y, score: a.result.finalScore, level: a.result.riskLevel, date: new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-teal-800/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
            <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
            <span>Active Patient Care Monitor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Health Overview & Care Navigation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track your risk trends, stay on schedule with follow-up checks, and share summaries with doctors.
          </p>
        </div>

        <button
          onClick={onStartChecker}
          className="px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0 self-start sm:self-center"
        >
          <Activity className="w-4 h-4 text-slate-950" />
          <span>{t.checkSymptoms}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Status, Trend, Reminders */}
        <div className="lg:col-span-8 space-y-6">
          {/* Latest Assessment Status Card */}
          {latestAssessment ? (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Most Recent Assessment
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(latestAssessment.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  • {new Date(latestAssessment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {latestAssessment.result.warningPatternTitle}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-lg">
                    {latestAssessment.result.plainLanguageExplanation}
                  </p>
                </div>

                <div className="shrink-0">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                      latestAssessment.result.riskLevel === 'urgent'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : latestAssessment.result.riskLevel === 'attention'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {latestAssessment.result.riskLevel === 'urgent' ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : latestAssessment.result.riskLevel === 'attention' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{latestAssessment.result.riskLevel.toUpperCase()} RISK</span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-teal-950 font-bold">Recommended Care Level:</strong>{' '}
                  <span className="text-teal-800 font-semibold">{latestAssessment.result.careRecommendation.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewAssessment(latestAssessment)}
                    className="px-3 py-1 bg-white text-teal-800 rounded-lg font-bold border border-teal-300 hover:bg-teal-100 transition-colors"
                  >
                    Full Report
                  </button>
                  <button
                    onClick={() => setSelectedAssessmentForModal(latestAssessment)}
                    className="px-3 py-1 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 transition-colors"
                  >
                    Doctor SBAR
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <Activity className="w-10 h-10 text-teal-600 mx-auto" />
              <h3 className="font-bold text-slate-800">No Assessment Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Check symptoms to generate your first clinical triage report and customized monitoring schedule.
              </p>
              <button
                onClick={onStartChecker}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Start First Check
              </button>
            </div>
          )}

          {/* Risk Trend Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>Risk Progression Over Time</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Continuous safety score tracking across symptom assessments
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {assessments.length} assessment{assessments.length === 1 ? '' : 's'} recorded
              </span>
            </div>

            {assessments.length > 1 ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-36 overflow-visible"
                >
                  {/* Grid lines */}
                  <line x1="10" y1="20" x2={chartWidth - 10} y2="20" stroke="#fecdd3" strokeDasharray="3 3" />
                  <text x="15" y="18" fill="#e11d48" fontSize="9" fontWeight="bold">Urgent Zone (75-100)</text>

                  <line x1="10" y1="60" x2={chartWidth - 10} y2="60" stroke="#fed7aa" strokeDasharray="3 3" />
                  <text x="15" y="58" fill="#d97706" fontSize="9" fontWeight="bold">Needs Attention (40-74)</text>

                  <line x1="10" y1="100" x2={chartWidth - 10} y2="100" stroke="#bbf7d0" strokeDasharray="3 3" />
                  <text x="15" y="98" fill="#16a34a" fontSize="9" fontWeight="bold">Low Risk (&lt;40)</text>

                  {/* Trend line */}
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Data points */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        className={
                          p.level === 'urgent'
                            ? 'fill-rose-500 stroke-white stroke-2'
                            : p.level === 'attention'
                            ? 'fill-amber-500 stroke-white stroke-2'
                            : 'fill-teal-500 stroke-white stroke-2'
                        }
                      />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {p.score}
                      </text>
                      <text
                        x={p.x}
                        y={chartHeight + 12}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="8"
                      >
                        {p.date}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Complete at least two symptom assessments to see your longitudinal safety trend graph.
              </div>
            )}
          </div>

          {/* Upcoming Reminders Checklist */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Upcoming Follow-Ups & Monitoring Tasks</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Timed health actions generated to track your recovery
                </p>
              </div>
              <button
                onClick={() => onNavigate('reminders')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {reminders.slice(0, 3).map((rem) => (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    rem.status === 'completed'
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-500 line-through'
                      : rem.status === 'snoozed'
                      ? 'bg-amber-50/40 border-amber-200 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{rem.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{rem.description}</p>
                    <span className="text-[10px] text-teal-700 font-medium">
                      Due: {new Date(rem.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(rem.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {rem.status !== 'completed' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCompleteReminder(rem.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleSnoozeReminder(rem.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Snooze
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Profile, Caregiver Status, Symptom History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patient Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Health Profile</h4>
                  <p className="text-[11px] text-slate-500">Demographic Context</p>
                </div>
              </div>
              <button
                onClick={onStartChecker}
                className="text-xs text-teal-600 font-bold hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Age:</span>
                <span className="font-bold text-slate-800">{profile.age} years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Biological Sex:</span>
                <span className="font-bold text-slate-800 capitalize">{profile.sex}</span>
              </div>
              {profile.isPregnant && (
                <div className="flex justify-between py-1 border-b border-slate-50 text-teal-700 font-bold">
                  <span>Pregnancy:</span>
                  <span>Active</span>
                </div>
              )}
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Known Conditions:</span>
                {profile.knownConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.knownConditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">None reported</span>
                )}
              </div>
            </div>
          </div>

          {/* Caregiver Escalation Protection Card */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 border border-teal-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Caregiver Safety Net
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-teal-800 leading-relaxed">
              Family members receive SMS/push alerts only when urgent danger is identified or follow-ups are repeatedly missed.
            </p>
            <button
              onClick={() => onNavigate('caregiver')}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Configure Caregiver Alerts
            </button>
          </div>

          {/* Symptom History Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Symptom History Timeline</h4>
            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400">No assessments logged yet.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200">
                {assessments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onViewAssessment(a)}
                    className="relative pl-6 cursor-pointer group"
                  >
                    <div
                      className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        a.result.riskLevel === 'urgent'
                          ? 'bg-rose-500'
                          : a.result.riskLevel === 'attention'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                    />
                    <div className="p-2.5 rounded-xl border border-slate-100 group-hover:border-teal-300 group-hover:bg-teal-50/20 transition-all">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span className="font-bold uppercase text-slate-600">{a.result.riskLevel}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {a.result.warningPatternTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DoctorSummaryModal
        isOpen={!!selectedAssessmentForModal}
        onClose={() => setSelectedAssessmentForModal(null)}
        assessment={selectedAssessmentForModal}
      />
    </div>
  );
};
