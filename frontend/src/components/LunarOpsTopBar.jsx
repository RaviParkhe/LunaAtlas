import React from 'react';

export default function LunarOpsTopBar({
  activeTab,
  setActiveTab,
  solarData,
  onOpenNLPModal,
  onOpenDossierModal
}) {
  const tabs = [
    { id: 'parameters', label: 'PARAMETERS SETUP', icon: 'tune' },
    { id: 'map', label: 'MISSION MAP', icon: 'map' },
    { id: 'surface', label: 'SURFACE & TERRAIN', icon: 'terrain' },
    { id: 'globe', label: '3D MOON GLOBE', icon: 'public' },
  ];

  return (
    <header className="bg-[#090e18]/95 backdrop-blur-md border-b border-[#3b494c]/40 px-6 py-3 flex items-center justify-between w-full z-50 flex-shrink-0 select-none shadow-xl">
      {/* Left: Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#00daf3]/10 border border-[#00daf3]/40 flex items-center justify-center text-[#00daf3] shadow-md shadow-[#00daf3]/10">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>rocket_launch</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-sm font-bold text-[#dee2f1] tracking-wider">
              LUNAR OPS
            </h1>
            <span className="text-[10px] font-data-mono px-1.5 py-0.2 bg-[#00daf3]/15 text-[#00daf3] rounded border border-[#00daf3]/30 font-bold">
              v2.0
            </span>
          </div>
          <p className="text-[10px] font-data-mono text-[#bac9cc]">NASA Artemis South Pole Site Decision System</p>
        </div>
      </div>

      {/* Center: Main View Tabs */}
      <nav className="flex items-center gap-1 bg-[#171c26]/80 border border-[#3b494c]/50 p-1 rounded-lg">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-md font-data-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#00daf3] text-[#090e18] shadow-md shadow-[#00daf3]/20'
                  : 'text-[#bac9cc] hover:text-[#dee2f1] hover:bg-[#252a35]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Telemetry + Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Space Weather Status */}
        <div className="hidden xl:flex items-center gap-2 bg-[#171c26]/60 border border-[#3b494c]/40 px-3 py-1.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-data-mono text-[11px] text-[#bac9cc]">
            SPACE WEATHER: <strong className="text-emerald-300">QUIET (Kp0)</strong>
          </span>
        </div>

        {/* AI Prompt Button */}
        <button
          onClick={onOpenNLPModal}
          className="px-3.5 py-1.5 bg-[#171c26] hover:bg-[#252a35] border border-[#00daf3]/50 text-[#00daf3] font-data-mono text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[#00daf3]" style={{ fontSize: '16px' }}>psychology</span>
          <span>AI PROMPT</span>
        </button>

        {/* Export Dossier Button */}
        <button
          onClick={onOpenDossierModal}
          className="px-3.5 py-1.5 bg-[#00daf3] hover:bg-[#9cf0ff] text-[#090e18] font-data-mono text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#00daf3]/20"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
          <span>EXPORT DOSSIER</span>
        </button>
      </div>
    </header>
  );
}
