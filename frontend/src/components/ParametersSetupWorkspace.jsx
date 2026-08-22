import React, { useState } from 'react';

export default function ParametersSetupWorkspace({
  weights = {},
  onWeightChange,
  rankedSites = [],
  activeProfile = 'balanced',
  onSelectProfile,
  applyFlatnessGate = true,
  onToggleFlatnessGate,
  onSwitchToMap
}) {
  const [missionName, setMissionName] = useState('ARTEMIS-V-SOUTH-POLE');
  const [sols, setSols] = useState(180);
  const [crewMode, setCrewMode] = useState('manned');

  const top3 = rankedSites ? rankedSites.slice(0, 3) : [];

  const profiles = [
    { id: 'balanced', label: 'Balanced Artemis', desc: 'Equal priority for illumination, water ice, and landing safety', icon: 'balance' },
    { id: 'isru_mining', label: 'ISRU Ice Mining', desc: 'Heavy priority on sub-surface water ice PSR cold-traps', icon: 'water_drop' },
    { id: 'power_first', label: 'Solar Power First', desc: 'Prioritizes continuous illumination on peaks of eternal light', icon: 'wb_sunny' },
    { id: 'max_safety', label: 'Maximum Safety', desc: 'Maximizes flat touchdown clearance and radiation shielding', icon: 'shield' },
  ];

  const wIce = weights?.water_ice ?? 0.25;
  const wSun = weights?.sunlight ?? 0.30;
  const wLanding = weights?.landing_safety ?? 0.25;
  const wRad = weights?.radiation_safety ?? 0.15;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 relative select-none w-full bg-[#090e18]">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#00daf3]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Page Title & Mission Objectives Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-mono text-2xl font-bold text-[#dee2f1]">
                Mission Parameters & Heuristics
              </h2>
              <p className="text-xs text-[#bac9cc] mt-1">
                Configure environmental weightings and operational constraints for AI-driven site selection.
              </p>
            </div>

            <button
              onClick={onSwitchToMap}
              className="px-5 py-2.5 bg-[#00daf3] hover:bg-[#9cf0ff] text-[#090e18] font-bold rounded-lg font-data-mono text-xs transition-all cursor-pointer shadow-lg shadow-[#00daf3]/20 flex items-center gap-2"
            >
              <span>VIEW MISSION MAP</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>map</span>
            </button>
          </div>

          {/* Mission Objective Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {profiles.map((p) => {
              const isSelected = activeProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile && onSelectProfile(p.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#00daf3]/15 border-[#00daf3] shadow-md shadow-[#00daf3]/10'
                      : 'bg-[#171c26]/60 border-[#3b494c]/50 hover:bg-[#252a35] hover:border-[#3b494c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`material-symbols-outlined ${isSelected ? 'text-[#00daf3]' : 'text-[#bac9cc]'}`} style={{ fontSize: '20px' }}>
                      {p.icon}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#00daf3] animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-data-mono text-xs font-bold ${isSelected ? 'text-[#00daf3]' : 'text-[#dee2f1]'}`}>
                      {p.label}
                    </h4>
                    <p className="text-[10px] text-[#bac9cc] mt-1 line-clamp-2">
                      {p.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Core Setup (Left) + Sliders (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Core Configuration Panel */}
          <div className="lg:col-span-5 bg-[#171c26]/80 backdrop-blur-md border border-[#3b494c]/50 rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-[#3b494c]/40">
              <span className="material-symbols-outlined text-[#00daf3]" style={{ fontSize: '20px' }}>tune</span>
              <h3 className="font-data-mono text-xs font-bold text-[#00daf3] uppercase tracking-wider">
                Core Mission Constraints
              </h3>
            </div>

            <div className="space-y-5">
              {/* Mission Designation */}
              <div className="space-y-1.5">
                <label className="font-data-mono text-[11px] text-[#bac9cc] block">MISSION DESIGNATION</label>
                <input
                  type="text"
                  value={missionName}
                  onChange={(e) => setMissionName(e.target.value)}
                  className="w-full bg-[#090e18] border border-[#3b494c] focus:border-[#00daf3] text-[#dee2f1] font-data-mono text-xs px-3.5 py-2.5 rounded-lg transition-all"
                />
              </div>

              {/* Sols Duration */}
              <div className="space-y-1.5">
                <label className="font-data-mono text-[11px] text-[#bac9cc] block">MISSION DURATION (SOLS)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sols}
                    onChange={(e) => setSols(Number(e.target.value))}
                    className="w-full bg-[#090e18] border border-[#3b494c] focus:border-[#00daf3] text-[#dee2f1] font-data-mono text-xs px-3.5 py-2.5 rounded-lg transition-all pr-14"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-data-mono text-[#bac9cc]">
                    SOLS
                  </span>
                </div>
              </div>

              {/* Crew Mode */}
              <div className="space-y-1.5">
                <label className="font-data-mono text-[11px] text-[#bac9cc] block">CREW ARCHITECTURE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCrewMode('manned')}
                    className={`py-2 rounded-lg font-data-mono text-xs font-bold transition-all cursor-pointer ${
                      crewMode === 'manned'
                        ? 'bg-[#00daf3] text-[#090e18] shadow-md shadow-[#00daf3]/20'
                        : 'bg-[#090e18] border border-[#3b494c] text-[#bac9cc] hover:text-[#dee2f1]'
                    }`}
                  >
                    MANNED CREW
                  </button>
                  <button
                    onClick={() => setCrewMode('autonomous')}
                    className={`py-2 rounded-lg font-data-mono text-xs font-bold transition-all cursor-pointer ${
                      crewMode === 'autonomous'
                        ? 'bg-[#00daf3] text-[#090e18] shadow-md shadow-[#00daf3]/20'
                        : 'bg-[#090e18] border border-[#3b494c] text-[#bac9cc] hover:text-[#dee2f1]'
                    }`}
                  >
                    AUTONOMOUS
                  </button>
                </div>
              </div>

              {/* Flatness Gate Enforced */}
              <div className="pt-3 border-t border-[#3b494c]/40">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-data-mono text-xs font-bold text-[#dee2f1] block">FLATNESS GATE (&lt;15° SLOPE)</span>
                    <span className="text-[10px] text-[#bac9cc]">Filters hazardous crater walls automatically</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyFlatnessGate}
                    onChange={onToggleFlatnessGate}
                    className="w-4 h-4 accent-[#00daf3] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Selection Heuristics Sliders Panel */}
          <div className="lg:col-span-7 bg-[#171c26]/80 backdrop-blur-md border border-[#3b494c]/50 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b494c]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00daf3]" style={{ fontSize: '20px' }}>sliders</span>
                <h3 className="font-data-mono text-xs font-bold text-[#00daf3] uppercase tracking-wider">
                  Heuristics Weighting Sliders
                </h3>
              </div>
              <span className="text-[10px] font-data-mono px-2 py-0.5 bg-[#00daf3]/15 text-[#00daf3] rounded border border-[#00daf3]/30 font-bold">
                REAL-TIME EVALUATION
              </span>
            </div>

            <div className="space-y-6">
              {/* Water Ice */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sky-300">
                    <span className="material-symbols-outlined text-sm">water_drop</span>
                    <span className="font-data-mono text-xs font-bold">WATER ICE PROBABILITY</span>
                  </div>
                  <span className="font-data-mono text-xs font-bold text-[#00daf3]">
                    {(wIce * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wIce}
                  onChange={(e) => onWeightChange && onWeightChange('water_ice', Number(e.target.value))}
                  className="w-full accent-[#00daf3] cursor-pointer"
                />
                <p className="text-[10px] text-[#bac9cc]">Sub-surface H2O signatures in permanently shadowed region cold-traps.</p>
              </div>

              {/* Solar Exposure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-amber-300">
                    <span className="material-symbols-outlined text-sm">wb_sunny</span>
                    <span className="font-data-mono text-xs font-bold">SOLAR ILLUMINATION EXPOSURE</span>
                  </div>
                  <span className="font-data-mono text-xs font-bold text-amber-300">
                    {(wSun * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wSun}
                  onChange={(e) => onWeightChange && onWeightChange('sunlight', Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-[#bac9cc]">Annual illumination duration on peaks of eternal light.</p>
              </div>

              {/* Landing Safety */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span className="material-symbols-outlined text-sm">terrain</span>
                    <span className="font-data-mono text-xs font-bold">TERRAIN GRADIENT & LANDING SAFETY</span>
                  </div>
                  <span className="font-data-mono text-xs font-bold text-emerald-300">
                    {(wLanding * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wLanding}
                  onChange={(e) => onWeightChange && onWeightChange('landing_safety', Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <p className="text-[10px] text-[#bac9cc]">Surface flatness, roughness, and touchdown clearance.</p>
              </div>

              {/* Radiation Shielding */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-purple-300">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span className="font-data-mono text-xs font-bold">RADIATION HORIZON SHIELDING</span>
                  </div>
                  <span className="font-data-mono text-xs font-bold text-purple-300">
                    {(wRad * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wRad}
                  onChange={(e) => onWeightChange && onWeightChange('radiation_safety', Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <p className="text-[10px] text-[#bac9cc]">Topographic shielding against galactic cosmic rays (GCR).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Top 3 Candidates Preview */}
        <div className="bg-[#171c26]/80 backdrop-blur-md border border-[#3b494c]/50 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00daf3]" style={{ fontSize: '20px' }}>leaderboard</span>
              <h3 className="font-data-mono text-xs font-bold text-[#dee2f1] uppercase tracking-wider">
                Real-Time Top 3 Candidate Leaderboard
              </h3>
            </div>
            <button
              onClick={onSwitchToMap}
              className="text-[#00daf3] hover:underline font-data-mono text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Interactive Map</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((site, idx) => (
              <div
                key={site.name || idx}
                className="bg-[#090e18] border border-[#3b494c]/50 hover:border-[#00daf3]/60 rounded-lg p-4 flex items-center justify-between transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00daf3]/20 text-[#00daf3] font-data-mono text-xs font-bold flex items-center justify-center border border-[#00daf3]/40">
                      #{idx + 1}
                    </span>
                    <h4 className="font-data-mono text-xs font-bold text-[#dee2f1]">
                      {site.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-[#bac9cc] font-data-mono mt-1">
                    {site.lat}°S, {site.lon}°E • Elev: {site.elevation_m}m
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-data-mono text-lg font-bold text-[#00daf3]">
                    {site.score ?? site.overall_score ?? 0}
                  </span>
                  <span className="text-[9px] text-[#bac9cc] block font-data-mono">/ 100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
