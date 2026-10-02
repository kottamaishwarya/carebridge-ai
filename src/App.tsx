/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingView } from './views/LandingView';
import { SymptomCheckerWizard } from './views/SymptomCheckerWizard';
import { ResultsView } from './views/ResultsView';
import { DashboardView } from './views/DashboardView';
import { RemindersView } from './views/RemindersView';
import { CaregiverView } from './views/CaregiverView';
import { PrivacyView } from './views/PrivacyView';
import { DemoPipelineDrawer } from './components/DemoPipelineDrawer';
import { AuditLogModal } from './components/AuditLogModal';
import { AssessmentRecord, DemoScenario, ExtractedSymptom, PatientDemographics, PipelineStageEvent, RiskAnalysisResult } from './types';
import { StorageService, AppSettings } from './services/storageService';
import { SupportedLanguage } from './i18n/translations';
import { GeminiService } from './services/geminiService';
import { generateFollowUpReminders } from './engine/careMapper';
import { Activity, Stethoscope, Calendar, Users, Shield } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'checker' | 'results' | 'dashboard' | 'reminders' | 'caregiver' | 'privacy'>('landing');
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());

  // Assessment states
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentRecord | null>(null);
  const [prefilledText, setPrefilledText] = useState('');
  const [prefilledDemographics, setPrefilledDemographics] = useState<PatientDemographics | undefined>(undefined);

  // Live Judge / Admin Pipeline Inspector telemetry
  const [pipelineEvents, setPipelineEvents] = useState<PipelineStageEvent[]>([]);
  const [pipelineDrawerOpen, setPipelineDrawerOpen] = useState(false);
  const [auditLogModalOpen, setAuditLogModalOpen] = useState(false);

  // Check if latest assessment is urgent
  const [hasUrgentAlert, setHasUrgentAlert] = useState(false);

  useEffect(() => {
    const list = StorageService.getAssessments();
    if (list.length > 0) {
      const latest = list[0];
      setCurrentAssessment(latest);
      setHasUrgentAlert(latest.result.riskLevel === 'urgent');
    }
  }, []);

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handlePipelineStageEvent = (event: PipelineStageEvent) => {
    setPipelineEvents((prev) => {
      const filtered = prev.filter((e) => e.stage !== event.stage);
      return [...filtered, event].sort((a, b) => a.stage - b.stage);
    });
  };

  const handleCompleteAssessment = (
    result: RiskAnalysisResult,
    symptoms: ExtractedSymptom[],
    demographics: PatientDemographics,
    rawText: string
  ) => {
    const record: AssessmentRecord = {
      id: `assess-${Date.now()}`,
      patientName: 'Primary User',
      demographics,
      rawInputText: rawText,
      inputLanguage: lang,
      extractedSymptoms: symptoms,
      result,
      createdAt: new Date().toISOString(),
    };

    // Auto-generate follow-up reminders
    const reminders = generateFollowUpReminders(result.riskLevel, symptoms, demographics, record.id);
    StorageService.addReminders(reminders);
    StorageService.saveAssessment(record);

    setCurrentAssessment(record);
    setHasUrgentAlert(result.riskLevel === 'urgent');
    setCurrentView('results');

    // Auto-alert caregiver if urgent
    if (result.riskLevel === 'urgent') {
      const caregivers = StorageService.getCaregivers();
      const primary = caregivers[0];
      if (primary && primary.consentedData.urgentAlerts) {
        StorageService.triggerCaregiverAlert({
          caregiverId: primary.id,
          caregiverName: primary.name,
          patientName: 'Primary User',
          type: 'urgent_risk',
          title: `EMERGENCY ALERT: ${result.warningPatternTitle}`,
          message: `CareCompass identified Urgent Risk. Recommended care: ${result.careRecommendation.title} (${result.careRecommendation.urgencyTimeline}). Call emergency services immediately.`,
          channels: ['sms', 'email', 'push'],
        });
      }
    }
  };

  // 1-Click Demo Scenario Runner
  const handleSelectScenario = async (scenario: DemoScenario) => {
    setPrefilledText(scenario.text);
    setLang(scenario.language);
    const demoDemographics: PatientDemographics = {
      age: scenario.age,
      sex: scenario.sex,
      knownConditions: scenario.conditions,
      currentMedications: [],
    };
    setPrefilledDemographics(demoDemographics);

    // Run extraction & full pipeline immediately for quick demo feedback
    const extraction = await GeminiService.extractSymptoms(scenario.text, scenario.language);
    const result = GeminiService.runFullPipeline(
      scenario.text,
      extraction.symptoms,
      demoDemographics,
      handlePipelineStageEvent
    );

    handleCompleteAssessment(result, extraction.symptoms, demoDemographics, scenario.text);
  };

  const handleStartChecker = () => {
    setPrefilledText('');
    setPrefilledDemographics(undefined);
    setCurrentView('checker');
  };

  // Typography class based on user settings
  let fontScaleClass = 'text-sm';
  if (settings.fontSize === 'large') fontScaleClass = 'text-base';
  if (settings.fontSize === 'xlarge') fontScaleClass = 'text-lg';

  const highContrastClass = settings.highContrast
    ? 'contrast-125 saturate-150 font-semibold text-black bg-white'
    : 'bg-slate-50/60 text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all ${highContrastClass} ${fontScaleClass}`}>
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as any)}
        lang={lang}
        onLanguageChange={setLang}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenPipelineInspector={() => setPipelineDrawerOpen(true)}
        urgentActive={hasUrgentAlert}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-12">
        {currentView === 'landing' && (
          <LandingView
            lang={lang}
            onStartChecker={handleStartChecker}
            onSelectScenario={handleSelectScenario}
            onNavigate={(view) => setCurrentView(view as any)}
          />
        )}

        {currentView === 'checker' && (
          <SymptomCheckerWizard
            lang={lang}
            initialText={prefilledText}
            initialDemographics={prefilledDemographics}
            onCompleteAssessment={handleCompleteAssessment}
            onCancel={() => setCurrentView('landing')}
            onStageEvent={handlePipelineStageEvent}
          />
        )}

        {currentView === 'results' && currentAssessment && (
          <ResultsView
            assessment={currentAssessment}
            lang={lang}
            onNavigate={(view) => setCurrentView(view as any)}
            onNewCheck={handleStartChecker}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            lang={lang}
            onStartChecker={handleStartChecker}
            onNavigate={(view) => setCurrentView(view as any)}
            onViewAssessment={(record) => {
              setCurrentAssessment(record);
              setCurrentView('results');
            }}
          />
        )}

        {currentView === 'reminders' && <RemindersView lang={lang} />}

        {currentView === 'caregiver' && <CaregiverView lang={lang} />}

        {currentView === 'privacy' && (
          <PrivacyView
            lang={lang}
            onRefreshData={() => {
              setCurrentAssessment(null);
              setHasUrgentAlert(false);
              setCurrentView('landing');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {[
          { id: 'dashboard', label: 'Home', icon: Activity },
          { id: 'checker', label: 'Check', icon: Stethoscope },
          { id: 'reminders', label: 'Reminders', icon: Calendar },
          { id: 'caregiver', label: 'Caregiver', icon: Users },
          { id: 'privacy', label: 'Privacy', icon: Shield },
        ].map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-teal-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <Footer
        lang={lang}
        onNavigate={(view) => setCurrentView(view as any)}
        onOpenPrivacyAudit={() => setAuditLogModalOpen(true)}
      />

      {/* Live Pipeline Inspector Drawer (Judge / Admin View) */}
      <DemoPipelineDrawer
        isOpen={pipelineDrawerOpen}
        onClose={() => setPipelineDrawerOpen(false)}
        stageEvents={pipelineEvents}
      />

      {/* Privacy Audit Log Modal */}
      <AuditLogModal
        isOpen={auditLogModalOpen}
        onClose={() => setAuditLogModalOpen(false)}
      />
    </div>
  );
}
