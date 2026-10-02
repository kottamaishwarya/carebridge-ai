import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Bell,
  RotateCcw,
  Check,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { FollowUpReminder } from '../types';
import { StorageService } from '../services/storageService';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface RemindersViewProps {
  lang: SupportedLanguage;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'snoozed' | 'missed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [escalationToast, setEscalationToast] = useState<string | null>(null);

  // New reminder form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<FollowUpReminder['type']>('recheck');
  const [newHours, setNewHours] = useState(24);
  const [newAutoEscalate, setNewAutoEscalate] = useState(true);

  useEffect(() => {
    setReminders(StorageService.getReminders());
  }, []);

  const handleUpdateStatus = (id: string, status: FollowUpReminder['status']) => {
    StorageService.updateReminderStatus(id, status);
    const updated = StorageService.getReminders();
    setReminders(updated);

    // If marked missed and auto-escalate is enabled, simulate caregiver notification
    const item = updated.find((r) => r.id === id);
    if (status === 'missed' && item?.autoEscalateCaregiver) {
      const caregiver = StorageService.getCaregivers()[0];
      StorageService.triggerCaregiverAlert({
        caregiverId: caregiver.id,
        caregiverName: caregiver.name,
        patientName: 'Primary Patient',
        type: 'missed_followup',
        title: `Missed Health Check-in: ${item.title}`,
        message: `Patient missed the scheduled health follow-up: "${item.title}". Please verify their wellbeing.`,
        channels: ['sms', 'email', 'push'],
      });
      setEscalationToast(`Missed check-in auto-escalated: SMS dispatched to ${caregiver.name} (${caregiver.phone})`);
      setTimeout(() => setEscalationToast(null), 5000);
    }
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const reminder: FollowUpReminder = {
      id: `rem-user-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Scheduled patient health checkpoint',
      dueDate: new Date(Date.now() + newHours * 60 * 60 * 1000).toISOString(),
      type: newType,
      status: 'pending',
      autoEscalateCaregiver: newAutoEscalate,
      escalated: false,
      createdAt: new Date().toISOString(),
    };

    StorageService.addReminders([reminder]);
    setReminders(StorageService.getReminders());
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5 text-teal-600" />
            <span>Automated Recovery Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Follow-up Reminders & Monitoring Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay on track with physician visits, vitals logs, and recovery assessments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Follow-up</span>
        </button>
      </div>

      {/* Escalation notification banner */}
      {escalationToast && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-semibold">{escalationToast}</span>
          </div>
          <button
            onClick={() => setEscalationToast(null)}
            className="text-amber-800 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {(['all', 'pending', 'completed', 'snoozed', 'missed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
              filter === f
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f} ({reminders.filter((r) => (f === 'all' ? true : r.status === f)).length})
          </button>
        ))}
      </div>

      {/* Timeline Schedule */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No reminders under "{filter}" status.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((rem) => {
              const isPastDue = new Date(rem.dueDate).getTime() < Date.now() && rem.status === 'pending';
              return (
                <div
                  key={rem.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    rem.status === 'completed'
                      ? 'bg-emerald-50/30 border-emerald-200 text-slate-500'
                      : rem.status === 'missed'
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                      : rem.status === 'snoozed'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                        {rem.type.replace('_', ' ')}
                      </span>
                      {rem.autoEscalateCaregiver && (
                        <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                          • Caregiver Escalation Enabled
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-sm sm:text-base font-bold ${
                        rem.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {rem.title}
                    </h4>
                    <p className="text-xs text-slate-500">{rem.description}</p>
                    <div className="flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Due: {new Date(rem.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(rem.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isPastDue && (
                        <span className="ml-2 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {rem.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(rem.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}
                    {rem.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(rem.id, 'snoozed')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Snooze (12h)
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(rem.id, 'missed')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
                          title="Simulate missed follow-up escalation to caregiver"
                        >
                          Simulate Missed
                        </button>
                      </>
                    )}
                    {rem.status === 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(rem.id, 'pending')}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Re-open
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Custom Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddReminder}
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-fadeIn"
          >
            <h3 className="text-lg font-bold text-slate-900">Add Follow-up Reminder</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Title / Action Required
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Take BP Reading, Book GP Clinic Visit, Recheck Fever"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description / Clinical Details
              </label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional notes or instructions..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="recheck">Symptom Recheck</option>
                  <option value="gp_visit">GP Clinic Visit</option>
                  <option value="vitals_check">Vitals (BP/Sugar/Temp)</option>
                  <option value="medication">Medication Review</option>
                  <option value="custom">General Task</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due In</label>
                <select
                  value={newHours}
                  onChange={(e) => setNewHours(parseInt(e.target.value, 10))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={6}>6 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (Tomorrow)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between text-xs">
              <span className="text-teal-900 font-semibold">Auto-escalate to caregiver if missed?</span>
              <input
                type="checkbox"
                checked={newAutoEscalate}
                onChange={(e) => setNewAutoEscalate(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
