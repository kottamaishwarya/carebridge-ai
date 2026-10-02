import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, ArrowRight, MapPin, Send } from 'lucide-react';
import { INDIA_EMERGENCY_NUMBERS } from '../engine/careMapper';
import { RedFlagRule } from '../types';

interface EmergencyBannerProps {
  redFlags?: RedFlagRule[];
  onOpenNearbyCare?: () => void;
  onNotifyCaregiver?: () => void;
  caregiverNotified?: boolean;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  redFlags = [],
  onOpenNearbyCare,
  onNotifyCaregiver,
  caregiverNotified = false,
}) => {
  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-red-500/20 border-2 border-red-400/40 relative overflow-hidden animate-fadeIn">
      {/* Background visual watermarks */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
        <AlertOctagon className="w-64 h-64 text-white" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
            <AlertOctagon className="w-7 h-7 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">
              Urgent Priority Alert
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Immediate Emergency Care Needed
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-red-50 max-w-2xl leading-relaxed">
          Critical warning signs have been detected by our deterministic red-flag safety protocols.
          Please do not wait or drive yourself. Contact emergency response personnel or proceed to the nearest emergency department right now.
        </p>

        {redFlags.length > 0 && (
          <div className="bg-black/20 rounded-xl p-4 border border-white/10 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>Triggered Safety Rule(s):</span>
            </div>
            <ul className="list-disc list-inside text-xs sm:text-sm text-red-100 space-y-1">
              {redFlags.map((rf) => (
                <li key={rf.id}>
                  <strong className="text-white">{rf.title}:</strong> {rf.emergencyActionText}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Emergency Call Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={`tel:${INDIA_EMERGENCY_NUMBERS.general}`}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-red-700 hover:bg-red-50 rounded-xl font-bold text-base shadow-lg transition-transform active:scale-95"
          >
            <PhoneCall className="w-5 h-5 text-red-600 animate-bounce" />
            <span>Call 112 (National Emergency)</span>
          </a>

          <a
            href={`tel:${INDIA_EMERGENCY_NUMBERS.ambulance}`}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-6 py-3.5 bg-red-950/60 text-white hover:bg-red-950/80 border border-white/20 rounded-xl font-bold text-base transition-transform active:scale-95"
          >
            <PhoneCall className="w-5 h-5 text-amber-300" />
            <span>Call 108 (Ambulance)</span>
          </a>

          {onOpenNearbyCare && (
            <button
              onClick={onOpenNearbyCare}
              className="px-4 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Find Nearest Hospital</span>
            </button>
          )}

          {onNotifyCaregiver && (
            <button
              onClick={onNotifyCaregiver}
              disabled={caregiverNotified}
              className={`px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                caregiverNotified
                  ? 'bg-emerald-700 text-white cursor-default'
                  : 'bg-amber-400 text-slate-900 hover:bg-amber-300'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{caregiverNotified ? 'Caregiver Notified (SMS Sent)' : 'Alert Family Caregiver Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
