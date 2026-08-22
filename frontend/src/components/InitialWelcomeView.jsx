import React from 'react';
import { Rocket, Sliders, Search, Shield, Zap, Droplets, Users, Clock, Compass, Activity, ArrowRight } from 'lucide-react';

export default function InitialWelcomeView({
  onStartAnalysis,
  missionConfig,
  setMissionConfig,
  presetObjectives,
  defaultWeights
}) {
  const objectives = [
    { id: 'Long-Term Habitat', label: 'Long-Term Habitat', icon: Shield, desc: 'Balanced structural, solar & radiation safety' },
    { id: 'Solar Energy / Power', label: 'Solar Power Maximization', icon: Zap, desc: 'High continuous sunlight crater peaks' },
    { id: 'Resource Extraction', label: 'ISRU & Water Mining', icon: Droplets, desc: 'Cold trap PSR volatile extraction' },
    { id: 'Scientific Research', label: 'Scientific & Geological Survey', icon: Compass, desc: 'Wide geological feature accessibility' },
    { id: 'Emergency / Temporary Base', label: 'Fast Touchdown Emergency Base', icon: Activity, desc: 'Ultra-flat zero hazard landing zones' },
  ];

  const handleObjectiveSelect = (objId) => {
    const weights = presetObjectives?.[objId] || defaultWeights;
    setMissionConfig({
      ...missionConfig,
      objective: objId,
      priorityMode: 'default',
      weights: { ...weights }
    });
  };

  const handleWeightChange = (key, value) => {
    setMissionConfig({
      ...missionConfig,
      priorityMode: 'custom',
      weights: {
        ...missionConfig.weights,
        [key]: Number(value)
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-[var(--bg-dark)] select-none overflow-y-auto transition-colors duration-200">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            <Rocket className="w-4 h-4 text-[#0066cc]" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">LunaAstra Decision System</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--apple-parchment)] text-[#0066cc]">v2.5 AI</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Mission Input & Site Selection Setup
          </h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-lg mx-auto">
            Specify your Artemis mission objectives and parameters below. Our multi-criteria AI engine will evaluate 160,000 polar grid points in real time.
          </p>
        </div>

        {/* Objective Selection Cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            1. Select Primary Mission Objective
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {objectives.map((obj) => {
              const Icon = obj.icon;
              const isSelected = missionConfig.objective === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => handleObjectiveSelect(obj.id)}
                  className={`p-3.5 rounded-[14px] border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-95 ${
                    isSelected
                      ? 'bg-[var(--apple-parchment)] border-[#0066cc] shadow-sm ring-1 ring-[#0066cc]'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#0066cc] text-white' : 'bg-[var(--apple-parchment)] text-[#0066cc]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#0066cc]"></span>}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">{obj.label}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{obj.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mission Parameters & Weights Configurator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mission Specifications */}
          <div className="p-4 rounded-[16px] bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
              <Sliders className="w-3.5 h-3.5 text-[#0066cc]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                2. Mission Specifications
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--text-secondary)]">Mission Duration</label>
                <select
                  value={missionConfig.duration}
                  onChange={(e) => setMissionConfig({ ...missionConfig, duration: e.target.value })}
                  className="w-full bg-[var(--apple-parchment)] border border-[var(--border-color)] rounded-lg p-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="Permanent">Permanent Base</option>
                  <option value="1-Year">1-Year Expedition</option>
                  <option value="6-Month">6-Month Science Tour</option>
                  <option value="Short-Stay">Short-Stay (30 Days)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--text-secondary)]">Crew Capacity</label>
                <select
                  value={missionConfig.crewSize}
                  onChange={(e) => setMissionConfig({ ...missionConfig, crewSize: e.target.value })}
                  className="w-full bg-[var(--apple-parchment)] border border-[var(--border-color)] rounded-lg p-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="11-20">11 - 20 Astronauts</option>
                  <option value="4-10">4 - 10 Astronauts</option>
                  <option value="20+">20+ Crew Habitat</option>
                </select>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-medium text-[var(--text-secondary)]">Primary Power Strategy</label>
                <select
                  value={missionConfig.powerStrategy}
                  onChange={(e) => setMissionConfig({ ...missionConfig, powerStrategy: e.target.value })}
                  className="w-full bg-[var(--apple-parchment)] border border-[var(--border-color)] rounded-lg p-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="Hybrid (Solar + Nuclear)">Hybrid (Solar Arrays + Surface Fission)</option>
                  <option value="Solar Dominant">Solar PV Arrays + High-Capacity Battery</option>
                  <option value="Nuclear Fission">Kilopower Surface Nuclear Reactor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multi-Criteria Objective Weights */}
          <div className="p-4 rounded-[16px] bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#0066cc]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  3. Heuristic Priority Weights
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {missionConfig.priorityMode === 'custom' ? 'Custom' : 'Preset'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Landing Flatness & Safety</span>
                  <span className="font-mono text-[var(--text-primary)]">{missionConfig.weights.flatness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={missionConfig.weights.flatness}
                  onChange={(e) => handleWeightChange('flatness', e.target.value)}
                  className="w-full accent-[#0066cc] h-1.5 bg-[var(--apple-parchment)] rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Solar Illumination</span>
                  <span className="font-mono text-[var(--text-primary)]">{missionConfig.weights.sunlight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={missionConfig.weights.sunlight}
                  onChange={(e) => handleWeightChange('sunlight', e.target.value)}
                  className="w-full accent-[#0066cc] h-1.5 bg-[var(--apple-parchment)] rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Water Ice Potential</span>
                  <span className="font-mono text-[var(--text-primary)]">{missionConfig.weights.waterIce}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={missionConfig.weights.waterIce}
                  onChange={(e) => handleWeightChange('waterIce', e.target.value)}
                  className="w-full accent-[#0066cc] h-1.5 bg-[var(--apple-parchment)] rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-1">
                  <span className="text-[var(--text-secondary)]">Radiation Horizon Shielding</span>
                  <span className="font-mono text-[var(--text-primary)]">{missionConfig.weights.radiation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={missionConfig.weights.radiation}
                  onChange={(e) => handleWeightChange('radiation', e.target.value)}
                  className="w-full accent-[#0066cc] h-1.5 bg-[var(--apple-parchment)] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onStartAnalysis}
            className="apple-btn-primary px-8 py-3.5 text-sm font-semibold shadow-md flex items-center gap-2.5 active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Analyze & Open Tactical Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
