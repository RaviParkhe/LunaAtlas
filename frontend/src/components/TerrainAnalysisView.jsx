import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mountain, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Radar, 
  Box, 
  Activity,
  Compass
} from 'lucide-react';
import MoonViewer2D from './MoonViewer2D';

export default function TerrainAnalysisView({
  selectedSite,
  rankedSites,
  gridHeatmap,
  onSelectSite
}) {
  const [terrainLayer, setTerrainLayer] = useState('slope_deg');

  const site = selectedSite || (rankedSites && rankedSites[0]) || {
    name: 'Shackleton Crater Rim',
    lat: -89.67,
    lon: 129.78,
    elevation_m: 1926.5,
    slope_deg: 2.8,
    raw_metrics: {
      landing_suitability_score: 86.0
    }
  };

  const baseElev = site.elevation_m || 2000;
  const elevProfile = [
    baseElev - 120, baseElev - 80, baseElev - 30, baseElev + 20,
    baseElev + 90, baseElev + 140, baseElev + 60, baseElev - 40,
    baseElev - 90, baseElev - 110, baseElev - 130
  ];

  return (
    <div className="flex flex-col space-y-4 p-4 text-xs select-none">
      {/* Top Banner */}
      <div className="hud-panel px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center shadow-md">
            <Mountain className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-extrabold text-white uppercase tracking-wider text-sm flex items-center gap-2 font-mono">
              TERRAIN ANALYSIS <span className="text-cyan-400">• {site.name}</span>
            </h2>
            <p className="text-slate-400 text-[11px] font-mono">
              Detailed Slope, Roughness, and Landing Hazard Assessment • {Math.abs(site.lat).toFixed(2)}°S, {site.lon.toFixed(2)}°E
            </p>
          </div>
        </div>

        {/* Overall Terrain Suitability Badge */}
        <div className="flex items-center space-x-3 bg-[#070d1e] px-4 py-2 rounded-xl border border-emerald-500/50 shadow-inner">
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">
              OVERALL TERRAIN SUITABILITY
            </span>
            <span className="text-[11px] font-extrabold text-emerald-400 font-mono">92 / 100 EXCELLENT</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {site.raw_metrics?.landing_suitability_score?.toFixed(0) || 92}
          </div>
        </div>
      </div>

      {/* Top Grid: Terrain Map & At a Glance */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Terrain Map */}
        <div className="col-span-7 hud-panel p-3.5 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase font-mono shadow-sm">
                TERRAIN MAP
              </span>
              <span className="text-slate-400 text-[10px] font-mono">
                10 km Analysis Radius Ring
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-[#060b18] p-1 rounded-lg border border-[#15223c]">
              {[
                { id: 'slope_deg', label: 'Slope' },
                { id: 'elevation_m', label: 'Elevation' },
                { id: 'landing_suitability_score', label: 'Landing Safety' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setTerrainLayer(l.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition font-mono ${
                    terrainLayer === l.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full rounded-lg overflow-hidden border border-[#15223c]">
            <MoonViewer2D
              gridData={gridHeatmap}
              activeLayer={terrainLayer}
              namedSites={rankedSites}
              selectedSite={site}
              onSelectSite={onSelectSite}
              radiusKm={10}
            />
          </div>

          {/* Slope Legend Color Bar */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-[#15223c]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono">Slope (degrees)</span>
            <div className="flex items-center space-x-1.5 text-[9px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold">0°–5° Flat</span>
              <span className="px-2 py-0.5 rounded bg-yellow-500 text-black font-bold">5°–10° Gentle</span>
              <span className="px-2 py-0.5 rounded bg-orange-500 text-black font-bold">10°–15° Steep</span>
              <span className="px-2 py-0.5 rounded bg-red-500 text-white font-bold">&gt;15° Cliff</span>
            </div>
          </div>
        </div>

        {/* Right: Terrain at a Glance */}
        <div className="col-span-5 hud-panel p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#15223c]">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-slate-100 uppercase tracking-wider text-xs font-mono">
              TERRAIN AT A GLANCE
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className="hud-panel-sub p-2.5 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Average Slope</span>
              <span className="text-lg font-extrabold text-emerald-400">{site.slope_deg || 2.8}°</span>
              <span className="text-[9px] text-emerald-300 block font-bold">Low Hazard</span>
            </div>
            <div className="hud-panel-sub p-2.5 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Maximum Slope</span>
              <span className="text-lg font-extrabold text-yellow-400">{((site.slope_deg || 2.8) * 2.1).toFixed(1)}°</span>
              <span className="text-[9px] text-yellow-300 block font-bold">Moderate</span>
            </div>
            <div className="hud-panel-sub p-2.5 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Elevation</span>
              <span className="text-lg font-extrabold text-cyan-400">{site.elevation_m || 2145} m</span>
              <span className="text-[9px] text-slate-400 block font-bold">LOLA Datum</span>
            </div>
            <div className="hud-panel-sub p-2.5 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Flat Area (&lt;5°)</span>
              <span className="text-lg font-extrabold text-emerald-400">78%</span>
              <span className="text-[9px] text-emerald-300 block font-bold">Optimal</span>
            </div>
            <div className="hud-panel-sub p-2.5 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Roughness</span>
              <span className="text-lg font-extrabold text-blue-400">1.4 m</span>
              <span className="text-[9px] text-blue-300 block font-bold">Low (RMS)</span>
            </div>
            <div className="hud-panel-sub p-2.5 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Usable Area</span>
              <span className="text-lg font-extrabold text-cyan-400">76 km²</span>
              <span className="text-[9px] text-cyan-300 block font-bold">Sufficient</span>
            </div>
          </div>

          <div className="hud-panel-sub p-3 text-slate-300 text-[11px] leading-relaxed">
            <span className="font-bold text-slate-200 block mb-1 font-mono">TERRAIN OVERVIEW</span>
            The site is predominantly flat with gentle slopes and low surface roughness. A large continuous area is available for primary habitat placement, landing pad clearance, and regolith berm construction.
          </div>
        </div>
      </div>

      {/* Middle Row: Elevation Profile & Flatness Donut */}
      <div className="grid grid-cols-12 gap-4">
        {/* Elevation Profile Graph */}
        <div className="col-span-6 hud-panel p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ELEVATION PROFILE (Across 10km Transect)
            </h4>
            <span className="font-mono text-cyan-300 text-[10px]">Δz: ~270m</span>
          </div>

          <div className="w-full h-24 bg-[#070d1e] border border-[#15223c] rounded-lg p-2.5 flex flex-col justify-end">
            <svg className="w-full h-16 overflow-visible">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={elevProfile.map((val, idx) => {
                  const x = (idx / (elevProfile.length - 1)) * 300;
                  const y = 50 - ((val - (baseElev - 150)) / 300) * 45;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
              <span>0 km</span>
              <span>2.5 km</span>
              <span>5.0 km</span>
              <span>7.5 km</span>
              <span>10 km</span>
            </div>
          </div>
        </div>

        {/* Flatness Donut Chart */}
        <div className="col-span-6 hud-panel p-3.5 space-y-2">
          <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2 font-mono">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            FLATNESS ANALYSIS & HAZARD DISTRIBUTION
          </h4>

          <div className="flex items-center justify-between pt-1">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="21, 100" strokeDashoffset="-78" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="17, 100" strokeDashoffset="-61" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="78, 100" strokeDashoffset="0" />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs font-bold font-mono text-white">78%</span>
                <span className="block text-[8px] text-emerald-400 font-mono">&lt;5°</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono flex-1 pl-6">
              <div className="flex justify-between text-emerald-300">
                <span>■ 0° – 5° (Ideal Flat)</span>
                <span className="font-bold">78%</span>
              </div>
              <div className="flex justify-between text-yellow-300">
                <span>■ 5° – 10° (Gentle)</span>
                <span className="font-bold">17%</span>
              </div>
              <div className="flex justify-between text-orange-300">
                <span>■ 10° – 15° (Steep)</span>
                <span className="font-bold">4%</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>■ &gt; 15° (Hazardous)</span>
                <span className="font-bold">1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Landing & Construction Suitability */}
      <div className="grid grid-cols-12 gap-4">
        {/* Landing Suitability */}
        <div className="col-span-4 hud-panel p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
              <Radar className="w-3.5 h-3.5 text-cyan-400" />
              LANDING SUITABILITY
            </h4>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold">
              94 / 100
            </span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1 pt-1 font-mono">
            <p className="text-emerald-400">✔ Wide continuous flat touchdown ellipse.</p>
            <p className="text-emerald-400">✔ Low obstacle density (&lt;0.8 craters/km²).</p>
            <p className="text-emerald-400">✔ Gentle slope minimizes landing fuel burn.</p>
          </div>
        </div>

        {/* Construction Suitability */}
        <div className="col-span-4 hud-panel p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
              <Box className="w-3.5 h-3.5 text-blue-400" />
              CONSTRUCTION SUITABILITY
            </h4>
            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/50 text-blue-300 font-mono font-bold">
              91 / 100
            </span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1 pt-1 font-mono">
            <p className="text-cyan-300">✔ 76 km² continuous flat usable footprint.</p>
            <p className="text-cyan-300">✔ Low surface roughness ensures stable pads.</p>
            <p className="text-cyan-300">✔ Micrometeoroid regolith berm compatible.</p>
          </div>
        </div>

        {/* AI Terrain Assessment */}
        <div className="col-span-4 hud-panel p-3.5 space-y-2">
          <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            AI TERRAIN ASSESSMENT
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
            The site offers highly favorable terrain conditions for a multi-decade habitat. Combines large level surface with low hazard density for safe touchdown and rapid civil expansion.
          </p>
        </div>
      </div>
    </div>
  );
}
