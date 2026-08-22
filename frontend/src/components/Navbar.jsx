import React from 'react';
import { 
  Compass, 
  Layers, 
  FileText, 
  Sparkles, 
  GitCompare, 
  Radio, 
  Moon,
  ShieldCheck,
  Zap,
  Activity
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
    <header className="w-full bg-[#060b18] border-b border-[#15223c] px-5 py-2.5 flex items-center justify-between z-30 select-none shadow-lg">
      {/* Brand & Mission Status */}
      <div className="flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-300/30">
          <Moon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5 font-mono">
              LUNAR HABITAT <span className="text-cyan-400">AI SITE SELECTOR</span>
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800/60 font-mono font-bold">
              SW02
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
            <span>NASA Artemis Decision Support</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">400×400km South Pole Grid</span>
          </p>
        </div>
      </div>

      {/* Center View Selector Tabs */}
      <div className="flex items-center bg-[#0b1329] border border-[#1a2744] p-1 rounded-lg space-x-1 shadow-inner">
        <button
          onClick={() => setCurrentView('mission')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
            currentView === 'mission'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c33]'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-cyan-300" />
          <span>MISSION ANALYSIS RESULTS</span>
        </button>
        <button
          onClick={() => setCurrentView('terrain')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
            currentView === 'terrain'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c33]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-300" />
          <span>TERRAIN ANALYSIS</span>
        </button>
      </div>

      {/* Right Action Controls & Live NOAA SWPC Beacon */}
      <div className="flex items-center space-x-3">
        {/* Live NOAA SWPC Telemetry Badge */}
        <div 
          className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-xs shadow-sm ${
            isQuiet 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : isElevated 
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
          title={solarData?.lunar_surface_risk || "Real-time space weather feed from NOAA SWPC"}
        >
          <div className="relative flex items-center justify-center">
            <span className={`w-2 h-2 rounded-full ${isQuiet ? 'bg-emerald-400' : isElevated ? 'bg-amber-400' : 'bg-rose-500'} beacon-pulse`} />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-[10px] uppercase font-mono tracking-wider">NOAA SWPC:</span>
              <span className="font-extrabold text-[10px] font-mono">{solarData?.threat_level || 'QUIET'}</span>
            </div>
            <span className="text-[9px] opacity-80 font-mono">
              R{solarData?.r_scale || 0} S{solarData?.s_scale || 0} G{solarData?.g_scale || 0} • {solarData?.is_live ? 'LIVE FEED' : 'CACHED'}
            </span>
          </div>
        </div>

        {/* AI Natural Language Trigger */}
        <button
          onClick={onOpenNLPModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141b36] hover:bg-[#1a2345] border border-purple-500/40 hover:border-purple-400 text-purple-200 text-xs font-semibold transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Prompt</span>
        </button>

        {/* Compare Sites Trigger */}
        <button
          onClick={onOpenWhatIfModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0b1329] hover:bg-[#15223c] border border-[#1a2744] hover:border-blue-400 text-slate-200 text-xs font-semibold transition shadow-sm"
        >
          <GitCompare className="w-3.5 h-3.5 text-blue-400" />
          <span>Compare Sites</span>
        </button>

        {/* Export Report Trigger */}
        <button
          onClick={onOpenDossierModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-600/50 hover:border-cyan-400 text-cyan-200 text-xs font-bold transition shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
}
