import React from 'react';
import MoonViewer3D from './MoonViewer3D';

export default function GlobeWorkspace({
  namedSites,
  selectedSite,
  onSelectSite,
  activeLayer
}) {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden select-none bg-grid-pattern">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-[#090e18]/80 backdrop-blur-[20px] border border-[#3b494c]/30 rounded-lg px-6 py-3.5">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded bg-[#303540] border border-[#3b494c] flex items-center justify-center text-[#00daf3]">
            <span className="material-symbols-outlined">public</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#dee2f1] uppercase font-mono">
              3D INTERACTIVE LUNAR ORBIT & SITES
            </h2>
            <p className="text-xs text-[#bac9cc] font-mono">
              True Lunar Physics Sphere (R = 1,737.4 km) • South Polar Suitability Tensor Drape
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#849396] font-mono">Click site below to fly camera to crater rim:</span>
        </div>
      </div>

      {/* Main 3D Globe */}
      <div className="flex-1 bg-[#090e18]/80 border border-[#3b494c]/30 rounded-lg relative overflow-hidden">
        <MoonViewer3D
          namedSites={namedSites}
          selectedSite={selectedSite}
          onSelectSite={onSelectSite}
          activeLayer={activeLayer}
        />
      </div>

      {/* Bottom Candidate Sites Bar */}
      <div className="grid grid-cols-6 gap-3">
        {namedSites && namedSites.map((s) => {
          const isSelected = selectedSite && selectedSite.name === s.name;
          return (
            <button
              key={s.name}
              onClick={() => onSelectSite(s)}
              className={`p-3 rounded border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00daf3] text-[#0e131d] border-[#00daf3] shadow-md shadow-[#00daf3]/20 font-bold'
                  : 'bg-[#090e18]/80 border-[#3b494c]/30 hover:bg-[#171c26] text-[#dee2f1]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs">#{s.rank}</span>
                <span className="text-[10px] opacity-80 font-mono">{s.overall_score.toFixed(0)}/100</span>
              </div>
              <h4 className="font-bold text-xs truncate">{s.name}</h4>
              <p className="text-[10px] opacity-75 font-mono mt-0.5">{Math.abs(s.lat).toFixed(1)}°S, {s.lon.toFixed(1)}°E</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
