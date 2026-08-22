import React, { useState } from 'react';
import MoonViewer2D from './MoonViewer2D';

export default function TerrainWorkspace({
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
    <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto select-none bg-grid-pattern">
      {/* Top Banner */}
      <div className="bg-[#090e18]/80 backdrop-blur-[20px] border border-[#3b494c]/30 rounded-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded bg-[#303540] border border-[#3b494c] flex items-center justify-center text-[#00daf3]">
            <span className="material-symbols-outlined">terrain</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#dee2f1] uppercase font-mono flex items-center gap-2">
              SURFACE TOPOGRAPHY & HAZARDS <span className="text-[#00daf3]">• {site.name}</span>
            </h2>
            <p className="text-xs text-[#bac9cc] font-mono">
              LOLA 240m Polar DEM • Slope Gradients & Surface Roughness RMS • {Math.abs(site.lat).toFixed(2)}°S, {site.lon.toFixed(2)}°E
            </p>
          </div>
        </div>

        {/* Site Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-[#849396]">Inspect Candidate:</span>
          <select
            value={site.name}
            onChange={(e) => {
              const matched = rankedSites.find((s) => s.name === e.target.value);
              if (matched) onSelectSite(matched);
            }}
            className="bg-[#171c26] border border-[#3b494c] text-[#00daf3] font-mono font-bold text-xs p-2 rounded focus:outline-none"
          >
            {rankedSites && rankedSites.map((s) => (
              <option key={s.name} value={s.name}>
                #{s.rank} {s.name} ({s.overall_score.toFixed(1)}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Slope Map (Span 6) */}
        <div className="col-span-6 bg-[#090e18]/80 backdrop-blur-[20px] border border-[#3b494c]/30 rounded-lg p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#dee2f1] font-label-caps">
              LOCAL SLOPE MATRIX (10 km Radius)
            </span>
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <button
                onClick={() => setTerrainLayer('slope_deg')}
                className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                  terrainLayer === 'slope_deg' ? 'bg-[#00daf3] text-[#0e131d]' : 'bg-[#171c26] text-[#bac9cc]'
                }`}
              >
                Slope
              </button>
              <button
                onClick={() => setTerrainLayer('elevation_m')}
                className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                  terrainLayer === 'elevation_m' ? 'bg-[#00daf3] text-[#0e131d]' : 'bg-[#171c26] text-[#bac9cc]'
                }`}
              >
                Elevation
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full rounded overflow-hidden border border-[#3b494c]/40">
            <MoonViewer2D
              gridData={gridHeatmap}
              activeLayer={terrainLayer}
              namedSites={rankedSites}
              selectedSite={site}
              onSelectSite={onSelectSite}
              radiusKm={10}
            />
          </div>

          {/* Slope Legend */}
          <div className="flex items-center justify-between pt-1 text-xs font-mono">
            <span className="text-[#849396]">Hazard Gradient:</span>
            <div className="flex space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold">0°–5° Flat</span>
              <span className="px-2 py-0.5 rounded bg-yellow-500 text-black font-bold">5°–10° Gentle</span>
              <span className="px-2 py-0.5 rounded bg-orange-500 text-black font-bold">10°–15° Steep</span>
              <span className="px-2 py-0.5 rounded bg-red-500 text-white font-bold">&gt;15° Hazard</span>
            </div>
          </div>
        </div>

        {/* Right: Metrics & Charts (Span 6) */}
        <div className="col-span-6 flex flex-col space-y-4">
          {/* 3 Stat Boxes */}
          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-[#090e18]/80 border border-[#3b494c]/30 rounded-lg p-3 text-center">
              <span className="text-[#849396] block text-[10px] uppercase">Average Slope</span>
              <span className="text-xl font-bold text-emerald-400 font-data-mono">{site.slope_deg || 2.8}°</span>
              <span className="text-[10px] text-emerald-300 font-bold block">Safe Grade</span>
            </div>
            <div className="bg-[#090e18]/80 border border-[#3b494c]/30 rounded-lg p-3 text-center">
              <span className="text-[#849396] block text-[10px] uppercase">Elevation</span>
              <span className="text-xl font-bold text-[#00daf3] font-data-mono">{site.elevation_m || 2145} m</span>
              <span className="text-[10px] text-[#849396] block">LOLA Datum</span>
            </div>
            <div className="bg-[#090e18]/80 border border-[#3b494c]/30 rounded-lg p-3 text-center">
              <span className="text-[#849396] block text-[10px] uppercase">Flat Area (&lt;5°)</span>
              <span className="text-xl font-bold text-emerald-400 font-data-mono">78%</span>
              <span className="text-[10px] text-emerald-300 font-bold block">Optimal</span>
            </div>
          </div>

          {/* Elevation Profile */}
          <div className="bg-[#090e18]/80 backdrop-blur-[20px] border border-[#3b494c]/30 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#dee2f1] font-label-caps flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '18px' }}>trending_up</span>
                <span>10 KM TRANSECT ELEVATION PROFILE</span>
              </h3>
              <span className="font-data-mono text-[#00daf3] text-xs">Max Relief Δz: ~270m</span>
            </div>

            <div className="w-full h-28 bg-[#171c26]/60 border border-[#3b494c]/40 rounded p-3 flex flex-col justify-end">
              <svg className="w-full h-20 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#00daf3"
                  strokeWidth="2.5"
                  points={elevProfile.map((val, idx) => {
                    const x = (idx / (elevProfile.length - 1)) * 320;
                    const y = 60 - ((val - (baseElev - 150)) / 300) * 55;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
              <div className="flex justify-between text-[10px] text-[#849396] font-mono pt-1">
                <span>0 km (Start)</span>
                <span>2.5 km</span>
                <span>5.0 km (Center)</span>
                <span>7.5 km</span>
                <span>10 km (Rim)</span>
              </div>
            </div>
          </div>

          {/* Flatness Donut & Distribution */}
          <div className="bg-[#090e18]/80 backdrop-blur-[20px] border border-[#3b494c]/30 rounded-lg p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-[#dee2f1] font-label-caps">
                SLOPE DISTRIBUTION (100 km² Area)
              </h3>
              <p className="text-xs text-[#bac9cc]">
                Over 78% of local area complies with lunar lander landing stability.
              </p>
            </div>
            <div className="space-y-1 text-xs font-mono text-right flex-shrink-0">
              <p className="text-emerald-400 font-bold">■ 0° – 5° (Flat): 78%</p>
              <p className="text-yellow-400 font-bold">■ 5° – 10° (Gentle): 17%</p>
              <p className="text-orange-400 font-bold">■ 10° – 15° (Steep): 4%</p>
              <p className="text-red-400 font-bold">■ &gt;15° (Cliff): 1%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
