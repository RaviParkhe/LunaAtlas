import React, { useState } from 'react';
import { Sparkles, X, Send, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NaturalLanguageModal({
  isOpen,
  onClose,
  onApplyParsedWeights
}) {
  const [promptText, setPromptText] = useState('');
  const [parsedWeights, setParsedWeights] = useState(null);
  const [rationale, setRationale] = useState('');

  if (!isOpen) return null;

  // NLP Heuristic Parser with zero downtime fallback
  const handleParsePrompt = () => {
    if (!promptText.trim()) return;

    const lower = promptText.toLowerCase();
    let sun = 0.30;
    let lnd = 0.25;
    let ice = 0.25;
    let rad = 0.15;
    let dust = 0.05;
    let reasons = [];

    // Check keywords
    if (lower.includes('water') || lower.includes('ice') || lower.includes('isru') || lower.includes('mine') || lower.includes('fuel')) {
      ice = 0.45;
      sun = 0.20;
      lnd = 0.20;
      rad = 0.10;
      reasons.push('Elevated Water Ice weight to 45% for cryogenic resource harvesting.');
    }

    if (lower.includes('sun') || lower.includes('solar') || lower.includes('power') || lower.includes('illumination') || lower.includes('energy')) {
      sun = Math.max(sun, 0.50);
      ice = 0.15;
      lnd = 0.20;
      rad = 0.10;
      reasons.push('Prioritized Solar Illumination to 50% for high continuous photovoltaic capacity.');
    }

    if (lower.includes('slope') && (lower.includes('secondary') || lower.includes('ignore') || lower.includes('less'))) {
      lnd = 0.10;
      reasons.push('Reduced slope/terrain landing constraint to 10%.');
    }

    if (lower.includes('radiation') || lower.includes('shield') || lower.includes('cosmic') || lower.includes('gcr') || lower.includes('safety')) {
      rad = Math.max(rad, 0.30);
      reasons.push('Boosted Radiation Shielding weight to 30% for crew biological protection.');
    }

    if (lower.includes('dust') || lower.includes('levitation')) {
      dust = 0.15;
      reasons.push('Increased electrostatic dust penalty to 15%.');
    }

    if (reasons.length === 0) {
      reasons.push('Parsed balanced multi-objective mission parameters with standard Artemis weights.');
    }

    const calculated = {
      sunlight: parseFloat(sun.toFixed(2)),
      landing_safety: parseFloat(lnd.toFixed(2)),
      water_ice: parseFloat(ice.toFixed(2)),
      radiation_safety: parseFloat(rad.toFixed(2)),
      dust_penalty: parseFloat(dust.toFixed(2))
    };

    setParsedWeights(calculated);
    setRationale(reasons.join(' '));
  };

  const handleApply = () => {
    if (parsedWeights && onApplyParsedWeights) {
      onApplyParsedWeights(parsedWeights);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#090f1d] border border-purple-500/40 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1a2744]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
              AI NATURAL LANGUAGE MISSION PROMPT
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-[11px] text-slate-300 font-semibold block">
            Enter your mission requirements in plain English:
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. Prioritize water ice extraction and radiation shielding for long-term crew survival, terrain slope is secondary."
            className="w-full h-24 bg-[#050811] border border-[#1a2744] focus:border-purple-500 rounded-lg p-3 text-xs text-slate-200 focus:outline-none resize-none"
          />

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Maximize continuous sunlight on crater rims",
              "Prioritize water ice & radiation safety, slope is secondary",
              "Maximum landing safety & flat regolith foundation"
            ].map((s) => (
              <button
                key={s}
                onClick={() => { setPromptText(s); }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d1527] border border-[#1a2744] text-purple-300 hover:border-purple-500/50 transition"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Parse Button */}
        <button
          onClick={handleParsePrompt}
          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-purple-900/30 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Convert to Scoring Weights</span>
        </button>

        {/* Parsed Output Preview */}
        {parsedWeights && (
          <div className="bg-[#050811] border border-purple-800/40 rounded-lg p-3 space-y-3 animate-fadeIn">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Parsed Weights Configuration:</span>
            </div>

            <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
              <div className="p-1.5 bg-[#0d1527] rounded border border-slate-800">
                <span className="text-amber-400 block font-bold">{Math.round(parsedWeights.sunlight * 100)}%</span>
                <span className="text-slate-400">Sun</span>
              </div>
              <div className="p-1.5 bg-[#0d1527] rounded border border-slate-800">
                <span className="text-emerald-400 block font-bold">{Math.round(parsedWeights.landing_safety * 100)}%</span>
                <span className="text-slate-400">Landing</span>
              </div>
              <div className="p-1.5 bg-[#0d1527] rounded border border-slate-800">
                <span className="text-cyan-400 block font-bold">{Math.round(parsedWeights.water_ice * 100)}%</span>
                <span className="text-slate-400">Ice</span>
              </div>
              <div className="p-1.5 bg-[#0d1527] rounded border border-slate-800">
                <span className="text-purple-400 block font-bold">{Math.round(parsedWeights.radiation_safety * 100)}%</span>
                <span className="text-slate-400">Rad</span>
              </div>
              <div className="p-1.5 bg-[#0d1527] rounded border border-slate-800">
                <span className="text-rose-400 block font-bold">{Math.round(parsedWeights.dust_penalty * 100)}%</span>
                <span className="text-slate-400">Dust</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 italic border-l border-purple-500 pl-2">
              {rationale}
            </p>

            <button
              onClick={handleApply}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition shadow-sm"
            >
              Apply to Workstation & Recalculate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
