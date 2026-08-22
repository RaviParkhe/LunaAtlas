import React from 'react';
import { Rocket, Play, Loader2 } from 'lucide-react';

export default function Header({ onRunAnalysis, isAnalyzing }) {
  return (
    <header className="w-full glass-panel border-b border-[#1e293b] px-6 py-3.5 flex items-center justify-between z-20 sticky top-0 bg-[#0b0f19]">
      {/* Brand Logo & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Rocket className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-wide text-slate-100">
              LunarHabitat
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
              v2.5 AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
            AI-Powered Lunar Habitat Site Selection System
          </p>
        </div>
      </div>

      {/* Top Right: Run AI Analysis Button - Solid Professional Style */}
      <button
        onClick={onRunAnalysis}
        disabled={isAnalyzing}
        className={`btn-primary px-4 py-2 text-xs font-semibold rounded flex items-center gap-2 text-white transition-colors ${
          isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Analyzing Lunar Datasets...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run AI Analysis</span>
          </>
        )}
      </button>
    </header>
  );
}
