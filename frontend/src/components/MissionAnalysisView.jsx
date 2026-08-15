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
  Layers2
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
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'

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
    explanation: 'High solar illumination (53.3%) provides reliable photovoltaic energy. Direct access to adjacent crater cold traps.'
  };

  const top3 = rankedSites ? rankedSites.slice(0, 3) : [];

  const getSuitabilityText = (score) => {
    if (score >= 85) return { label: 'EXCELLENT', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300' };
    if (score >= 70) return { label: 'VERY GOOD', color: 'text-cyan-400', bg: 'bg-cyan-950/60 border-cyan-700/50 text-cyan-300' };
    if (score >= 50) return { label: 'GOOD', color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-700/50 text-blue-300' };
    return { label: 'FAIR', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-700/50 text-amber-300' };
  };

  const suitability = getSuitabilityText(site.overall_score || 80);

  return (
    <div className="grid grid-cols-12 gap-4 p-4 text-xs">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Moon Map & Recommendations (Span 7)                          */}
      {/* ========================================================================= */}
      <div className="col-span-7 flex flex-col space-y-4">
        {/* Map Header & Viewer */}
        <div className="glass-panel p-3 flex flex-col space-y-3">
          {/* Map Controls Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[11px] tracking-wider uppercase">
                MOON MAP
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                Lunar South Pole (400×400km)
              </span>
            </div>

            {/* 2D / 3D Mode Toggle */}
            <div className="flex items-center space-x-1.5 bg-[#090f1d] p-1 rounded-lg border border-[#1a2744]">
              <button
                onClick={() => setViewMode('2d')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  viewMode === '2d'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers2 className="w-3 h-3" />
                <span>2D GRID</span>
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  viewMode === '3d'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Rotate3d className="w-3 h-3 text-cyan-400" />
                <span>3D GLOBE</span>
              </button>
            </div>
          </div>

          {/* Layer Toggle Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'overall_score', label: 'Composite Suitability', color: 'cyan' },
              { id: 'sunlight_score', label: 'Sunlight Availability', color: 'amber' },
              { id: 'ice_score', label: 'Water Ice (PSR)', color: 'cyan' },
              { id: 'landing_suitability_score', label: 'Terrain & Landing', color: 'emerald' },
              { id: 'radiation_safety_score', label: 'Radiation Shielding', color: 'purple' },
              { id: 'dust_risk_score', label: 'Dust Hazard', color: 'rose' },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => onChangeLayer(layer.id)}
                className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold transition ${
                  activeLayer === layer.id
                    ? 'bg-blue-950 border-blue-400 text-blue-200 shadow-sm'
                    : 'bg-[#090f1d] border-[#1a2744] text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Canvas or 3D Globe Viewer */}
          <div className="h-[360px] w-full rounded-lg overflow-hidden">
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

        {/* AI Site Recommendations Table */}
        <div className="glass-panel p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">1</span>
              AI SITE RECOMMENDATIONS
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">NASA Artemis Benchmark</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1a2744] text-slate-400 text-[10px] uppercase font-mono">
                  <th className="pb-1.5">Rank</th>
                  <th className="pb-1.5">Region / Candidate Site</th>
                  <th className="pb-1.5">Coordinates</th>
                  <th className="pb-1.5">Score</th>
                  <th className="pb-1.5">Suitability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142038]">
                {rankedSites && rankedSites.map((s) => {
                  const isSelected = site.name === s.name;
                  const suit = getSuitabilityText(s.overall_score);
                  return (
                    <tr
                      key={s.name}
                      onClick={() => onSelectSite(s)}
                      className={`cursor-pointer transition hover:bg-[#121c33] ${
                        isSelected ? 'bg-blue-950/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 font-mono text-blue-400">#{s.rank}</td>
                      <td className="py-2 text-slate-200">{s.name}</td>
                      <td className="py-2 font-mono text-slate-400">{Math.abs(s.lat).toFixed(1)}°S, {s.lon.toFixed(1)}°E</td>
                      <td className="py-2 font-mono font-bold text-slate-100">{s.overall_score.toFixed(1)}/100</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${suit.bg}`}>
                          {suit.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Explanation & Key Strengths */}
        <div className="glass-panel p-3 space-y-2">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">5</span>
            AI EXPLANATION — {site.name}
          </h3>
          <p className="text-slate-300 text-[11px] leading-relaxed italic border-l-2 border-cyan-400 pl-2">
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
      {/* RIGHT COLUMN: Site Details, Gauge, Factors & Comparison (Span 5)         */}
      {/* ========================================================================= */}
      <div className="col-span-5 flex flex-col space-y-4">
        {/* Site Details Card + Habitat Suitability Radial Gauge */}
        <div className="glass-panel p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
                SITE DETAILS — #{site.rank || 1}
              </h3>
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <p><span className="text-slate-500">Region:</span> Lunar South Polar Region</p>
              <p className="font-mono"><span className="text-slate-500">Coordinates:</span> {Math.abs(site.lat || 89.67).toFixed(2)}°S, {(site.lon || 129.78).toFixed(2)}°E</p>
              <p><span className="text-slate-500">Nearest Landmark:</span> {site.name}</p>
              <p><span className="text-slate-500">Elevation:</span> <span className="font-mono text-cyan-300">{site.elevation_m || 1926} m</span></p>
              <p><span className="text-slate-500">Mission Compatibility:</span> <span className="font-semibold text-emerald-400">Excellent</span></p>
            </div>
          </div>

          {/* Radial Suitability Gauge */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#090f1d] border border-[#1a2744]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              HABITAT SUITABILITY
            </span>
            <div className="relative w-20 h-20 flex items-center justify-center">
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
                <span className="text-lg font-extrabold font-mono text-white leading-none">
                  {Math.round(site.overall_score || 85)}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">/ 100</span>
              </div>
            </div>
            <span className="mt-1 text-[11px] font-bold text-emerald-400 tracking-wider">
              {suitability.label}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">Confidence: 96% ✓</span>
          </div>
        </div>

        {/* Environmental Summary & Factor Analysis Bars */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a2744] pb-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">4</span>
              FACTOR ANALYSIS — {site.name}
            </h3>
            <span className="font-mono font-bold text-cyan-300">{site.overall_score?.toFixed(1)} / 100</span>
          </div>

          <div className="space-y-2.5">
            {/* Terrain Flatness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Terrain & Landing Safety</span>
                <span className="font-mono font-semibold text-emerald-300">{site.raw_metrics?.landing_suitability_score?.toFixed(1) || 86.0}</span>
              </div>
              <div className="w-full bg-[#090f1d] h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${site.raw_metrics?.landing_suitability_score || 86}%` }} />
              </div>
            </div>

            {/* Water Ice */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1"><Droplet className="w-3 h-3 text-cyan-400" /> Water Ice Potential (ISRU)</span>
                <span className="font-mono font-semibold text-cyan-300">{site.raw_metrics?.water_ice_score?.toFixed(1) || 0.0}</span>
              </div>
              <div className="w-full bg-[#090f1d] h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${site.raw_metrics?.water_ice_score || 10}%` }} />
              </div>
            </div>

            {/* Sunlight */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> Sunlight Illumination Availability</span>
                <span className="font-mono font-semibold text-amber-300">{site.raw_metrics?.sunlight_score?.toFixed(1) || 53.3}%</span>
              </div>
              <div className="w-full bg-[#090f1d] h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${site.raw_metrics?.sunlight_score || 53}%` }} />
              </div>
            </div>

            {/* Radiation Shielding */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1"><Layers className="w-3 h-3 text-purple-400" /> Radiation Horizon Shielding</span>
                <span className="font-mono font-semibold text-purple-300">{site.raw_metrics?.radiation_safety_score?.toFixed(1) || 56.8}</span>
              </div>
              <div className="w-full bg-[#090f1d] h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${site.raw_metrics?.radiation_safety_score || 56}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Risks & Weaknesses Card */}
        <div className="glass-panel p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              RISKS / WEAKNESSES
            </h3>
            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 text-[10px] font-mono">
              RISK: LOW – MODERATE
            </span>
          </div>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <p>• Moderate crater density in surrounding 15km perimeter.</p>
            <p>• Resource extraction requires rover transport into adjacent cold-trap crater floor.</p>
            <p>• Solar arrays require 360° mast positioning for horizontal low-angle sunlight tracking.</p>
          </div>
        </div>

        {/* Compare Top 3 Sites Table */}
        <div className="glass-panel p-3 space-y-2">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">10</span>
            COMPARE TOP 3 SITES
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-[#1a2744] text-slate-400 text-[10px]">
                  <th className="pb-1">Factor</th>
                  {top3.map((s, idx) => (
                    <th key={s.name} className="pb-1 text-center text-slate-200">
                      Site #{idx + 1}
                      <span className="block text-[9px] font-normal text-slate-400 truncate max-w-[80px]">
                        {s.name.split(' ')[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142038] text-slate-300">
                <tr>
                  <td className="py-1 text-emerald-400">Landing Safety</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-bold">{s.raw_metrics?.landing_suitability_score?.toFixed(0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 text-amber-400">Sunlight %</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-bold">{s.raw_metrics?.sunlight_score?.toFixed(0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 text-cyan-400">Water Ice</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1 text-center font-bold">{s.raw_metrics?.water_ice_score?.toFixed(0)}</td>
                  ))}
                </tr>
                <tr className="bg-blue-950/30">
                  <td className="py-1.5 font-bold text-white">Overall Score</td>
                  {top3.map((s) => (
                    <td key={s.name} className="py-1.5 text-center font-extrabold text-cyan-300">
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
