import React, { useState } from 'react';
import { Target, Clock, Users, Zap, Pickaxe, Search, ChevronDown, ChevronUp, Sliders, Loader2, CheckSquare, Square } from 'lucide-react';

export default function MissionConfiguration({ config, setConfig, onAnalyze, isAnalyzing }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

  // Specific sites options list
  const availableSpecificSites = [
    'Shackleton Crater Rim',
    'de Gerlache Rim',
    'Malapert Massif',
    'Faustini Rim',
    'Nobile Rim',
    'Haworth Crater'
  ];

  const handleSelectChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSiteToggle = (siteName) => {
    setConfig(prev => {
      const currentSelected = prev.selectedSpecificSites || [];
      const updated = currentSelected.includes(siteName)
        ? currentSelected.filter(s => s !== siteName)
        : [...currentSelected, siteName];
      return { ...prev, selectedSpecificSites: updated };
    });
  };

  const handleWeightChange = (weightKey, val) => {
    setConfig(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [weightKey]: parseInt(val, 10)
      }
    }));
  };

  return (
    <aside className="w-80 min-w-[320px] glass-panel border-l border-[#1e293b] p-5 flex flex-col justify-between overflow-y-auto z-10 select-none bg-[#0b0f19]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
              Mission Configuration
            </h2>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          {/* MISSION OBJECTIVE */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              MISSION OBJECTIVE
            </label>
            <div className="relative">
              <select
                value={config.objective}
                onChange={(e) => handleSelectChange('objective', e.target.value)}
                className="custom-select pr-8 text-[11px]"
              >
                <option value="Long-Term Human Habitat">Long-Term Human Habitat</option>
                <option value="Scientific Research Outpost">Scientific Research Outpost</option>
                <option value="Solar Power Base">Solar Power Base</option>
                <option value="Water Mining Base">Water Mining Base</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* MISSION DURATION */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              MISSION DURATION
            </label>
            <div className="relative">
              <select
                value={config.duration}
                onChange={(e) => handleSelectChange('duration', e.target.value)}
                className="custom-select pr-8 text-[11px]"
              >
                <option value="Permanent">Permanent</option>
                <option value="1-3 Years">Short-Term (1-3 Years)</option>
                <option value="3-5 Years">Medium-Term (3-5 Years)</option>
                <option value="5-10 Years">Long-Term (5-10 Years)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* CREW SIZE */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              CREW SIZE
            </label>
            <div className="relative">
              <select
                value={config.crewSize}
                onChange={(e) => handleSelectChange('crewSize', e.target.value)}
                className="custom-select pr-8 text-[11px]"
              >
                <option value="11-20">11-20 Astronauts</option>
                <option value="1-5">1-5 Astronauts</option>
                <option value="6-10">6-10 Astronauts</option>
                <option value="21-50">21-50 Astronauts</option>
                <option value="50+">50+ Astronauts</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* POWER STRATEGY */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              POWER STRATEGY
            </label>
            <div className="relative">
              <select
                value={config.powerStrategy}
                onChange={(e) => handleSelectChange('powerStrategy', e.target.value)}
                className="custom-select pr-8 text-[11px]"
              >
                <option value="Solar">Solar</option>
                <option value="Nuclear">Nuclear</option>
                <option value="Hybrid (Solar + Nuclear)">Hybrid (Solar + Nuclear)</option>
                <option value="Fuel Cell">Fuel Cell</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* LOCAL RESOURCE USAGE */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Pickaxe className="w-3.5 h-3.5 text-blue-400" />
              LOCAL RESOURCE USAGE
            </label>
            <div className="relative">
              <select
                value={config.isru}
                onChange={(e) => handleSelectChange('isru', e.target.value)}
                className="custom-select pr-8 text-[11px]"
              >
                <option value="Use ISRU (Yes)">Use ISRU (Yes)</option>
                <option value="Partial ISRU">Partial ISRU</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* LOCATION STRATEGY */}
          <div className="pt-2 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              LOCATION STRATEGY
            </span>
            <div className="space-y-2">
              <div
                onClick={() => handleSelectChange('locationStrategy', 'find_best')}
                className={`radio-option ${config.locationStrategy === 'find_best' ? 'selected' : ''}`}
              >
                <div className="radio-dot">
                  {config.locationStrategy === 'find_best' && <div className="radio-dot-inner" />}
                </div>
                <span>Find the best location</span>
              </div>

              <div
                onClick={() => handleSelectChange('locationStrategy', 'evaluate_specific')}
                className={`radio-option ${config.locationStrategy === 'evaluate_specific' ? 'selected' : ''}`}
              >
                <div className="radio-dot">
                  {config.locationStrategy === 'evaluate_specific' && <div className="radio-dot-inner" />}
                </div>
                <span>Evaluate specific location</span>
              </div>
            </div>

            {/* Specific sites list */}
            {config.locationStrategy === 'evaluate_specific' && (
              <div className="mt-2.5 p-3 rounded bg-[#090e18] border border-[#1e293b] space-y-2">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Target Specific Sites:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableSpecificSites.map((siteName) => {
                    const isChecked = (config.selectedSpecificSites || []).includes(siteName);
                    return (
                      <div
                        key={siteName}
                        onClick={() => handleSiteToggle(siteName)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors text-[11px] ${
                          isChecked
                            ? 'bg-blue-900/30 text-slate-100 font-medium border border-blue-600/50'
                            : 'text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        <span>{siteName}</span>
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ADVANCED SETTINGS Section */}
          <div className="pt-2 border-t border-[#1e293b] space-y-3">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-white uppercase tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>ADVANCED SETTINGS</span>
              </div>
              {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isAdvancedOpen && (
              <div className="p-3 rounded bg-[#090e18] border border-[#1e293b] space-y-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Factor Weights:
                </span>

                {/* 1. Terrain flatness weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Terrain Flatness Weight</span>
                    <span className="font-semibold text-blue-400">
                      {config.weights?.flatness ?? 25}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.flatness ?? 25}
                    onChange={(e) => handleWeightChange('flatness', e.target.value)}
                  />
                </div>

                {/* 2. Sunlight weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Sunlight Weight</span>
                    <span className="font-semibold text-blue-400">
                      {config.weights?.sunlight ?? 25}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.sunlight ?? 25}
                    onChange={(e) => handleWeightChange('sunlight', e.target.value)}
                  />
                </div>

                {/* 3. Water-ice weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Water-Ice Weight</span>
                    <span className="font-semibold text-blue-400">
                      {config.weights?.waterIce ?? 30}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.waterIce ?? 30}
                    onChange={(e) => handleWeightChange('waterIce', e.target.value)}
                  />
                </div>

                {/* 4. Radiation weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Radiation Weight</span>
                    <span className="font-semibold text-blue-400">
                      {config.weights?.radiation ?? 20}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.radiation ?? 20}
                    onChange={(e) => handleWeightChange('radiation', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS Button - Solid Style */}
      <div className="pt-4 border-t border-[#1e293b] space-y-2 mt-4">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          QUICK ACTIONS
        </span>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`btn-primary w-full py-2.5 text-[11px] font-bold tracking-wider ${
            isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>ANALYZING SITES...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>ANALYZE & FIND SITES</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
