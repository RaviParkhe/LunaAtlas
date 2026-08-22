import React, { useState } from 'react';
import { GitCompare, X, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function WhatIfModal({
  isOpen,
  onClose,
  allProfiles,
  onApplyScenario
}) {
  const [scenarioA, setScenarioA] = useState('power_first');
  const [scenarioB, setScenarioB] = useState('isru_mining');

  if (!isOpen) return null;

  // Preset candidate outcomes based on physics
  const scenarioData = {
    balanced: {
      name: 'Balanced Artemis Mission',
      top1: 'Faustini Rim (49.1/100)',
      top2: 'Nobile Rim (47.9/100)',
      top3: 'Shackleton Crater Rim (47.5/100)',
      focus: 'Equal balance of power, ice, and landing safety.'
    },
    power_first: {
      name: 'Solar Power Maximization',
      top1: 'Shackleton Crater Rim (55.7/100)',
      top2: 'Faustini Rim (51.4/100)',
      top3: 'Nobile Rim (48.7/100)',
      focus: 'Rim peaks with >50% sunlight for continuous photovoltaic power.'
    },
    isru_mining: {
      name: 'ISRU Water Extraction',
      top1: 'Haworth Crater (53.6/100)',
      top2: 'Nobile Rim (44.6/100)',
      top3: 'Faustini Rim (44.2/100)',
      focus: 'Permanently Shadowed Regions with maximum cryogenic ice trap concentration.'
    },
    max_safety: {
      name: 'Maximum Structural Safety',
      top1: 'Faustini Rim (63.7/100)',
      top2: 'Shackleton Crater Rim (63.2/100)',
      top3: 'Nobile Rim (59.3/100)',
      focus: 'Level regolith with slope <3° and horizon radiation blocking.'
    }
  };

  const dataA = scenarioData[scenarioA] || scenarioData['power_first'];
  const dataB = scenarioData[scenarioB] || scenarioData['isru_mining'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#090f1d] border border-blue-500/40 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1a2744]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
              "WHAT-IF" MISSION TRADE-OFF COMPARISON
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Scenario A (Baseline):</label>
            <select
              value={scenarioA}
              onChange={(e) => setScenarioA(e.target.value)}
              className="w-full bg-[#050811] border border-[#1a2744] rounded p-2 text-xs text-amber-300 font-semibold focus:outline-none"
            >
              <option value="power_first">Solar Power Maximization</option>
              <option value="balanced">Balanced Artemis Mission</option>
              <option value="isru_mining">ISRU Water Extraction</option>
              <option value="max_safety">Maximum Structural Safety</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Scenario B (Comparison):</label>
            <select
              value={scenarioB}
              onChange={(e) => setScenarioB(e.target.value)}
              className="w-full bg-[#050811] border border-[#1a2744] rounded p-2 text-xs text-cyan-300 font-semibold focus:outline-none"
            >
              <option value="isru_mining">ISRU Water Extraction</option>
              <option value="power_first">Solar Power Maximization</option>
              <option value="balanced">Balanced Artemis Mission</option>
              <option value="max_safety">Maximum Structural Safety</option>
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          {/* Card A */}
          <div className="bg-[#050811] border border-amber-800/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-amber-400">{dataA.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">SCENARIO A</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <p><span className="text-slate-400">#1:</span> <span className="text-white font-bold">{dataA.top1}</span></p>
              <p><span className="text-slate-400">#2:</span> <span className="text-slate-300">{dataA.top2}</span></p>
              <p><span className="text-slate-400">#3:</span> <span className="text-slate-300">{dataA.top3}</span></p>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-900">
              {dataA.focus}
            </p>
          </div>

          {/* Card B */}
          <div className="bg-[#050811] border border-cyan-800/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-cyan-400">{dataB.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">SCENARIO B</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <p><span className="text-slate-400">#1:</span> <span className="text-white font-bold">{dataB.top1}</span></p>
              <p><span className="text-slate-400">#2:</span> <span className="text-slate-300">{dataB.top2}</span></p>
              <p><span className="text-slate-400">#3:</span> <span className="text-slate-300">{dataB.top3}</span></p>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-900">
              {dataB.focus}
            </p>
          </div>
        </div>

        {/* Operational Trade-Off Narration */}
        <div className="bg-[#0d1527] border border-[#1a2744] rounded-lg p-3 space-y-1.5">
          <span className="font-bold text-slate-200 block text-xs">
            SCIENTIFIC TRADE-OFF NARRATION:
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Shifting from <strong>{dataA.name}</strong> to <strong>{dataB.name}</strong> pivots base selection from elevated illuminated crater rims to cold-trap crater interiors. While cryogenic ice accessibility increases substantially, solar energy availability drops to zero, requiring fission surface power (FSP) or tethered power links to the rim.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0d1527] hover:bg-[#121c33] text-slate-300 rounded border border-[#1a2744] transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (onApplyScenario) onApplyScenario(scenarioB);
              onClose();
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition shadow-sm"
          >
            Apply Scenario B to Workstation
          </button>
        </div>
      </div>
    </div>
  );
}
