import React from 'react';
import { ShieldAlert, Home, Zap, Users, Maximize, Clock, Droplets } from 'lucide-react';

export default function RiskAndRecommendation({ site }) {
  const riskProfile = site?.risk_profile || {
    slope: { level: 'LOW', value: '1.1°', label: 'Terrain Gradient' },
    illumination: { level: 'LOW', value: '42.0%', label: 'Illumination' },
    water_ice: { level: 'MEDIUM', value: '22.0/100', label: 'Water Ice Access' },
    radiation: { level: 'LOW', value: '57.0/100', label: 'Radiation Exposure', note: 'Quiet Solar Activity' },
    dust: { level: 'MEDIUM', value: '48.0/100', label: 'Electrostatic Dust' }
  };

  const iceConf = site?.ice_confidence || {
    confidence_pct: 36.7,
    label: 'Moderate Volatile Signatures'
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Risk Assessment & Ice Confidence Box */}
      <div className="col-span-12 xl:col-span-5 p-5 flex flex-col justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#0066cc]" />
            <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
              XAI Risk & Ice Confidence
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] text-[#0066cc] text-[11px] font-medium">
            <Droplets className="w-3 h-3" />
            <span>Ice: {iceConf.confidence_pct}%</span>
          </div>
        </div>

        {/* 5-Factor Risk Profile Grid */}
        <div className="space-y-2 text-xs flex-1">
          {Object.entries(riskProfile).map(([key, item]) => (
            <div
              key={key}
              className="bg-[var(--apple-parchment)] rounded-[12px] p-2.5 border border-[var(--border-color)] flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[var(--text-primary)] font-medium block">{item.label}</span>
                {item.note && <span className="text-[10px] text-[var(--text-muted)] block">{item.note}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-secondary)]">{item.value}</span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getRiskBadge(item.level)}`}>
                  {item.level} Risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Habitat Recommendation Box */}
      <div className="col-span-12 xl:col-span-7 p-5 flex flex-col justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-3.5">
          <Home className="w-4 h-4 text-[#0066cc]" />
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            Habitat Recommendation & Architecture
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs flex-1">
          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] mb-2">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Habitat Structure</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 text-xs">Modular In-Situ Rim Base</div>
            </div>
          </div>

          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] mb-2">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Primary Power Grid</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 text-xs">Hybrid Solar + Fission</div>
            </div>
          </div>

          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] mb-2">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Crew Capacity</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 text-xs">11-20 Astronauts</div>
            </div>
          </div>

          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] mb-2">
              <Maximize className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Clearance Buffer</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 text-xs">5.0 km Buffer Zone</div>
            </div>
          </div>

          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] mb-2">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium">Mission Life</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 text-xs">Permanent Station</div>
            </div>
          </div>

          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] mb-2">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium">ISRU Feasibility</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 text-xs">Cryogenic Extraction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
