import React from 'react';
import { ShieldAlert } from 'lucide-react';

function getRiskStyle(level) {
  switch (level) {
    case 'LOW':
      return { bg: 'rgba(16,185,129,0.08)', text: '#059669', border: 'rgba(16,185,129,0.25)' };
    case 'MEDIUM':
      return { bg: 'rgba(245,158,11,0.08)', text: '#d97706', border: 'rgba(245,158,11,0.25)' };
    case 'HIGH':
      return { bg: 'rgba(239,68,68,0.08)', text: '#dc2626', border: 'rgba(239,68,68,0.25)' };
    default:
      return { bg: 'var(--apple-parchment)', text: 'var(--text-muted)', border: 'var(--border-color)' };
  }
}

export default function RiskStripInline({ site }) {
  if (!site) return null;

  const raw = site.raw_metrics || {};
  const radV1 = site.radiation_v1 || {};

  const slopeVal = site.slope_deg != null ? `${Number(site.slope_deg).toFixed(1)}°` : '—';
  const sunVal   = raw.sunlight_score != null ? `${Number(raw.sunlight_score).toFixed(1)}%` : '—';
  const iceVal   = raw.water_ice_score != null ? `${Number(raw.water_ice_score).toFixed(1)}/100` : '—';
  const radVal   = raw.radiation_safety_score != null ? `${Number(raw.radiation_safety_score).toFixed(1)}/100` : '—';
  const dstVal   = raw.dust_risk_score != null ? `${Number(raw.dust_risk_score).toFixed(1)}/100` : '—';

  const riskProfile = site.risk_profile || {
    slope: {
      level: (site.slope_deg ?? 0) <= 3.0 ? 'LOW' : (site.slope_deg ?? 0) <= 7.0 ? 'MEDIUM' : 'HIGH',
      value: slopeVal, label: 'Terrain Gradient',
    },
    illumination: {
      level: (raw.sunlight_score ?? 0) >= 40.0 ? 'LOW' : (raw.sunlight_score ?? 0) >= 25.0 ? 'MEDIUM' : 'HIGH',
      value: sunVal, label: 'Illumination Availability',
    },
    water_ice: {
      level: (raw.water_ice_score ?? 0) >= 50.0 ? 'LOW' : (raw.water_ice_score ?? 0) >= 20.0 ? 'MEDIUM' : 'HIGH',
      value: iceVal, label: 'Water Ice Access',
    },
    radiation: {
      level: (raw.radiation_safety_score ?? 0) >= 50.0 ? 'LOW' : (raw.radiation_safety_score ?? 0) >= 30.0 ? 'MEDIUM' : 'HIGH',
      value: radVal, label: 'Radiation Exposure',
      note: 'Quiet Solar Activity',
    },
    dust: {
      level: (raw.dust_risk_score ?? 0) <= 40.0 ? 'LOW' : (raw.dust_risk_score ?? 0) <= 70.0 ? 'MEDIUM' : 'HIGH',
      value: dstVal, label: 'Electrostatic Dust',
    },
  };

  const svfCard = {
    label: 'Sky View (SVF)',
    badgeLabel: 'Shielded',
    badgeStyle: { bg: 'rgba(0,102,204,0.08)', text: 'var(--apple-primary)', border: 'rgba(0,102,204,0.25)' },
    value: radV1.svf != null ? `${Number(radV1.svf).toFixed(3)} SVF` : '—',
    note: radV1.radiation_dose_mSv_per_year != null
      ? `${Number(radV1.radiation_dose_mSv_per_year).toFixed(1)} mSv/yr`
      : null,
  };

  const allCards = [
    ...Object.entries(riskProfile).map(([, item]) => ({ ...item })),
    null, // sentinel for svf card
  ];

  return (
    <div
      className="rounded-[14px] px-4 py-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-2 pb-2 mb-2.5"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <ShieldAlert className="w-3.5 h-3.5" style={{ color: 'var(--apple-primary)' }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          XAI Multi-Factor Risk &amp; Radiation V1 Profile — {site.name}
        </span>
      </div>

      {/* Cards strip — one row, equal width cards */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>

        {Object.entries(riskProfile).map(([key, item]) => {
          const rs = getRiskStyle(item.level);
          return (
            <div
              key={key}
              className="rounded-[10px] px-3 py-2 flex flex-col gap-1"
              style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {item.label}
                </span>
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded-full"
                  style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}
                >
                  {item.level}
                </span>
              </div>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </span>
              {item.note && (
                <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {item.note}
                </span>
              )}
            </div>
          );
        })}

        {/* SVF Shielding Card */}
        <div
          className="rounded-[10px] px-3 py-2 flex flex-col gap-1"
          style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {svfCard.label}
            </span>
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold rounded-full"
              style={{
                background: svfCard.badgeStyle.bg,
                color: svfCard.badgeStyle.text,
                border: `1px solid ${svfCard.badgeStyle.border}`,
              }}
            >
              {svfCard.badgeLabel}
            </span>
          </div>
          <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {svfCard.value}
          </span>
          {svfCard.note && (
            <span className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
              {svfCard.note}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
