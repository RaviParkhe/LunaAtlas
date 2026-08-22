import React from 'react';
import { 
  Settings2, 
  Sliders, 
  Sun, 
  Droplet, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Compass, 
  Users, 
  Clock, 
  Flame,
  RefreshCw,
  Target,
  Globe
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
    <aside className="w-[320px] bg-[#060b18] border-l border-[#15223c] flex flex-col h-full overflow-y-auto p-4 space-y-4 select-none text-xs flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#15223c]">
        <div className="flex items-center space-x-2">
          <Settings2 className="w-4 h-4 text-cyan-400" />
          <h2 className="font-extrabold text-white uppercase tracking-wider text-xs font-mono">
            MISSION CONFIGURATION
          </h2>
        </div>
        <button
          onClick={onResetWeights}
          className="px-2 py-1 text-[10px] text-slate-400 hover:text-cyan-300 rounded bg-[#0b1329] border border-[#1a2744] hover:border-cyan-500/50 transition flex items-center gap-1 font-mono"
          title="Reset to Balanced Defaults"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Mission Parameters Card */}
      <div className="hud-panel-sub p-3 space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Target className="w-3 h-3 text-blue-400" />
          <span>Mission Parameters</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-slate-400" /> Crew Size
          </span>
          <span className="font-semibold text-slate-200 font-mono">11 – 20 Astronauts</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" /> Duration
          </span>
          <span className="font-semibold text-slate-200 font-mono">Permanent Base</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" /> Power Strategy
          </span>
          <span className="font-semibold text-amber-300 font-mono">Solar + Surface FSP</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Droplet className="w-3 h-3 text-cyan-400" /> Local ISRU
          </span>
          <span className="font-semibold text-cyan-300 font-mono">Yes (Water / O2 / H2)</span>
        </div>
      </div>

      {/* 2. Preset Profiles */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Mission Profiles</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'balanced', label: 'Balanced Artemis' },
            { id: 'power_first', label: 'Solar Power' },
            { id: 'isru_mining', label: 'ISRU Ice Mining' },
            { id: 'max_safety', label: 'Max Safety' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProfile(p.id)}
              className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition ${
                activeProfile === p.id
                  ? 'bg-blue-600/30 border-blue-500 text-cyan-200 shadow-sm'
                  : 'bg-[#0b1329] border-[#1a2744] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Mission Priority Sliders */}
      <div className="hud-panel-sub p-3 space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mission Priorities</span>
          </label>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-mono">
            MCDA Weights
          </span>
        </div>

        {/* Sunlight */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Sun className="w-3 h-3" /> Sunlight
            </span>
            <span className="font-mono font-bold text-amber-300">
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

        {/* Safety */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3" /> Safety & Landing
            </span>
            <span className="font-mono font-bold text-emerald-300">
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

        {/* Water Ice */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <Droplet className="w-3 h-3" /> Water Ice
            </span>
            <span className="font-mono font-bold text-cyan-300">
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

        {/* Radiation */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-purple-400 font-medium">
              <Layers className="w-3 h-3" /> Radiation Shielding
            </span>
            <span className="font-mono font-bold text-purple-300">
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

        {/* Dust Penalty */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <Flame className="w-3 h-3" /> Dust Penalty
            </span>
            <span className="font-mono font-bold text-rose-300">
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

      {/* 4. Enforce Flatness Gate */}
      <div className="hud-panel-sub p-3 space-y-1.5">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-200 font-semibold text-[11px]">Enforce Flatness Gate</span>
          <input
            type="checkbox"
            checked={applyFlatnessGate}
            onChange={onToggleFlatnessGate}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
        </label>
        <p className="text-[10px] text-slate-400 leading-tight">
          Penalizes steep crater walls to enforce level habitat placement.
        </p>
      </div>
    </aside>
  );
}
