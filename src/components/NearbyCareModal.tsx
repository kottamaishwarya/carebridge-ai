import React, { useState } from 'react';
import { X, MapPin, Phone, ExternalLink, Navigation, Building2, Stethoscope, Pill, Video } from 'lucide-react';

interface NearbyCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedCategory?: 'emergency' | 'gp_clinic' | 'teleconsult' | 'self_care';
}

interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'teleconsult';
  distance: string;
  address: string;
  hours: string;
  phone: string;
  is24x7: boolean;
  verified: boolean;
}

const SAMPLE_FACILITIES: Facility[] = [
  {
    id: 'fac-1',
    name: 'City Apex Multi-Specialty Hospital & Trauma Center',
    type: 'hospital',
    distance: '1.2 km',
    address: 'Ring Road Junction, Sector 4, Metro Corridor',
    hours: '24 Hours Emergency & Ambulance Services',
    phone: '+91 11 2659 0000',
    is24x7: true,
    verified: true,
  },
  {
    id: 'fac-2',
    name: 'CarePulse Primary Care Clinic & Diagnostics',
    type: 'clinic',
    distance: '0.6 km',
    address: '24 Community Center, Main Market Road',
    hours: 'Open 8:00 AM - 9:00 PM',
    phone: '+91 98101 22334',
    is24x7: false,
    verified: true,
  },
  {
    id: 'fac-3',
    name: 'Apollo 24|7 Verified Teleconsultation Network',
    type: 'teleconsult',
    distance: 'Instant Online',
    address: 'Video consultation on mobile or web',
    hours: 'Available 24x7 with General Physicians & Specialists',
    phone: '1860 500 0247',
    is24x7: true,
    verified: true,
  },
  {
    id: 'fac-4',
    name: 'MedPlus 24-Hour Pharmacy & First Aid',
    type: 'pharmacy',
    distance: '0.4 km',
    address: 'Shop 12, Ground Floor, Central Plaza',
    hours: 'Open 24/7 (Prescription & OTC medicines)',
    phone: '+91 80 4455 6677',
    is24x7: true,
    verified: true,
  },
  {
    id: 'fac-5',
    name: 'District Government Civil Hospital (Free OPD & Emergency)',
    type: 'hospital',
    distance: '3.4 km',
    address: 'Civil Lines, Near Railway Station',
    hours: '24 Hours Emergency Department',
    phone: '108',
    is24x7: true,
    verified: true,
  },
];

export const NearbyCareModal: React.FC<NearbyCareModalProps> = ({
  isOpen,
  onClose,
  recommendedCategory,
}) => {
  const [filter, setFilter] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy' | 'teleconsult'>('all');
  const [simulatedDirections, setSimulatedDirections] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredFacilities = SAMPLE_FACILITIES.filter((f) => {
    if (filter === 'all') return true;
    return f.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Nearby Healthcare Services</h3>
              <p className="text-xs text-slate-500">Verified hospitals, clinics, teleconsultations & pharmacies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Services', icon: MapPin },
            { id: 'hospital', label: 'Hospitals & Emergency', icon: Building2 },
            { id: 'clinic', label: 'GP Clinics', icon: Stethoscope },
            { id: 'teleconsult', label: 'Teleconsultation', icon: Video },
            { id: 'pharmacy', label: 'Pharmacies', icon: Pill },
          ].map((item) => {
            const Icon = item.icon;
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  active
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* List of facilities */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {simulatedDirections && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between animate-fadeIn">
              <span>Navigating to: <strong>{simulatedDirections}</strong> (Est. travel time 8 mins via fastest route)</span>
              <button onClick={() => setSimulatedDirections(null)} className="text-teal-700 font-bold hover:underline">
                Clear
              </button>
            </div>
          )}

          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/20 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{fac.name}</h4>
                    {fac.is24x7 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        24x7
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{fac.address}</span>
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                  {fac.distance}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span>⏱ {fac.hours}</span>
              </div>

              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <a
                  href={`tel:${fac.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {fac.phone}</span>
                </a>
                <button
                  onClick={() => setSimulatedDirections(fac.name)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
