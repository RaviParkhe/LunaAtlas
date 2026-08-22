import React from 'react';
import MoonViewer2D from './MoonViewer2D';

export default function SiteSelectionWorkspace({
  rankedSites,
  selectedSite,
  onSelectSite,
  gridHeatmap,
  activeLayer,
  onChangeLayer,
  onSwitchToGlobe,
  onSwitchToTerrain
}) {
  const site = selectedSite || (rankedSites && rankedSites[0]) || {
    name: 'Faustini Rim',
    rank: 1,
    overall_score: 49.1,
    lat: -87.30,
    lon: 77.00,
    elevation_m: 577.9,
    slope_deg: 1.12,
    raw_metrics: {
      sunlight_score: 41.8,
      water_ice_score: 22.4,
      landing_suitability_score: 89.1,
      radiation_safety_score: 56.8
    },
    explanation: 'Safe terrain flatness with high landing suitability (89.1/100).'
  };

  const getSuitabilityLabel = (score) => {
    if (score >= 55) return 'OPTIMAL';
    if (score >= 45) return 'SUITABLE';
    return 'CONSTRAINED';
  };

  return (
    <div className="flex flex-1 overflow-hidden w-full h-full select-none">
      {/* ========================================================================= */}
      {/* Left Panel: Ranked Candidates (w-[320px])                                 */}
      {/* ========================================================================= */}
      <aside className="w-[320px] h-full flex flex-col z-40 bg-[#090e18]/80 backdrop-blur-xl border-r border-[#3b494c]/30 flex-shrink-0">
        <div className="p-4 border-b border-[#3b494c]/30 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00daf3] text-[18px]">list</span>
            <h2 className="font-label-caps text-xs text-[#bac9cc]">RANKED CANDIDATES</h2>
            <span className="ml-auto text-[10px] font-data-mono text-[#bac9cc]">Top 6 NASA Sites</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {rankedSites && rankedSites.map((s) => {
              const isSelected = site.name === s.name;
              return (
                <div
                  key={s.name}
                  onClick={() => onSelectSite(s)}
                  className={`p-3 border-b border-[#3b494c]/30 cursor-pointer group flex gap-3 items-center relative transition-colors ${
                    isSelected
                      ? 'bg-[#00daf3]/10 border-[#00daf3]/40'
                      : 'hover:bg-[#303540]/30'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00daf3]" />
                  )}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-data-mono text-[10px] font-bold ${
                      isSelected
                        ? 'bg-[#00daf3] text-[#001f24]'
                        : 'bg-[#303540] text-[#bac9cc]'
                    }`}
                  >
                    #{s.rank}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <h5
                        className={`font-semibold text-[13px] transition-colors ${
                          isSelected ? 'text-[#dee2f1]' : 'text-[#dee2f1] group-hover:text-[#00daf3]'
                        }`}
                      >
                        {s.name}
                      </h5>
                      <div
                        className={`font-data-mono text-xs font-bold ${
                          isSelected ? 'text-[#00daf3]' : 'text-[#bac9cc]'
                        }`}
                      >
                        {s.overall_score.toFixed(1)}{' '}
                        <span className="text-[10px] text-[#bac9cc] font-normal">/100</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-data-mono text-[10px] text-[#bac9cc]">
                        {Math.abs(s.lat).toFixed(1)}°S, {s.lon.toFixed(1)}°E
                      </span>
                      <div className="flex gap-2 font-data-mono text-[10px]">
                        <span className="text-amber-400">
                          Sun {s.raw_metrics?.sunlight_score?.toFixed(0)}%
                        </span>
                        <span className="text-[#00daf3]">
                          Ice {s.raw_metrics?.water_ice_score?.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* Main Content Area: Central Map (Flex-1) & Right Panel (w-[420px])         */}
      {/* ========================================================================= */}
      <main className="flex-1 p-4 h-full overflow-hidden flex gap-4 bg-grid-pattern">
        {/* Central Map Area */}
        <section className="flex-1 h-full rounded-xl border border-[#3b494c]/30 bg-[#090e18] relative overflow-hidden flex flex-col">
          {/* Top Layer Selector Toolbar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            <div className="bg-[#252a35]/90 backdrop-blur border border-[#3b494c]/50 px-3 py-1.5 rounded flex items-center gap-2 pointer-events-auto">
              <span className="material-symbols-outlined text-[14px] text-[#00daf3]">location_searching</span>
              <span className="font-data-mono text-xs text-[#dee2f1]">
                LAT: {Math.abs(site.lat).toFixed(2)}°S LON: {site.lon.toFixed(2)}°E [{site.elevation_m}m]
              </span>
            </div>

            {/* Layer Buttons */}
            <div className="bg-[#252a35]/90 backdrop-blur border border-[#3b494c]/50 p-1 rounded flex items-center gap-1 pointer-events-auto">
              {[
                { id: 'overall_score', label: 'Composite' },
                { id: 'sunlight_score', label: 'Sunlight' },
                { id: 'ice_score', label: 'Water Ice' },
                { id: 'landing_suitability_score', label: 'Landing' },
                { id: 'radiation_safety_score', label: 'Radiation' },
                { id: 'slope_deg', label: 'Slope' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => onChangeLayer(l.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-data-mono font-bold transition-all cursor-pointer ${
                    activeLayer === l.id
                      ? 'bg-[#00daf3] text-[#0e131d] shadow-sm'
                      : 'text-[#bac9cc] hover:text-[#00daf3]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real 2D Canvas Heatmap & Tactical Markers */}
          <div className="flex-1 w-full relative h-full">
            <MoonViewer2D
              gridData={gridHeatmap}
              activeLayer={activeLayer}
              namedSites={rankedSites}
              selectedSite={site}
              onSelectSite={onSelectSite}
            />
          </div>

          {/* Bottom Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end pointer-events-none">
            {/* Color Gradient Legend */}
            <div className="bg-[#252a35]/90 backdrop-blur border border-[#3b494c]/50 px-3 py-2 rounded flex flex-col gap-1.5 pointer-events-auto w-52">
              <span className="font-label-caps text-[9px] text-[#bac9cc]">
                {activeLayer.toUpperCase()} GRADIENT
              </span>
              <div className="h-2 w-full rounded bg-gradient-to-r from-[#090e18] via-[#006875] to-[#00daf3]"></div>
              <div className="flex justify-between font-data-mono text-[9px] text-[#bac9cc]">
                <span>0 (Low)</span>
                <span>50</span>
                <span>100 (Max)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* Right Panel: Detailed Analysis (w-[420px])                                 */}
        {/* ========================================================================= */}
        <section className="w-[420px] h-full flex flex-col gap-4 overflow-y-auto pr-1 flex-shrink-0">
          {/* Selected Candidate Profile */}
          <div className="bg-[#1a2333]/60 backdrop-blur-xl border border-[#00daf3]/30 rounded-xl flex flex-col shrink-0 shadow-lg">
            <div className="p-4 border-b border-[#3b494c]/30 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-[#00daf3]">
                  SELECTED CANDIDATE #{site.rank || 1}
                </span>
                <h3 className="font-mono text-2xl font-bold text-[#dee2f1]">{site.name}</h3>
              </div>
              <div className="px-2.5 py-0.5 bg-[#00daf3]/20 border border-[#00daf3]/50 rounded text-[10px] font-label-caps text-[#00daf3] font-bold">
                {getSuitabilityLabel(site.overall_score)}
              </div>
            </div>

            <div className="p-4 flex gap-4">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="font-data-mono text-[10px] text-[#bac9cc]">Coordinates</span>
                    <span className="font-data-mono text-xs font-bold text-[#dee2f1]">
                      {Math.abs(site.lat).toFixed(2)}°S, {site.lon.toFixed(2)}°E
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-data-mono text-[10px] text-[#bac9cc]">Elevation / Slope</span>
                    <span className="font-data-mono text-xs font-bold text-[#dee2f1]">
                      <span className="text-[#00daf3]">{site.elevation_m}m</span> •{' '}
                      <span className="text-[#00daf3]">{site.slope_deg}°</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col mt-1">
                  <span className="font-label-caps text-xs text-[#dee2f1]">SUITABILITY SCORE</span>
                  <span className="text-xs text-[#bac9cc]">
                    Multi-objective score normalized across 160,000 cells.
                  </span>
                </div>
              </div>

              {/* Score Gauge */}
              <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r="45"
                    stroke="#00daf3"
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 - (282.7 * (site.overall_score || 50)) / 100}
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-mono text-2xl font-bold text-[#dee2f1] leading-none">
                    {Math.round(site.overall_score || 50)}
                  </span>
                  <span className="font-data-mono text-[10px] text-[#bac9cc]">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Factor Scorecard */}
          <div className="bg-[#1a2333]/60 backdrop-blur-xl border border-[#3b494c]/30 rounded-xl flex flex-col shrink-0">
            <div className="p-3 border-b border-[#3b494c]/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#bac9cc]">bar_chart</span>
                <h4 className="font-label-caps text-xs text-[#dee2f1]">FACTOR SCORECARD</h4>
              </div>
              <span className="font-data-mono text-[10px] text-[#bac9cc]">Real Sensor Metrics</span>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Sunlight */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#f59e0b]">
                    <span className="material-symbols-outlined text-[14px]">light_mode</span>
                    <span className="font-data-mono text-xs font-semibold">Sunlight Availability</span>
                  </div>
                  <span className="font-data-mono text-sm text-[#dee2f1] font-bold">
                    {site.raw_metrics?.sunlight_score?.toFixed(1) || 41.8}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#303540] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#f59e0b] rounded"
                    style={{ width: `${site.raw_metrics?.sunlight_score || 41.8}%` }}
                  />
                </div>
              </div>

              {/* Landing Safety */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#10b981]">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    <span className="font-data-mono text-xs font-semibold">Landing Safety</span>
                  </div>
                  <span className="font-data-mono text-sm text-[#dee2f1] font-bold">
                    {site.raw_metrics?.landing_suitability_score?.toFixed(1) || 89.1}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#303540] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded"
                    style={{ width: `${site.raw_metrics?.landing_suitability_score || 89.1}%` }}
                  />
                </div>
              </div>

              {/* Water Ice */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#00daf3]">
                    <span className="material-symbols-outlined text-[14px]">water_drop</span>
                    <span className="font-data-mono text-xs font-semibold">Water Ice Potential</span>
                  </div>
                  <span className="font-data-mono text-sm text-[#dee2f1] font-bold">
                    {site.raw_metrics?.water_ice_score?.toFixed(1) || 22.4}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#303540] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00daf3] rounded"
                    style={{ width: `${site.raw_metrics?.water_ice_score || 22.4}%` }}
                  />
                </div>
              </div>

              {/* Radiation */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#8b5cf6]">
                    <span className="material-symbols-outlined text-[14px]">waves</span>
                    <span className="font-data-mono text-xs font-semibold">Radiation Shielding</span>
                  </div>
                  <span className="font-data-mono text-sm text-[#dee2f1] font-bold">
                    {site.raw_metrics?.radiation_safety_score?.toFixed(1) || 56.8}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#303540] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#8b5cf6] rounded"
                    style={{ width: `${site.raw_metrics?.radiation_safety_score || 56.8}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Mission Rationale */}
          <div className="bg-[#1a2333]/60 backdrop-blur-xl border border-[#3b494c]/30 rounded-xl flex flex-col shrink-0">
            <div className="p-3 border-b border-[#3b494c]/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#00daf3]">psychology</span>
              <h4 className="font-label-caps text-xs text-[#00daf3]">AI MISSION RATIONALE</h4>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <p className="text-sm text-[#bac9cc] italic">
                "{site.explanation || 'Safe terrain flatness with high landing suitability (89.1/100).'}"
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onSwitchToGlobe}
                  className="flex-1 py-2 bg-[#303540]/50 border border-[#3b494c] hover:border-[#00daf3] transition-colors rounded flex items-center justify-center gap-2 text-[#00daf3] font-data-mono text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">public</span>
                  View in 3D
                </button>
                <button
                  onClick={onSwitchToTerrain}
                  className="flex-1 py-2 bg-[#303540]/50 border border-[#3b494c] hover:border-[#00daf3] transition-colors rounded flex items-center justify-center gap-2 text-[#00daf3] font-data-mono text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">terrain</span>
                  Terrain Detail
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
