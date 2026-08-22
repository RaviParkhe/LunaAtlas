import React from 'react';
import { ShieldAlert, Droplets, ExternalLink, ShieldCheck, Activity } from 'lucide-react';

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

  const radV1 = site?.radiation_v1 || {
    svf: 0.944,
    radiation_dose_mSv_per_year: 266.8,
    radiation_score: 32.3
  };

  const siteName = site?.name || 'Faustini Rim';
  const passportUrl = `/api/blockchain/passport/${encodeURIComponent(siteName)}`;

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
    <div className="w-full p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#0066cc]" />
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            XAI Multi-Factor Risk & Radiation V1 Profile
          </h2>
        </div>
      </div>

      {/* 5-Factor Risk Profile Grid + Radiation SVF Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {Object.entries(riskProfile).map(([key, item]) => (
          <div
            key={key}
            className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.label}</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getRiskBadge(item.level)}`}>
                {item.level}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-sm font-semibold font-mono text-[var(--text-primary)]">{item.value}</span>
              {item.note && <span className="text-[10px] text-[var(--text-muted)] block truncate">{item.note}</span>}
            </div>
          </div>
        ))}

        {/* Radiation V1 Terrain Shielding Card */}
        <div className="bg-[var(--apple-parchment)] rounded-[14px] p-3 border border-[var(--border-color)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Sky View (SVF)</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-[#0066cc] border border-blue-500/20">
              Shielded
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-semibold font-mono text-[var(--text-primary)]">{radV1.svf?.toFixed(3)} SVF</span>
            <span className="text-[10px] text-[var(--text-muted)] block truncate">PHITS Calibrated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
