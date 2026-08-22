import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sun, 
  Droplet, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Compass, 
  Sparkles, 
  TrendingUp, 
  MapPin,
  Rotate3d,
  Layers2,
  Wind,
  Thermometer,
  Expand,
  Activity
} from 'lucide-react';
import MoonViewer2D from './MoonViewer2D';
import MoonViewer3D from './MoonViewer3D';

export default function MissionAnalysisView({
  rankedSites,
  selectedSite,
  onSelectSite,
  gridHeatmap,
  activeLayer,
  onChangeLayer
}) {
  const [viewMode, setViewMode] = useState('2d');

  const site = selectedSite || (rankedSites && rankedSites[0]) || {
    name: 'Shackleton Crater Rim',
    overall_score: 94.0,
    lat: -89.67,
    lon: 129.78,
    elevation_m: 1926.5,
    slope_deg: 2.8,
    raw_metrics: {
      sunlight_score: 53.3,
      water_ice_score: 0.0,
      landing_suitability_score: 86.0,
      radiation_safety_score: 56.8,
      dust_risk_score: 18.7
    },
    explanation: 'High solar illumination provides reliable photovoltaic energy. Direct access to adjacent cold traps enables in-situ resource extraction.'
  };

  const top3 = rankedSites ? rankedSites.slice(0, 3) : [];

  const getSuitabilityBadge = (score) => {
    if (score >= 80) return { label: 'EXCELLENT', color: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' };
    if (score >= 65) return { label: 'VERY GOOD', color: 'text-cyan-400', bg: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300' };
    if (score >= 45) return { label: 'GOOD', color: 'text-blue-400', bg: 'bg-blue-950/80 border-blue-500/60 text-blue-300' };
    return { label: 'FAIR', color: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-500/60 text-amber-300' };
  };

  const suitability = getSuitabilityBadge(site.overall_score || 85);

  return (
    <div className="grid grid-cols-12 gap-4 p-4 text-xs select-none">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Map, Recommendations & AI Explanation (Span 6)                */}
      {/* ========================================================================= */}
      <div className="col-span-6 flex flex-col space-y-4">
        {/* Card 1: Moon Map */}
        <div className="hud-panel p-3.5 flex flex-col space-y-3">
          {/* Map Controls Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase font-mono shadow-sm">
                MOON MAP
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                Lunar South Pole (400×400 km)
              </span>
            </div>

            {/* 2D / 3D Switcher */}
            <div className="flex items-center space-x-1 bg-[#060b18] p-1 rounded-lg border border-[#15223c]">
              <button
                onClick={() => setViewMode('2d')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-[10px] font-bold transition font-mono ${
                  viewMode === '2d'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers2 className="w-3 h-3 text-cyan-300" />
                <span>2D GRID</span>
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-[10px] font-bold transition font-mono ${
                  viewMode === '3d'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Rotate3d className="w-3 h-3 text-cyan-300" />
                <span>3D GLOBE</span>
              </button>
            </div>
          </div>

          {/* Layer Pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { id: 'overall_score', label: 'Composite Score' },
              { id: 'landing_suitability_score', label: 'Terrain & Flatness' },
              { id: 'ice_score', label: 'Water Ice (PSR)' },
              { id: 'sunlight_score', label: 'Sunlight Availability' },
              { id: 'radiation_safety_score', label: 'Radiation Shielding' },
              { id: 'dust_risk_score', label: 'Dust Risk' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => onChangeLayer(l.id)}
                className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold transition ${
                  activeLayer === l.id
                    ? 'bg-blue-600/30 border-blue-400 text-cyan-200 shadow-sm'
                    : 'bg-[#070d1e] border-[#15223c] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Viewer Frame */}
          <div className="h-[340px] w-full rounded-lg overflow-hidden border border-[#15223c]">
            {viewMode === '2d' ? (
              <MoonViewer2D
                gridData={gridHeatmap}
                activeLayer={activeLayer}
                namedSites={rankedSites}
                selectedSite={site}
                onSelectSite={onSelectSite}
              />
            ) : (
              <MoonViewer3D
                namedSites={rankedSites}
                selectedSite={site}
                onSelectSite={onSelectSite}
                activeLayer={activeLayer}
              />
            )}
          </div>
        </div>

        {/* Card 2: AI Site Recommendations Table */}
        <div className="hud-panel p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2 font-mono">
              <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              AI SITE RECOMMENDATIONS
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">NASA Artemis III Reference</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#15223c] text-slate-400 text-[10px] uppercase font-mono">
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Region / Candidate Site</th>
                  <th className="pb-2">Coordinates</th>
                  <th className="pb-2 text-right">Score</th>
                  <th className="pb-2 text-center">Suitability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121c33]">
                {rankedSites && rankedSites.map((s) => {
                  const isSelected = site.name === s.name;
                  const badge = getSuitabilityBadge(s.overall_score);
                  return (
                    <tr
                      key={s.name}
                      onClick={() => onSelectSite(s)}
                      className={`cursor-pointer transition hover:bg-[#121c33] ${
                        isSelected ? 'bg-blue-950/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 font-mono text-cyan-400 font-bold">#{s.rank}</td>
                      <td className="py-2.5 text-slate-100 font-medium">{s.name}</td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">{Math.abs(s.lat).toFixed(1)}°S, {s.lon.toFixed(1)}°E</td>
                      <td className="py-2.5 font-mono font-extrabold text-white text-right">{s.overall_score.toFixed(1)}/100</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: AI Explanation */}
        <div className="hud-panel p-3.5 space-y-2">
          <h3 className="font-extrabold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2 font-mono">
            <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">5</span>
            AI EXPLANATION — {site.name}
          </h3>
          <p className="text-slate-300 text-[11px] leading-relaxed italic border-l-2 border-cyan-400 pl-2.5 bg-[#070d1e] p-2 rounded">
            "{site.explanation || 'Optimal candidate location providing strong balance between continuous solar illumination and landing safety.'}"
          </p>
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>High solar power generation stability with minimal cryogenic lunar night duration.</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Terrain slope ({site.slope_deg || 2.8}°) supports landing stability and rover transit.</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Horizon terrain obstruction provides natural GCR cosmic ray shielding.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Site Details, Gauges, Factor Bars & Compare (Span 6)         */}
      {/* ========================================================================= */}
      <div className="col-span-6 flex flex-col space-y-4">
        {/* Row 1: Site Details & Radial Gauge */}
        <div className="hud-panel p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h3 className="font-extrabold text-white uppercase tracking-wider text-xs font-mono">
                SITE DETAILS — #{site.rank || 1}
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1 font-mono">
              <p><span className="text-slate-400">Region:</span> Lunar South Polar Region</p>
              <p><span className="text-slate-400">Coordinates:</span> <span className="text-cyan-300 font-bold">{Math.abs(site.lat || 89.67).toFixed(2)}°S, {(site.lon || 129.78).toFixed(2)}°E</span></p>
              <p><span className="text-slate-400">Nearest Landmark:</span> <span className="text-white">{site.name}</span></p>
              <p><span className="text-slate-400">Elevation:</span> <span className="text-cyan-300">{site.elevation_m || 1926} m</span></p>
              <p><span className="text-slate-400">Mission Compatibility:</span> <span className="text-emerald-400 font-bold">Excellent</span></p>
            </div>
          </div>

          {/* Glowing Radial Suitability Gauge */}
          <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#070d1e] border border-[#15223c] shadow-inner">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-mono">
              HABITAT SUITABILITY
            </span>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-700"
                  strokeDasharray={`${Math.round(site.overall_score || 85)}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold font-mono text-white leading-none">
                  {Math.round(site.overall_score || 85)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
              </div>
            </div>
            <span className="mt-1 text-xs font-extrabold text-emerald-400 tracking-wider font-mono">
              {suitability.label}
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">Confidence: 96% ✓</span>
          </div>
        </div>

        {/* Row 2: Environmental Summary & Factor Analysis Bars */}
        <div className="grid grid-cols-2 gap-4">
          {/* Environmental Summary Card */}
          <div className="hud-panel p-3.5 space-y-2.5">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              ENVIRONMENTAL SUMMARY
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between pb-1 border-b border-[#15223c]">
                <span className="text-slate-400">Terrain Flatness</span>
                <span className="font-bold text-emerald-400">Excellent</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-[#15223c]">
                <span className="text-slate-400">Water Ice Proximity</span>
                <span className="font-bold text-cyan-300">High</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-[#15223c]">
                <span className="text-slate-400">Sunlight %</span>
                <span className="font-bold text-amber-400">{site.raw_metrics?.sunlight_score?.toFixed(0) || 53}%</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-[#15223c]">
                <span className="text-slate-400">Radiation Dose</span>
                <span className="font-bold text-purple-300">Low Risk</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-[#15223c]">
                <span className="text-slate-400">Surface Temp</span>
                <span className="font-bold text-slate-200">Favorable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expansion Area</span>
                <span className="font-bold text-emerald-400">High (76 km²)</span>
              </div>
            </div>
          </div>

          {/* Factor Analysis Progress Bars */}
          <div className="hud-panel p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                FACTOR ANALYSIS
              </h4>
              <span className="font-mono font-bold text-cyan-300">{site.overall_score?.toFixed(1)}/100</span>
            </div>

            <div className="space-y-2 text-[10px] font-mono">
              {/* Terrain */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-300">
                  <span>Terrain & Landing</span>
                  <span className="font-bold text-emerald-400">{site.raw_metrics?.landing_suitability_score?.toFixed(0)}</span>
                </div>
                <div className="w-full bg-[#070d1e] h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${site.raw_metrics?.landing_suitability_score || 86}%` }} />
                </div>
              </div>

              {/* Water Ice */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-300">
                  <span>Water Ice (ISRU)</span>
                  <span className="font-bold text-cyan-400">{site.raw_metrics?.water_ice_score?.toFixed(0)}</span>
                </div>
                <div className="w-full bg-[#070d1e] h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${site.raw_metrics?.water_ice_score || 10}%` }} />
                </div>
              </div>

              {/* Sunlight */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-300">
                  <span>Sunlight Power</span>
                  <span className="font-bold text-amber-400">{site.raw_metrics?.sunlight_score?.toFixed(0)}</span>
                </div>
                <div className="w-full bg-[#070d1e] h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${site.raw_metrics?.sunlight_score || 53}%` }} />
                </div>
              </div>

              {/* Radiation */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-300">
                  <span>Radiation Shielding</span>
                  <span className="font-bold text-purple-400">{site.raw_metrics?.radiation_safety_score?.toFixed(0)}</span>
                </div>
                <div className="w-full bg-[#070d1e] h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${site.raw_metrics?.radiation_safety_score || 56}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Risks / Weaknesses & Compare Top 3 Sites */}
        <div className="grid grid-cols-2 gap-4">
          {/* Risks / Weaknesses */}
          <div className="hud-panel p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                RISKS / WEAKNESSES
              </h4>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[9px] font-mono border border-amber-700/50">
                LOW – MODERATE
              </span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <p>• Moderate crater density in surrounding 15km perimeter.</p>
              <p>• Resource extraction requires rover transport into adjacent cold-trap crater floor.</p>
              <p>• Solar arrays require 360° mast positioning for low-angle sun tracking.</p>
            </div>
          </div>

          {/* Compare Top 3 Sites */}
          <div className="hud-panel p-3.5 space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
              <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">10</span>
              COMPARE TOP 3 SITES
            </h4>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-[#15223c] text-slate-400 text-[10px]">
                  <th className="pb-1">Factor</th>
                  {top3.map((s, idx) => (
                    <th key={s.name} className="pb-1 text-center text-slate-200">
                      #{idx + 1} {s.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121c33] text-slate-300 text-[10px]">
                <tr>
                  <td className="py-1 text-emerald-400">Terrain</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-bold">{s.raw_metrics?.landing_suitability_score?.toFixed(0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 text-cyan-400">Water Ice</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-bold">{s.raw_metrics?.water_ice_score?.toFixed(0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 text-amber-400">Sunlight</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-bold">{s.raw_metrics?.sunlight_score?.toFixed(0)}</td>
                  ))}
                </tr>
                <tr className="bg-blue-950/40">
                  <td className="py-1 font-bold text-white">Overall</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-extrabold text-cyan-300">
                      {s.overall_score?.toFixed(1)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
