import React from 'react';
import { 
  Settings2, 
  Sliders, 
  Sun, 
  Droplet, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Layers, 
  Compass, 
  Users, 
  Clock, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function MissionConfigSidebar({
  weights,
  onWeightChange,
  activeProfile,
  onSelectProfile,
  applyFlatnessGate,
  onToggleFlatnessGate,
  onResetWeights
}) {
  return (
    <aside className="w-80 bg-[#080d1a] border-l border-[#1a2744] flex flex-col h-full overflow-y-auto p-4 space-y-5 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1a2744]">
        <div className="flex items-center space-x-2">
          <Settings2 className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            MISSION CONFIGURATION
          </h2>
        </div>
        <button
          onClick={onResetWeights}
          className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-[#121c33] transition"
          title="Reset to Balanced Defaults"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Mission Profiles */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-blue-400" />
          <span>Mission Profile Presets</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'balanced', label: 'Balanced Artemis', color: 'blue' },
            { id: 'power_first', label: 'Solar Power First', color: 'amber' },
            { id: 'isru_mining', label: 'ISRU Ice Extraction', color: 'cyan' },
            { id: 'max_safety', label: 'Maximum Safety', color: 'emerald' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProfile(p.id)}
              className={`p-2 rounded-lg border text-left transition ${
                activeProfile === p.id
                  ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm'
                  : 'bg-[#0d1527] border-[#1a2744] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-[11px] leading-tight">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mission Parameters Card */}
      <div className="bg-[#0d1527] border border-[#1a2744] rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Crew Size
          </span>
          <span className="font-semibold text-slate-200 font-mono">11 – 20 Astronauts</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Mission Duration
          </span>
          <span className="font-semibold text-slate-200 font-mono">Permanent Settlement</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Power Strategy
          </span>
          <span className="font-semibold text-amber-300 font-mono">Solar + Surface FSP</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
            Resource Usage (ISRU)
          </span>
          <span className="font-semibold text-cyan-300 font-mono">Yes (Water / O2 / H2)</span>
        </div>
      </div>

      {/* Dynamic Weight Sliders */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mission Priority Weights</span>
          </label>
          <span className="text-[10px] text-cyan-400 font-mono">Dynamic MCDA</span>
        </div>

        {/* 1. Sunlight */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Sun className="w-3 h-3" /> Sunlight Illumination
            </span>
            <span className="font-mono text-amber-300">
              {Math.round(weights.sunlight * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.sunlight}
            onChange={(e) => onWeightChange('sunlight', parseFloat(e.target.value))}
            className="accent-amber-400"
          />
        </div>

        {/* 2. Terrain & Landing Safety */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3" /> Terrain & Landing Safety
            </span>
            <span className="font-mono text-emerald-300">
              {Math.round(weights.landing_safety * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.landing_safety}
            onChange={(e) => onWeightChange('landing_safety', parseFloat(e.target.value))}
            className="accent-emerald-400"
          />
        </div>

        {/* 3. Water Ice */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <Droplet className="w-3 h-3" /> Water Ice Extraction
            </span>
            <span className="font-mono text-cyan-300">
              {Math.round(weights.water_ice * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.water_ice}
            onChange={(e) => onWeightChange('water_ice', parseFloat(e.target.value))}
            className="accent-cyan-400"
          />
        </div>

        {/* 4. Radiation Protection */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-purple-400 font-medium">
              <Layers className="w-3 h-3" /> Radiation Shielding
            </span>
            <span className="font-mono text-purple-300">
              {Math.round(weights.radiation_safety * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.radiation_safety}
            onChange={(e) => onWeightChange('radiation_safety', parseFloat(e.target.value))}
            className="accent-purple-400"
          />
        </div>

        {/* 5. Dust Penalty */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <Flame className="w-3 h-3" /> Dust Levitation Penalty
            </span>
            <span className="font-mono text-rose-300">
              {Math.round(weights.dust_penalty * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.01"
            value={weights.dust_penalty}
            onChange={(e) => onWeightChange('dust_penalty', parseFloat(e.target.value))}
            className="accent-rose-400"
          />
        </div>
      </div>

      {/* Flatness Gate Switch */}
      <div className="pt-2 border-t border-[#1a2744]">
        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#0d1527] border border-[#1a2744] hover:border-slate-600 transition">
          <span className="text-slate-300 font-medium">Enforce Flatness Gate</span>
          <input
            type="checkbox"
            checked={applyFlatnessGate}
            onChange={onToggleFlatnessGate}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
        </label>
        <p className="text-[10px] text-slate-500 mt-1">
          Filters out unbuildable steep cliff slopes from global peak scoring.
        </p>
      </div>
    </aside>
  );
}
