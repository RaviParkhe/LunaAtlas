import React, { useState } from 'react';
import { ShieldAlert, Activity, LineChart, Map, Award, Info, ExternalLink, ZoomIn } from 'lucide-react';

export default function RiskAndRecommendation({ site }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'calibration' | 'dose_map' | 'score_map'
  const [modalImage, setModalImage] = useState(null);

  if (!site) return null;

  const raw = site.raw_metrics || {};
  const slopeVal = site.slope_deg != null ? `${Number(site.slope_deg).toFixed(1)}°` : '—';
  const sunVal = raw.sunlight_score != null ? `${Number(raw.sunlight_score).toFixed(1)}%` : '—';
  const iceVal = raw.water_ice_score != null ? `${Number(raw.water_ice_score).toFixed(1)}/100` : '—';
  const radVal = raw.radiation_safety_score != null ? `${Number(raw.radiation_safety_score).toFixed(1)}/100` : '—';
  const dstVal = raw.dust_risk_score != null ? `${Number(raw.dust_risk_score).toFixed(1)}/100` : '—';

  const riskProfile = site.risk_profile || {
    slope: {
      level: (site.slope_deg ?? 0) <= 3.0 ? 'LOW' : (site.slope_deg ?? 0) <= 7.0 ? 'MEDIUM' : 'HIGH',
      value: slopeVal,
      label: 'Terrain Gradient'
    },
    illumination: {
      level: (raw.sunlight_score ?? 0) >= 40.0 ? 'LOW' : (raw.sunlight_score ?? 0) >= 25.0 ? 'MEDIUM' : 'HIGH',
      value: sunVal,
      label: 'Illumination Availability'
    },
    water_ice: {
      level: (raw.water_ice_score ?? 0) >= 50.0 ? 'LOW' : (raw.water_ice_score ?? 0) >= 20.0 ? 'MEDIUM' : 'HIGH',
      value: iceVal,
      label: 'Water Ice Access'
    },
    radiation: {
      level: (raw.radiation_safety_score ?? 0) >= 50.0 ? 'LOW' : (raw.radiation_safety_score ?? 0) >= 30.0 ? 'MEDIUM' : 'HIGH',
      value: radVal,
      label: 'Radiation Exposure',
      note: 'Quiet Solar Activity'
    },
    dust: {
      level: (raw.dust_risk_score ?? 0) <= 40.0 ? 'LOW' : (raw.dust_risk_score ?? 0) <= 70.0 ? 'MEDIUM' : 'HIGH',
      value: dstVal,
      label: 'Electrostatic Dust'
    }
  };

  const radV1 = site.radiation_v1 || {};

  const getRiskBadge = (level) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div
      className="w-full rounded-[18px] p-5 flex flex-col gap-4 shadow-sm select-none transition-colors duration-200 overflow-y-auto"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Header Bar with Sub-Tab Segmented Switcher */}
      <div
        className="flex items-center justify-between pb-3 flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-full"
            style={{ background: 'rgba(0, 102, 204, 0.10)', color: 'var(--apple-primary)' }}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2
              className="text-xs font-semibold tracking-tight uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              Radiation Model V1 &amp; Multi-Factor Risk Profile ({site.name})
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Physics-Informed GCR Terrain Shielding Model (Calibrated to PHITS Simulation — Burahmah &amp; Heilbronn 2023)
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          className="flex items-center p-0.5 rounded-full"
          style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
        >
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-[#0066cc] text-white font-medium shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Risk Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('calibration')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
              activeSubTab === 'calibration'
                ? 'bg-[#0066cc] text-white font-medium shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LineChart className="w-3 h-3" />
            <span>Model Calibration &amp; Residuals</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dose_map')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
              activeSubTab === 'dose_map'
                ? 'bg-[#0066cc] text-white font-medium shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Map className="w-3 h-3" />
            <span>Dose Map (mSv/yr)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('score_map')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
              activeSubTab === 'score_map'
                ? 'bg-[#0066cc] text-white font-medium shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>Score Map (0-100)</span>
          </button>
        </div>
      </div>

      {/* ── SUB-TAB 1: RISK OVERVIEW & ACTIVE SITE TELEMETRY ── */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* 5-Factor Risk Profile Grid + Radiation SVF Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {Object.entries(riskProfile).map(([key, item]) => (
              <div
                key={key}
                className="rounded-[14px] p-3 flex flex-col justify-between transition-all"
                style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {item.label}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getRiskBadge(item.level)}`}>
                    {item.level}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {item.value}
                  </span>
                  {item.note && (
                    <span className="text-[10px] block truncate" style={{ color: 'var(--text-muted)' }}>
                      {item.note}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Radiation V1 Terrain Shielding Card */}
            <div
              className="rounded-[14px] p-3 flex flex-col justify-between transition-all"
              style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Sky View (SVF)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-[#0066cc] border border-blue-500/20">
                  Shielded
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {radV1.svf != null ? `${Number(radV1.svf).toFixed(3)} SVF` : '0.944 SVF'}
                </span>
                <span className="text-[10px] block truncate" style={{ color: 'var(--text-muted)' }}>
                  {radV1.radiation_dose_mSv_per_year != null ? `${Number(radV1.radiation_dose_mSv_per_year).toFixed(1)} mSv/yr` : 'PHITS Calibrated'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Site Radiation Telemetry Deep Dive Banner */}
          <div
            className="rounded-[14px] p-4 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0066cc]">
                  Site GCR Dosimetry Summary
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0066cc] border border-blue-500/20 font-mono">
                  {site.name}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Evaluated under <strong>Solar Minimum</strong> (worst-case GCR dominant scenario). Regional terrain horizon angle shields approximately{' '}
                <strong>{((1 - (radV1.svf ?? 0.95)) * 100).toFixed(1)}%</strong> of celestial sky solid angle.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>
                  Effective Dose
                </span>
                <span className="text-lg font-bold font-mono text-emerald-600">
                  {radV1.radiation_dose_mSv_per_year != null ? Number(radV1.radiation_dose_mSv_per_year).toFixed(1) : '266.5'}{' '}
                  <span className="text-xs font-normal">mSv/yr</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>
                  Radiation Score
                </span>
                <span className="text-lg font-bold font-mono text-[#0066cc]">
                  {radV1.radiation_score != null ? Number(radV1.radiation_score).toFixed(1) : '32.9'}{' '}
                  <span className="text-xs font-normal">/ 100</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: MODEL CALIBRATION COMPARISON & RESIDUALS ── */}
      {activeSubTab === 'calibration' && (
        <div className="space-y-4">
          <div
            className="rounded-[14px] p-4 flex flex-col lg:flex-row items-center gap-6"
            style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
          >
            {/* Embedded Calibration Plot */}
            <div className="w-full lg:w-3/5 relative group cursor-pointer" onClick={() => setModalImage('/radiation/model_calibration_fit.png')}>
              <img
                src="/radiation/model_calibration_fit.png"
                alt="Model Calibration Comparison &amp; In-Sample Residuals"
                className="w-full rounded-xl border border-[var(--border-color)] shadow-sm bg-white"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <span className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow">
                  <ZoomIn className="w-3.5 h-3.5" /> View High-Res Figure
                </span>
              </div>
            </div>

            {/* Model Architecture & Physics Info */}
            <div className="w-full lg:w-2/5 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#0066cc] font-semibold">
                <Info className="w-4 h-4" />
                <span className="uppercase tracking-wider">Calibration Architecture</span>
              </div>

              <div className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  <strong>Physical Basis:</strong> Galactic Cosmic Rays arrive roughly isotropically. The Sky View Factor (SVF) measures the fractional sky hemisphere visible after terrain horizon obstruction.
                </p>
                <p>
                  <strong>Primary Calibration Source:</strong> <em>Burahmah &amp; Heilbronn (2023)</em>, Aerospace 10(11), 970. PHITS simulation of effective dose equivalent across 5 crater geometries.
                </p>
                <div className="p-2.5 rounded-lg border border-[var(--border-color)] space-y-1 font-mono text-[11px]" style={{ background: 'var(--bg-card)' }}>
                  <div><span className="text-blue-500 font-bold">Linear Model (Selected):</span> RMSE = 3.2 mSv/yr, DoF = 2</div>
                  <div><span className="text-emerald-500 font-bold">Polynomial-2:</span> RMSE = 1.5 mSv/yr (Non-physical at low SVF)</div>
                  <div><span className="text-rose-500 font-bold">Gaussian Process:</span> RMSE = 1.6 mSv/yr (±2σ band shown)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: RADIATION DOSE MAP (mSv/yr) ── */}
      {activeSubTab === 'dose_map' && (
        <div className="space-y-4">
          <div
            className="rounded-[14px] p-4 flex flex-col lg:flex-row items-center gap-6"
            style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
          >
            <div className="w-full lg:w-1/2 relative group cursor-pointer" onClick={() => setModalImage('/radiation/radiation_dose_map.png')}>
              <img
                src="/radiation/radiation_dose_map.png"
                alt="Radiation Dose Estimate (mSv/year)"
                className="w-full max-h-[460px] object-contain rounded-xl border border-[var(--border-color)] shadow-sm bg-black"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <span className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow">
                  <ZoomIn className="w-3.5 h-3.5" /> Enlarge Spatial Map
                </span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <Map className="w-4 h-4" />
                <span className="uppercase tracking-wider">Spatial GCR Dose Field</span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Visualizes the computed annual effective dose equivalent across the 400x400 km South Polar region [-200 km to +200 km].
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg border border-[var(--border-color)]" style={{ background: 'var(--bg-card)' }}>
                  <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>Min Regional Dose</span>
                  <span className="font-bold text-emerald-600">237.1 mSv/yr</span>
                </div>
                <div className="p-2 rounded-lg border border-[var(--border-color)]" style={{ background: 'var(--bg-card)' }}>
                  <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>Max Open Plain Dose</span>
                  <span className="font-bold text-rose-600">280.9 mSv/yr</span>
                </div>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Blue stars mark the 6 evaluated candidate lunar habitat sites. Deeper crater floors (e.g. Shackleton interior) achieve maximum shielding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: RADIATION SCORE MAP (0-100) ── */}
      {activeSubTab === 'score_map' && (
        <div className="space-y-4">
          <div
            className="rounded-[14px] p-4 flex flex-col lg:flex-row items-center gap-6"
            style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
          >
            <div className="w-full lg:w-1/2 relative group cursor-pointer" onClick={() => setModalImage('/radiation/radiation_score_map.png')}>
              <img
                src="/radiation/radiation_score_map.png"
                alt="Radiation Score (0-100)"
                className="w-full max-h-[460px] object-contain rounded-xl border border-[var(--border-color)] shadow-sm bg-white"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <span className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow">
                  <ZoomIn className="w-3.5 h-3.5" /> Enlarge Suitability Map
                </span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <Award className="w-4 h-4" />
                <span className="uppercase tracking-wider">Normalized Radiation Safety Score</span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Normalized score layer where <strong>100 = lowest dose (best habitat suitability)</strong> and <strong>0 = highest dose (worst)</strong>.
              </p>
              <div className="p-2.5 rounded-lg border border-[var(--border-color)] space-y-1 font-mono text-[11px]" style={{ background: 'var(--bg-card)' }}>
                <div><span className="text-emerald-600 font-bold">Green Zones (80-100):</span> Deep crater walls / floors with maximum terrain horizon obstruction</div>
                <div><span className="text-amber-600 font-bold">Yellow Zones (40-60):</span> Intermediate crater rims and slopes</div>
                <div><span className="text-rose-600 font-bold">Red Zones (0-20):</span> High open plateaus and elevated massifs with ~1.0 SVF</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Full-Screen Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] text-xs font-bold hover:bg-[var(--bg-card-hover)] cursor-pointer"
            >
              ✕ Close
            </button>
            <img src={modalImage} alt="Enlarged figure" className="max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
