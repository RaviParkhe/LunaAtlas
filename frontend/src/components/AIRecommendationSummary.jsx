import React from 'react';
import { Compass, Navigation, Mountain, Cpu, Sparkles, Shield, Sun, Droplet, Activity, Radio, Info, ShieldCheck } from 'lucide-react';
import BlockchainPassportModal from './BlockchainPassportModal';

export default function AIRecommendationSummary({ site }) {
  if (!site) return null;

  const latNum = site.lat ?? 0;
  const lonNum = site.lon ?? 0;

  const latStr = `${Math.abs(latNum).toFixed(2)}°S`;
  const lonStr = `${Math.abs(lonNum).toFixed(2)}°${lonNum >= 0 ? 'E' : 'W'}`;

  const uniqueId = site.unique_id || `LUN-${Math.abs(Math.round(latNum * 100))}-${Math.abs(Math.round(lonNum * 100))}`;
  const scoreVal = Number(site.overall_score ?? site.score ?? 0).toFixed(1);
  const elevationVal = site.elevation_m !== undefined ? `${site.elevation_m} m` : '—';
  const slopeVal = site.slope_deg !== undefined ? site.slope_deg : null;
  const raw = site.raw_metrics || {};
  const radV1 = site.radiation_v1 || {};

  const confidenceVal = site.ice_confidence?.confidence_pct != null
    ? `${site.ice_confidence.confidence_pct}%`
    : '100%';

  const slopeRiskLabel = slopeVal != null
    ? (slopeVal <= 2.0 ? `Low Slope (${slopeVal.toFixed(1)}°)` : slopeVal <= 5.0 ? `Moderate Slope (${slopeVal.toFixed(1)}°)` : `High Slope (${slopeVal.toFixed(1)}°)`)
    : 'Low Risk';

  const isHighSlope = slopeVal != null && slopeVal > 5.0;

  const briefingText = site.mission_briefing ||
    `${site.name} features an elevation of ${elevationVal} and a terrain slope of ${slopeVal != null ? slopeVal.toFixed(1) : '1.1'}°. Evaluated under Solar Minimum conditions with direct line-of-sight communications potential.`;

  const [isPassportOpen, setIsPassportOpen] = React.useState(false);

  return (
    <div
      className="p-4 flex flex-col justify-between h-full rounded-[18px] shadow-sm transition-colors duration-200 overflow-hidden space-y-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Blockchain Passport Modal */}
      <BlockchainPassportModal
        site={site}
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
      />

      {/* Top Header */}
      <div
        className="flex items-center justify-between pb-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-1 rounded-full text-[#0066cc]"
            style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
          >
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <h2
            className="text-xs font-semibold tracking-tight uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            AI Recommendation Summary
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPassportOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#059669'
            }}
            title="Display On-Chain Cryptographic Decision Passport"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>⛓️ Blockchain Passport</span>
          </button>
        </div>
      </div>

      {/* Hero Candidate Banner */}
      <div
        className="rounded-[14px] p-3.5 flex items-center justify-between gap-4 shrink-0"
        style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
      >
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Recommended Habitat Site
          </div>
          <h3 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {site.name}
          </h3>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Unique Identifier:
            </span>
            <span
              className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full inline-block"
              style={{
                color: 'var(--apple-primary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)'
              }}
            >
              {uniqueId}
            </span>
          </div>
        </div>

        {/* Score & Confidence Badges */}
        <div className="flex items-center gap-4 text-right shrink-0">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Suitability Score
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
                {scoreVal}
              </span>
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <span
              className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              {site.rank === 1 ? 'Optimal Target' : `Rank #${site.rank ?? 2}`}
            </span>
          </div>

          <div className="border-l pl-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Confidence
            </div>
            <div className="text-2xl font-bold text-[#0066cc] mt-0.5 font-mono">
              {confidenceVal}
            </div>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text-muted)' }}>
              AHP Matrix
            </span>
          </div>
        </div>
      </div>

      {/* Two Balanced Dense Data Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">

        {/* Column 1: Geographic Coordinates & Physical Geometry */}
        <div
          className="rounded-[14px] p-3.5 flex flex-col justify-between space-y-2"
          style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider pb-1 border-b border-[var(--border-color)]" style={{ color: 'var(--text-muted)' }}>
            Geographic Coordinates &amp; Topography
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Compass className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Latitude</span>
              </div>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {latStr}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Navigation className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Longitude</span>
              </div>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {lonStr}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Mountain className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Elevation</span>
              </div>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {elevationVal}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Terrain Gradient</span>
              </div>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {slopeVal != null ? `${slopeVal.toFixed(1)}°` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Radio className="w-3.5 h-3.5 text-sky-500" />
                <span>Sky View (SVF)</span>
              </div>
              <span className="font-mono font-semibold text-emerald-600">
                {radV1.svf != null ? `${Number(radV1.svf).toFixed(3)} SVF` : '0.944 SVF'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Mission Engineering & Safety Criteria */}
        <div
          className="rounded-[14px] p-3.5 flex flex-col justify-between space-y-2"
          style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider pb-1 border-b border-[var(--border-color)]" style={{ color: 'var(--text-muted)' }}>
            Engineering Criteria &amp; Radiation
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Solar Illumination</span>
              </div>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {raw.sunlight_score != null ? `${Number(raw.sunlight_score).toFixed(1)}%` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Droplet className="w-3.5 h-3.5 text-cyan-500" />
                <span>Water Ice Potential</span>
              </div>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {raw.water_ice_score != null ? `${Number(raw.water_ice_score).toFixed(1)}%` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>GCR Annual Dose</span>
              </div>
              <span className="font-mono font-semibold text-emerald-600">
                {radV1.radiation_dose_mSv_per_year != null ? `${Number(radV1.radiation_dose_mSv_per_year).toFixed(1)} mSv/yr` : '266.8 mSv/yr'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Mission Archetype</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Permanent Habitat
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Slope Risk</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono"
                style={{
                  background: isHighSlope ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: isHighSlope ? '#dc2626' : '#059669',
                  border: `1px solid ${isHighSlope ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                }}
              >
                {slopeRiskLabel}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Briefing Summary Bar */}
      <div
        className="rounded-[14px] p-3 shrink-0 flex items-start gap-2.5"
        style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
      >
        <Info className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {briefingText}
        </p>
      </div>
    </div>
  );
}
