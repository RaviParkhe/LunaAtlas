import React from 'react';

export default function LunarOpsSideNav({
  activeTab,
  setActiveTab,
  onOpenNLPModal
}) {
  return (
    <nav className="bg-[#090e18]/80 backdrop-blur-xl h-full w-64 border-r border-[#3b494c]/30 flex flex-col z-40 flex-shrink-0 select-none">
      {/* Header Section */}
      <div className="p-6 border-b border-[#3b494c]/30 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#303540] border border-[#3b494c] flex items-center justify-center text-[#00daf3]">
            <span className="material-symbols-outlined">radar</span>
          </div>
          <div>
            <div className="font-mono font-bold text-[#00daf3] text-[14px] leading-tight">
              MISSION ALPHA
            </div>
            <div className="font-data-mono text-[#bac9cc] text-[10px] mt-1">
              T+ 142:12:04
            </div>
          </div>
        </div>

        <div className="bg-[#00daf3]/10 border border-[#00daf3]/30 px-3 py-1.5 rounded text-[#00daf3] font-label-caps text-[10px] flex items-center justify-between">
          SITE STATUS: ACTIVE
          <span className="w-2 h-2 rounded-full bg-[#00daf3] animate-pulse"></span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {/* Parameters Setup */}
        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 font-label-caps text-xs text-left cursor-pointer ${
            activeTab === 'parameters'
              ? 'bg-[#00daf3]/15 text-[#00daf3] border-l-4 border-[#00daf3] ml-[-12px] pl-[15px]'
              : 'text-[#bac9cc] hover:bg-[#303540]/40 hover:text-[#00daf3]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
          Parameters Setup
        </button>

        {/* Mission Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 font-label-caps text-xs text-left cursor-pointer ${
            activeTab === 'map'
              ? 'bg-[#00daf3]/15 text-[#00daf3] border-l-4 border-[#00daf3] ml-[-12px] pl-[15px]'
              : 'text-[#bac9cc] hover:bg-[#303540]/40 hover:text-[#00daf3]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>map</span>
          Mission Map
        </button>

        {/* Surface Data */}
        <button
          onClick={() => setActiveTab('surface')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 font-label-caps text-xs text-left cursor-pointer ${
            activeTab === 'surface'
              ? 'bg-[#00daf3]/15 text-[#00daf3] border-l-4 border-[#00daf3] ml-[-12px] pl-[15px]'
              : 'text-[#bac9cc] hover:bg-[#303540]/40 hover:text-[#00daf3]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>terrain</span>
          Surface Data
        </button>

        {/* 3D Moon Globe */}
        <button
          onClick={() => setActiveTab('globe')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 font-label-caps text-xs text-left cursor-pointer ${
            activeTab === 'globe'
              ? 'bg-[#00daf3]/15 text-[#00daf3] border-l-4 border-[#00daf3] ml-[-12px] pl-[15px]'
              : 'text-[#bac9cc] hover:bg-[#303540]/40 hover:text-[#00daf3]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>public</span>
          3D Moon Globe
        </button>

        {/* AI Heuristics */}
        <button
          onClick={onOpenNLPModal}
          className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#303540]/40 transition-all duration-200 text-[#bac9cc] font-label-caps text-xs text-left cursor-pointer hover:text-[#00daf3]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>psychology</span>
          AI Heuristics Prompt
        </button>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-[#3b494c]/30 flex flex-col gap-1">
        <div className="px-3 py-1.5 text-[#849396] font-label-caps text-[10px]">
          ARIS-LUNA ENGINE V1.0
        </div>
      </div>
    </nav>
  );
}
