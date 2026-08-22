import React from 'react';
import { 
  Sliders, 
  Sun, 
  ShieldCheck, 
  Droplet, 
  Layers, 
  Flame, 
  RotateCcw, 
  Sparkles, 
  GitCompare,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export default function SimulatorWorkspace({
  weights,
  onWeightChange,
  rankedSites,
  activeProfile,
  onSelectProfile,
  applyFlatnessGate,
  onToggleFlatnessGate,
  onResetWeights
}) {
  const top3 = rankedSites ? rankedSites.slice(0, 3) : [];

  return (
    <div className="flex-1 flex p-5 gap-5 overflow-y-auto select-none">
      {/* Left: Interactive Multi-Criteria Weight Controls (Span 5) */}
      <div className="w-[420px] flex flex-col space-y-4 flex-shrink-0">
        <div className="aero-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                MISSION WEIGHT SIMULATOR
              </h2>
            </div>
            <button
              onClick={onResetWeights}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Adjust multi-criteria decision weights in real-time. The NumPy engine re-evaluates all 160,000 grid cells in under 5ms.
          </p>

          {/* Sliders */}
          <div className="space-y-4 pt-1">
            {/* Sunlight */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-2">
                  <Sun className="w-4 h-4" /> Solar Illumination
                </span>
                <span className="font-extrabold text-amber-300">{Math.round(weights.sunlight * 100)}%</span>
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

            {/* Landing Safety */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Landing Safety & Flatness
                </span>
                <span className="font-extrabold text-emerald-300">{Math.round(weights.landing_safety * 100)}%</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-2">
                  <Droplet className="w-4 h-4" /> Water Ice Extraction (ISRU)
                </span>
                <span className="font-extrabold text-cyan-300">{Math.round(weights.water_ice * 100)}%</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-purple-400 font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Radiation Shielding
                </span>
                <span className="font-extrabold text-purple-300">{Math.round(weights.radiation_safety * 100)}%</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center gap-2">
                  <Flame className="w-4 h-4" /> Dust Levitation Penalty
                </span>
                <span className="font-extrabold text-rose-300">{Math.round(weights.dust_penalty * 100)}%</span>
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

          {/* Flatness Gate Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-200">Enforce Hard Flatness Gate</span>
              <input
                type="checkbox"
                checked={applyFlatnessGate}
                onChange={onToggleFlatnessGate}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </label>
            <p className="text-[11px] text-slate-400 pt-1">
              Zeroes out scores for terrain slope exceeding critical lunar landing safety limits.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Live Dynamic Rankings & Trade-Off Matrix */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Dynamic Leaderboard Card */}
        <div className="aero-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              LIVE RECALCULATED LEADERBOARD
            </h3>
            <span className="text-xs text-cyan-400 font-mono font-bold">Vectorized Matrix Evaluation</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {rankedSites && rankedSites.map((s) => {
              const isRank1 = s.rank === 1;
              return (
                <div
                  key={s.name}
                  className={`p-3.5 rounded-xl border ${
                    isRank1
                      ? 'bg-blue-950/60 border-cyan-400 shadow-md shadow-cyan-500/10'
                      : 'bg-[#131d35]/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${
                      isRank1 ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-200'
                    }`}>
                      RANK #{s.rank}
                    </span>
                    <span className="text-sm font-mono font-extrabold text-cyan-300">
                      {s.overall_score.toFixed(1)} / 100
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-100 mt-1">{s.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{Math.abs(s.lat).toFixed(2)}°S, {s.lon.toFixed(2)}°E</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side-by-Side Trade-Off Comparison Matrix */}
        <div className="aero-card p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-400" />
            <span>TOP 3 SITES MULTI-ATTRIBUTE MATRIX</span>
          </h3>

          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <th className="pb-2">Attribute / Factor</th>
                {top3.map((s, idx) => (
                  <th key={s.name} className="pb-2 text-center text-slate-200">
                    #{idx + 1} {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              <tr>
                <td className="py-2.5 text-amber-400 font-bold">Sunlight Illumination</td>
                {top3.map((s) => (
                  <td key={s.name} className="py-2.5 text-center font-extrabold">{s.raw_metrics?.sunlight_score?.toFixed(1)}%</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 text-emerald-400 font-bold">Landing Safety Score</td>
                {top3.map((s) => (
                  <td key={s.name} className="py-2.5 text-center font-extrabold">{s.raw_metrics?.landing_suitability_score?.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 text-cyan-400 font-bold">Water Ice Potential</td>
                {top3.map((s) => (
                  <td key={s.name} className="py-2.5 text-center font-extrabold">{s.raw_metrics?.water_ice_score?.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 text-purple-400 font-bold">Radiation Shielding</td>
                {top3.map((s) => (
                  <td key={s.name} className="py-2.5 text-center font-extrabold">{s.raw_metrics?.radiation_safety_score?.toFixed(1)}</td>
                ))}
              </tr>
              <tr className="bg-blue-950/40">
                <td className="py-2.5 text-white font-extrabold">Calculated Suitability</td>
                {top3.map((s) => (
                  <td key={s.name} className="py-2.5 text-center font-extrabold text-cyan-300 text-sm">
                    {s.overall_score?.toFixed(1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
