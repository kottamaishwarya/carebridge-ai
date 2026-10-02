import React from 'react';
import { BodyArea } from '../types';

interface BodyMapProps {
  selectedArea: BodyArea | null;
  onSelectArea: (area: BodyArea) => void;
  activeAreas?: BodyArea[];
}

export const BodyMap: React.FC<BodyMapProps> = ({ selectedArea, onSelectArea, activeAreas = [] }) => {
  const areas: { id: BodyArea; name: string; labelEn: string; labelHi: string }[] = [
    { id: 'head', name: 'Head & Brain', labelEn: 'Head (Headache, Dizziness, Vision)', labelHi: 'सिर (दर्द, चक्कर)' },
    { id: 'throat', name: 'Throat & Neck', labelEn: 'Throat (Soreness, Difficulty Swallowing)', labelHi: 'गला (खराश, दर्द)' },
    { id: 'chest', name: 'Chest & Heart', labelEn: 'Chest (Tightness, Pain, Palpitations)', labelHi: 'छाती (जकड़न, दर्द)' },
    { id: 'respiratory', name: 'Lungs & Breathing', labelEn: 'Breathing (Shortness of breath, Cough)', labelHi: 'सांस (फूलना, खांसी)' },
    { id: 'abdomen', name: 'Abdomen & Stomach', labelEn: 'Abdomen (Stomach ache, Nausea, Cramps)', labelHi: 'पेट (दर्द, उल्टी)' },
    { id: 'back', name: 'Back & Spine', labelEn: 'Back (Lower back pain, Stiffness)', labelHi: 'पीठ (दर्द, अकड़न)' },
    { id: 'limbs', name: 'Arms & Legs', labelEn: 'Arms & Legs (Weakness, Swelling, Joint pain)', labelHi: 'हाथ-पैर (कमजोरी, सूजन)' },
    { id: 'skin', name: 'Skin & Rash', labelEn: 'Skin (Rash, Itching, Hives, Discoloration)', labelHi: 'त्वचा (दाने, खुजली)' },
    { id: 'systemic', name: 'Whole Body / General', labelEn: 'Systemic (Fever, Chills, Fatigue, Body Ache)', labelHi: 'पूरा शरीर (बुखार, थकान)' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Interactive Body Area Explorer</h4>
          <p className="text-xs text-slate-500">Tap a body region to pinpoint or filter symptoms</p>
        </div>
        {selectedArea && (
          <button
            onClick={() => onSelectArea('systemic')}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Visual Body Diagram (SVG) */}
        <div className="md:col-span-5 flex justify-center py-2">
          <div className="relative w-48 h-80 bg-slate-50 rounded-2xl border border-slate-200 p-2 flex items-center justify-center">
            <svg
              viewBox="0 0 200 350"
              className="w-full h-full max-h-72 drop-shadow-sm select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Head */}
              <circle
                cx="100"
                cy="45"
                r="25"
                onClick={() => onSelectArea('head')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'head' || activeAreas.includes('head')
                    ? 'fill-teal-500 stroke-teal-700 stroke-2'
                    : 'fill-slate-200 hover:fill-teal-200 stroke-slate-400'
                }`}
              />
              {/* Neck / Throat */}
              <rect
                x="92"
                y="70"
                width="16"
                height="15"
                rx="3"
                onClick={() => onSelectArea('throat')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'throat' || activeAreas.includes('throat')
                    ? 'fill-teal-500 stroke-teal-700 stroke-2'
                    : 'fill-slate-300 hover:fill-teal-200 stroke-slate-400'
                }`}
              />
              {/* Chest / Thorax */}
              <path
                d="M 65 85 L 135 85 L 125 145 L 75 145 Z"
                onClick={() => onSelectArea('chest')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'chest' || activeAreas.includes('chest')
                    ? 'fill-rose-500 stroke-rose-700 stroke-2'
                    : 'fill-slate-200 hover:fill-rose-200 stroke-slate-400'
                }`}
              />
              {/* Abdomen */}
              <path
                d="M 75 147 L 125 147 L 120 200 L 80 200 Z"
                onClick={() => onSelectArea('abdomen')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'abdomen' || activeAreas.includes('abdomen')
                    ? 'fill-amber-500 stroke-amber-700 stroke-2'
                    : 'fill-slate-200 hover:fill-amber-200 stroke-slate-400'
                }`}
              />
              {/* Left Arm */}
              <path
                d="M 60 90 L 35 150 L 25 190 L 35 195 L 48 155 L 65 110 Z"
                onClick={() => onSelectArea('limbs')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'limbs' || activeAreas.includes('limbs')
                    ? 'fill-teal-500 stroke-teal-700 stroke-2'
                    : 'fill-slate-200 hover:fill-teal-200 stroke-slate-400'
                }`}
              />
              {/* Right Arm */}
              <path
                d="M 140 90 L 165 150 L 175 190 L 165 195 L 152 155 L 135 110 Z"
                onClick={() => onSelectArea('limbs')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'limbs' || activeAreas.includes('limbs')
                    ? 'fill-teal-500 stroke-teal-700 stroke-2'
                    : 'fill-slate-200 hover:fill-teal-200 stroke-slate-400'
                }`}
              />
              {/* Left Leg */}
              <path
                d="M 80 202 L 72 270 L 68 330 L 82 330 L 92 270 L 98 202 Z"
                onClick={() => onSelectArea('limbs')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'limbs' || activeAreas.includes('limbs')
                    ? 'fill-teal-500 stroke-teal-700 stroke-2'
                    : 'fill-slate-200 hover:fill-teal-200 stroke-slate-400'
                }`}
              />
              {/* Right Leg */}
              <path
                d="M 102 202 L 108 270 L 118 330 L 132 330 L 128 270 L 120 202 Z"
                onClick={() => onSelectArea('limbs')}
                className={`cursor-pointer transition-all ${
                  selectedArea === 'limbs' || activeAreas.includes('limbs')
                    ? 'fill-teal-500 stroke-teal-700 stroke-2'
                    : 'fill-slate-200 hover:fill-teal-200 stroke-slate-400'
                }`}
              />
            </svg>
            <div className="absolute bottom-2 text-[10px] text-slate-400 font-mono">
              Click regions to isolate
            </div>
          </div>
        </div>

        {/* Region Buttons & Info */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {areas.map((a) => {
            const isSelected = selectedArea === a.id;
            const hasActiveSymptom = activeAreas.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => onSelectArea(a.id)}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs flex items-start justify-between ${
                  isSelected
                    ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-2 ring-teal-500/20'
                    : hasActiveSymptom
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span>{a.name}</span>
                    {hasActiveSymptom && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{a.labelEn}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
