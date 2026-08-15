import React from 'react';
import { 
  Compass, 
  Layers, 
  Activity, 
  FileText, 
  Sparkles, 
  GitCompare, 
  Radio, 
  Moon,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  solarData, 
  onOpenNLPModal, 
  onOpenWhatIfModal, 
  onOpenDossierModal 
}) {
  const isQuiet = solarData?.threat_level === 'QUIET';
  const isElevated = solarData?.threat_level === 'ELEVATED';

  return (
    <header className="w-full bg-[#080d1a] border-b border-[#1a2744] px-4 py-2.5 flex items-center justify-between z-30 select-none">
      {/* Brand & System Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Moon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              LUNAR HABITAT <span className="text-cyan-400">AI SITE SELECTOR</span>
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
              SW02
            </span>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            NASA Artemis III Decision Support Workstation • 400×400km South Pole Grid
          </p>
        </div>
      </div>

      {/* Center View Selector Tabs */}
      <div className="flex items-center bg-[#0d1527] border border-[#1a2744] p-0.5 rounded-lg">
        <button
          onClick={() => setCurrentView('mission')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentView === 'mission'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c33]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>MISSION ANALYSIS RESULTS</span>
        </button>
        <button
          onClick={() => setCurrentView('terrain')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentView === 'terrain'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c33]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>TERRAIN ANALYSIS</span>
        </button>
      </div>

      {/* Right Quick Actions & Live NOAA Badge */}
      <div className="flex items-center space-x-2.5">
        {/* Live NOAA SWPC Solar Weather Monitor */}
        <div 
          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs ${
            isQuiet 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : isElevated 
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
          title={solarData?.lunar_surface_risk || "NOAA SWPC Space Weather Monitoring"}
        >
          <div className="relative flex items-center justify-center">
            <span className={`w-2 h-2 rounded-full ${isQuiet ? 'bg-emerald-400' : isElevated ? 'bg-amber-400' : 'bg-rose-500'} beacon-live`} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-[11px]">NOAA SWPC:</span>
              <span className="font-mono text-[11px] uppercase">{solarData?.threat_level || 'QUIET'}</span>
            </div>
            <span className="text-[9px] opacity-75 font-mono">
              R{solarData?.r_scale || 0} S{solarData?.s_scale || 0} G{solarData?.g_scale || 0} • {solarData?.is_live ? 'LIVE' : 'CACHED'}
            </span>
          </div>
        </div>

        {/* AI Natural Language Prompt Button */}
        <button
          onClick={onOpenNLPModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/70 hover:to-indigo-800/70 border border-purple-600/40 text-purple-200 text-xs font-semibold transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Natural Language</span>
        </button>

        {/* What-If Scenario Compare Button */}
        <button
          onClick={onOpenWhatIfModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0d1527] hover:bg-[#121c33] border border-[#1a2744] hover:border-blue-500/50 text-slate-200 text-xs font-semibold transition"
        >
          <GitCompare className="w-3.5 h-3.5 text-blue-400" />
          <span>Compare Sites</span>
        </button>

        {/* Export Report / Dossier */}
        <button
          onClick={onOpenDossierModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-700/50 text-cyan-200 text-xs font-semibold transition"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
}
