import React, { useState } from 'react';
import { Sliders, Clock, Users, Zap, Pickaxe, Target, Search, Loader2, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MissionConfiguration({
  config,
  setConfig,
  onAnalyze,
  isAnalyzing,
  isCollapsed: externalIsCollapsed,
  setIsCollapsed: externalSetIsCollapsed
}) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = externalSetIsCollapsed !== undefined ? externalSetIsCollapsed : setInternalIsCollapsed;

  const [priorityMode, setPriorityMode] = useState(config?.priorityMode || 'default');

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

  const handlePriorityModeChange = (mode) => {
    setPriorityMode(mode);
    setConfig(prev => ({ ...prev, priorityMode: mode }));
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

  const handleResourceToggle = (resourceName) => {
    setConfig(prev => {
      const currentResources = prev.isruResources || ['Water Ice'];
      const updated = currentResources.includes(resourceName)
        ? currentResources.filter(r => r !== resourceName)
        : [...currentResources, resourceName];
      return { ...prev, isruResources: updated };
    });
  };

  const handleWeightChange = (weightKey, val) => {
    const parsed = parseInt(val, 10);
    const newWeights = {
      ...(config.weights || { flatness: 25, sunlight: 25, waterIce: 30, radiation: 20 }),
      [weightKey]: parsed
    };
    setConfig(prev => ({ ...prev, weights: newWeights }));
  };

  const handleAnalyzeClick = () => {
    setIsCollapsed(true); // Automatically collapse section upon analysis
    onAnalyze && onAnalyze();
  };

  const isruResourcesList = config.isruResources || ['Water Ice'];
  const activeLocationStrategy = config?.locationStrategy || 'find_best';

  if (isCollapsed) {
    return (
      <aside className="w-14 min-w-[56px] border-l border-[var(--border-color)] py-4 px-2 flex flex-col items-center justify-between z-10 select-none bg-[var(--bg-card)] transition-all duration-300">
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-full bg-[var(--apple-parchment)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
            title="Expand Mission Configuration"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCollapsed(false)}
            className="flex flex-col items-center gap-3 cursor-pointer group"
            title="Expand Mission Configuration"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] group-hover:bg-[#0066cc] group-hover:text-white transition-colors">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none">
              CONFIGURATION
            </span>
          </button>
        </div>

        <button
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className="w-9 h-9 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-95"
          title="Run Analysis"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 min-w-[320px] border-l border-[var(--border-color)] p-4 flex flex-col justify-between overflow-y-auto z-10 select-none bg-[var(--bg-card)] transition-all duration-300">
      <div className="space-y-4">
        {/* Header with Collapse Button */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0066cc]" />
            <h2 className="text-xs font-semibold tracking-tight text-[var(--text-primary)] uppercase">
              Mission Configuration
            </h2>
          </div>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-md bg-[var(--apple-parchment)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer active:scale-95"
            title="Collapse Mission Configuration"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. MISSION PRIORITY MODE */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Priority Mode</span>
          </div>

          <div className="space-y-2.5 p-3 rounded-2xl bg-[var(--apple-parchment)] border border-[var(--border-color)]">
            {/* Default Mode */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="priorityMode"
                checked={priorityMode === 'default'}
                onChange={() => handlePriorityModeChange('default')}
                className="mt-0.5 accent-[#0066cc] cursor-pointer"
              />
              <div>
                <span className="text-xs font-medium text-[var(--text-primary)] block">Predefined Objectives</span>
                <span className="text-[11px] text-[var(--text-secondary)] block">Optimized weights by mission profile</span>
              </div>
            </label>

            {priorityMode === 'default' && (
              <div className="ml-6 pt-2 border-t border-[var(--border-color)] space-y-1.5">
                {[
                  { id: 'Long-Term Habitat', label: 'Long-Term Habitat' },
                  { id: 'Scientific Research', label: 'Scientific Research' },
                  { id: 'Resource Extraction', label: 'Resource Extraction' },
                  { id: 'Solar Energy / Power', label: 'Solar Energy / Power' },
                  { id: 'Emergency / Temporary Base', label: 'Emergency / Temporary Base' },
                ].map((obj) => (
                  <label key={obj.id} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                    <input
                      type="radio"
                      name="missionObjective"
                      checked={config.objective === obj.id}
                      onChange={() => handleSelectChange('objective', obj.id)}
                      className="accent-[#0066cc] cursor-pointer"
                    />
                    <span>{obj.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Custom Mode */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-[var(--border-color)]">
              <input
                type="radio"
                name="priorityMode"
                checked={priorityMode === 'custom'}
                onChange={() => handlePriorityModeChange('custom')}
                className="mt-0.5 accent-[#0066cc] cursor-pointer"
              />
              <div>
                <span className="text-xs font-medium text-[var(--text-primary)] block">Custom Weights</span>
                <span className="text-[11px] text-[var(--text-secondary)] block">Manually adjust priority sliders</span>
              </div>
            </label>

            {priorityMode === 'custom' && (
              <div className="ml-6 pt-2 border-t border-[var(--border-color)] space-y-2.5">
                {/* Terrain */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-primary)] font-medium">
                    <span>Terrain Flatness</span>
                    <span className="text-[#0066cc] font-mono">{config.weights?.flatness ?? 25}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.flatness ?? 25}
                    onChange={(e) => handleWeightChange('flatness', e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Sunlight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-primary)] font-medium">
                    <span>Sunlight Illumination</span>
                    <span className="text-[#0066cc] font-mono">{config.weights?.sunlight ?? 25}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.sunlight ?? 25}
                    onChange={(e) => handleWeightChange('sunlight', e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Water Ice */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-primary)] font-medium">
                    <span>Water Ice Confidence</span>
                    <span className="text-[#0066cc] font-mono">{config.weights?.waterIce ?? 30}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.waterIce ?? 30}
                    onChange={(e) => handleWeightChange('waterIce', e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Radiation Safety */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-primary)] font-medium">
                    <span>Radiation Shielding</span>
                    <span className="text-[#0066cc] font-mono">{config.weights?.radiation ?? 20}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.weights?.radiation ?? 20}
                    onChange={(e) => handleWeightChange('radiation', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. MISSION DURATION */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Mission Duration</span>
          </label>
          <div className="relative">
            <select
              value={config.duration}
              onChange={(e) => handleSelectChange('duration', e.target.value)}
              className="apple-select"
            >
              <option value="Permanent">Permanent Habitat</option>
              <option value="1-3 Years">Short-Term (1-3 Years)</option>
              <option value="3-5 Years">Medium-Term (3-5 Years)</option>
              <option value="5-10 Years">Long-Term (5-10 Years)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 3. CREW SIZE */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Crew Size</span>
          </label>
          <div className="relative">
            <select
              value={config.crewSize}
              onChange={(e) => handleSelectChange('crewSize', e.target.value)}
              className="apple-select"
            >
              <option value="11-20">11-20 Astronauts</option>
              <option value="1-5">1-5 Astronauts</option>
              <option value="6-10">6-10 Astronauts</option>
              <option value="21-50">21-50 Astronauts</option>
              <option value="50+">50+ Astronauts</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 4. POWER STRATEGY */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Power Strategy</span>
          </label>
          <div className="relative">
            <select
              value={config.powerStrategy}
              onChange={(e) => handleSelectChange('powerStrategy', e.target.value)}
              className="apple-select"
            >
              <option value="Solar">Solar Arrays</option>
              <option value="Nuclear">Nuclear Fission Surface Power</option>
              <option value="Hybrid (Solar + Nuclear)">Hybrid (Solar + Nuclear)</option>
              <option value="Fuel Cell">Regenerative Fuel Cell</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 5. LOCAL RESOURCE USAGE (ISRU) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            <Pickaxe className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Resource Usage (ISRU)</span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2.5">
            <div className="flex items-center gap-5 text-xs text-[var(--text-primary)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isruEnable"
                  checked={config.isru !== 'No'}
                  onChange={() => handleSelectChange('isru', 'Use ISRU (Yes)')}
                  className="accent-[#0066cc] cursor-pointer"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isruEnable"
                  checked={config.isru === 'No'}
                  onChange={() => handleSelectChange('isru', 'No')}
                  className="accent-[#0066cc] cursor-pointer"
                />
                <span>No</span>
              </label>
            </div>

            {config.isru !== 'No' && (
              <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
                {[
                  'Water Ice',
                  'Lunar Regolith',
                  'Oxygen from Regolith',
                  'Mineral Resources'
                ].map((res) => {
                  const isChecked = isruResourcesList.includes(res);
                  return (
                    <label key={res} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleResourceToggle(res)}
                        className="accent-[#0066cc] cursor-pointer rounded"
                      />
                      <span>{res}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 6. LOCATION STRATEGY */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Location Strategy</span>
          </div>

          <div className="space-y-2">
            <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
              activeLocationStrategy === 'find_best'
                ? 'bg-[var(--apple-parchment)] border-[#0066cc] text-[var(--text-primary)] font-medium shadow-sm'
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-active)]'
            }`}>
              <input
                type="radio"
                name="locationStrat"
                checked={activeLocationStrategy === 'find_best'}
                onChange={() => handleSelectChange('locationStrategy', 'find_best')}
                className="accent-[#0066cc] cursor-pointer"
              />
              <span>Find the best location (Global Grid)</span>
            </label>

            <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
              activeLocationStrategy === 'evaluate_specific'
                ? 'bg-[var(--apple-parchment)] border-[#0066cc] text-[var(--text-primary)] font-medium shadow-sm'
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-active)]'
            }`}>
              <input
                type="radio"
                name="locationStrat"
                checked={activeLocationStrategy === 'evaluate_specific'}
                onChange={() => handleSelectChange('locationStrategy', 'evaluate_specific')}
                className="accent-[#0066cc] cursor-pointer"
              />
              <span>Evaluate specific candidate site</span>
            </label>
          </div>

          {activeLocationStrategy === 'evaluate_specific' && (
            <div className="mt-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {availableSpecificSites.map((siteName) => {
                const isChecked = (config.selectedSpecificSites || []).includes(siteName);
                return (
                  <div
                    key={siteName}
                    onClick={() => handleSiteToggle(siteName)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[var(--apple-parchment)] border-[#0066cc] text-[var(--text-primary)] font-medium'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--apple-parchment)]'
                    }`}
                  >
                    <span>{siteName}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-[#0066cc]" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Apple Primary Action Blue Pill CTA */}
      <div className="pt-3 border-t border-[var(--border-color)] mt-4">
        <button
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className={`apple-btn-primary w-full py-2.5 text-xs font-medium ${
            isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Computing Solution...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Analyze & Find Sites</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
