import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MissionConfiguration from './components/MissionConfiguration';
import MoonExplorer from './components/MoonExplorer';
import MoonViewer3D from './components/MoonViewer3D';
import NasaMoonTrekView from './components/NasaMoonTrekView';
import AIRecommendationSummary from './components/AIRecommendationSummary';
import ExplainableAI from './components/ExplainableAI';
import RiskAndRecommendation from './components/RiskAndRecommendation';
import CandidatePointsTable from './components/CandidatePointsTable';
import ChartsPanel from './components/ChartsPanel';
import DatasetManager from './components/DatasetManager';
import AnimatedLoader from './components/AnimatedLoader';
import InitialWelcomeView from './components/InitialWelcomeView';
import { Rocket, Plus, X } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8050'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8050');

const DEFAULT_WEIGHTS = {
  flatness: 25,
  sunlight: 25,
  waterIce: 30,
  radiation: 20
};

const PRESET_OBJECTIVE_WEIGHTS = {
  'Long-Term Habitat': { flatness: 25, sunlight: 25, waterIce: 30, radiation: 20 },
  'Scientific Research': { flatness: 30, sunlight: 30, waterIce: 20, radiation: 20 },
  'Resource Extraction': { flatness: 20, sunlight: 15, waterIce: 50, radiation: 15 },
  'Solar Energy / Power': { flatness: 20, sunlight: 55, waterIce: 10, radiation: 15 },
  'Emergency / Temporary Base': { flatness: 50, sunlight: 20, waterIce: 10, radiation: 20 }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'globe' | 'moontrek' | 'dataset'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Theme Management (Dark / Light with localStorage persistence)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lunaastra_theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    try {
      localStorage.setItem('lunaastra_theme', theme);
    } catch (e) {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Mission configuration state (local state cached, only evaluated on click)
  const [missionConfig, setMissionConfig] = useState({
    priorityMode: 'default',
    objective: 'Long-Term Habitat',
    weights: { ...DEFAULT_WEIGHTS },
    duration: 'Permanent',
    crewSize: '11-20',
    powerStrategy: 'Hybrid (Solar + Nuclear)',
    isru: 'Use ISRU (Yes)',
    isruResources: ['Water Ice', 'Lunar Regolith'],
    locationStrategy: 'find_best',
    selectedSpecificSites: ['Shackleton Crater Rim', 'Malapert Massif', 'Faustini Rim']
  });

  // Dynamic Output Tabs management (Chrome-style)
  const [outputTabs, setOutputTabs] = useState([
    {
      id: 'tab-initial-1',
      title: 'Initial Workspace',
      uniqueId: 'New Tab',
      isAnalyzed: false,
      timestamp: Date.now(),
      sites: [],
      selectedSite: null,
      topGridCandidates: [],
      appliedConfig: null
    }
  ]);
  const [activeOutputTabId, setActiveOutputTabId] = useState('tab-initial-1');

  // Inline rename state
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabValue, setEditingTabValue] = useState('');

  // Evaluated sites, heatmap, and telemetry state
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [gridHeatmap, setGridHeatmap] = useState(null);
  const [activeLayerId, setActiveLayerId] = useState('landing_suitability_score');
  const [solarTelemetry, setSolarTelemetry] = useState(null);

  // Active output tab object helper
  const activeTabObj = outputTabs.find((t) => t.id === activeOutputTabId) || outputTabs[0];

  // Fetch initial telemetry and layers
  useEffect(() => {
    fetch(`${API_BASE}/api/monitor/solar`)
      .then((res) => res.json())
      .then((data) => setSolarTelemetry(data))
      .catch(() => {});

    fetchHeatmapLayer(activeLayerId);
  }, []);

  const fetchHeatmapLayer = async (layerId) => {
    try {
      const res = await fetch(`${API_BASE}/api/grid/heatmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layer: layerId, downsample_factor: 2 })
      });
      if (res.ok) {
        const data = await res.json();
        setGridHeatmap(data);
      }
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    }
  };

  const handleLayerChange = (layerId) => {
    setActiveLayerId(layerId);
    fetchHeatmapLayer(layerId);
  };

  // Explicit Analysis Run Trigger (spawn new tab + auto-collapse config)
  const runEvaluation = async (configToRun) => {
    setIsAnalyzing(true);
    setIsConfigCollapsed(true); // Automatically collapse sidebar on analysis!

    try {
      let finalWeights = { ...DEFAULT_WEIGHTS };
      if (configToRun.priorityMode === 'custom' && configToRun.weights) {
        finalWeights = { ...configToRun.weights };
      } else if (configToRun.objective && PRESET_OBJECTIVE_WEIGHTS[configToRun.objective]) {
        finalWeights = { ...PRESET_OBJECTIVE_WEIGHTS[configToRun.objective] };
      }

      const totalWeight = Object.values(finalWeights).reduce((a, b) => a + b, 0) || 100;
      const normalizedWeights = {
        sunlight: (finalWeights.sunlight || 25) / totalWeight,
        landing_safety: (finalWeights.flatness || 25) / totalWeight,
        water_ice: (finalWeights.waterIce || 30) / totalWeight,
        radiation_safety: (finalWeights.radiation || 20) / totalWeight,
        dust_penalty: 0.05
      };

      const res = await fetch(`${API_BASE}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_weights: normalizedWeights,
          apply_flatness_gate: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        let ranked = data.ranked_named_sites || [];

        if (
          configToRun.locationStrategy === 'evaluate_specific' &&
          configToRun.selectedSpecificSites &&
          configToRun.selectedSpecificSites.length > 0
        ) {
          ranked = ranked.filter((s) => configToRun.selectedSpecificSites.includes(s.name));
        }

        const topCandidate = ranked[0] || null;
        const generatedUniqueId = topCandidate?.unique_id || `LUN-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newTabId = `tab-${Date.now()}`;
        const newTabObj = {
          id: newTabId,
          title: topCandidate ? topCandidate.name : 'Analyzed Solution',
          uniqueId: generatedUniqueId,
          isAnalyzed: true,
          timestamp: Date.now(),
          sites: ranked,
          selectedSite: topCandidate,
          topGridCandidates: data.top_grid_candidates || [],
          appliedConfig: { ...configToRun }
        };

        setOutputTabs((prev) => {
          if (prev.length === 1 && !prev[0].isAnalyzed) {
            return [newTabObj];
          }
          return [...prev, newTabObj];
        });

        setActiveOutputTabId(newTabId);
        setSites(ranked);
        setSelectedSite(topCandidate);
        fetchHeatmapLayer(activeLayerId);
      }
    } catch (err) {
      console.error('Evaluation run failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddNewTab = () => {
    const newTabId = `tab-blank-${Date.now()}`;
    const newBlankTab = {
      id: newTabId,
      title: 'New Workspace',
      uniqueId: 'New Tab',
      isAnalyzed: false,
      timestamp: Date.now(),
      sites: [],
      selectedSite: null,
      topGridCandidates: [],
      appliedConfig: null
    };

    setOutputTabs((prev) => [...prev, newBlankTab]);
    setActiveOutputTabId(newTabId);
  };

  const handleSelectTab = (tab) => {
    setActiveOutputTabId(tab.id);
    if (tab.isAnalyzed && tab.sites && tab.sites.length > 0) {
      setSites(tab.sites);
      setSelectedSite(tab.selectedSite || tab.sites[0]);
    }
  };

  const handleCloseTab = (e, tabIdToClose) => {
    e.stopPropagation();
    if (outputTabs.length <= 1) {
      handleAddNewTab();
      setOutputTabs((prev) => prev.filter((t) => t.id !== tabIdToClose));
      return;
    }

    const remaining = outputTabs.filter((t) => t.id !== tabIdToClose);
    setOutputTabs(remaining);

    if (activeOutputTabId === tabIdToClose) {
      const nextActive = remaining[remaining.length - 1];
      setActiveOutputTabId(nextActive.id);
      if (nextActive.isAnalyzed) {
        setSites(nextActive.sites);
        setSelectedSite(nextActive.selectedSite);
      }
    }
  };

  const handleStartRename = (e, tab) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingTabValue(tab.uniqueId);
  };

  const handleSaveRename = (tabId) => {
    if (editingTabValue.trim()) {
      setOutputTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, uniqueId: editingTabValue.trim() } : t))
      );
    }
    setEditingTabId(null);
    setEditingTabValue('');
  };

  const handleKeyDownRename = (e, tabId) => {
    if (e.key === 'Enter') {
      handleSaveRename(tabId);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTabValue('');
    }
  };

  const handleSelectSiteForActiveTab = (site) => {
    setSelectedSite(site);
    setOutputTabs((prev) =>
      prev.map((t) => (t.id === activeOutputTabId ? { ...t, selectedSite: site } : t))
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-hidden font-sans select-none transition-colors duration-200">
      <Header
        onRunAnalysis={() => runEvaluation(missionConfig)}
        isAnalyzing={isAnalyzing}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Animated Pulsing Logo Loading Screen Overlay */}
      {isAnalyzing && (
        <AnimatedLoader
          status="Evaluating Polar Topography & Solar Illumination Matrices..."
          missionObjective={missionConfig.objective}
        />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {activeTab === 'dashboard' ? (
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Apple Style Clean Tab Bar */}
            <div className="bg-[var(--apple-parchment)] border-b border-[var(--border-color)] px-6 pt-2 pb-0 flex items-center gap-2 shrink-0 select-none overflow-x-auto transition-colors duration-200">
              {outputTabs.map((tab) => {
                const isActive = activeOutputTabId === tab.id;
                const isEditing = editingTabId === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => handleSelectTab(tab)}
                    onDoubleClick={(e) => handleStartRename(e, tab)}
                    title="Double-click to rename tab"
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl text-xs cursor-pointer border-t border-x transition-all shrink-0 ${
                      isActive
                        ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[#0066cc] font-medium border-b-transparent shadow-sm'
                        : 'bg-[var(--apple-parchment)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Rocket className={`w-3.5 h-3.5 ${isActive ? 'text-[#0066cc]' : 'text-[var(--text-muted)]'}`} />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTabValue}
                        onChange={(e) => setEditingTabValue(e.target.value)}
                        onBlur={() => handleSaveRename(tab.id)}
                        onKeyDown={(e) => handleKeyDownRename(e, tab.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[var(--bg-input)] border border-[#0066cc] rounded px-1.5 py-0.5 text-xs text-[#0066cc] focus:outline-none w-28"
                      />
                    ) : (
                      <span>{tab.uniqueId}</span>
                    )}

                    <button
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      className="p-0.5 rounded-full hover:bg-[var(--apple-parchment)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1"
                      title="Close Tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={handleAddNewTab}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer shrink-0 mb-0.5"
                title="Create New Workspace Tab"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Content Area: Evaluated View vs Blank Initial State */}
            {activeTabObj && activeTabObj.isAnalyzed ? (
              <div className="p-6 space-y-6 flex-1 bg-[var(--bg-dark)]">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 xl:col-span-6">
                    <MoonExplorer
                      sites={activeTabObj.sites}
                      selectedSite={activeTabObj.selectedSite}
                      onSelectSite={handleSelectSiteForActiveTab}
                      gridHeatmap={gridHeatmap}
                      activeLayerId={activeLayerId}
                      onSelectLayer={handleLayerChange}
                    />
                  </div>

                  <div className="col-span-12 xl:col-span-6 flex flex-col gap-6">
                    <AIRecommendationSummary site={activeTabObj.selectedSite} />
                    <ExplainableAI site={activeTabObj.selectedSite} />
                  </div>
                </div>

                <RiskAndRecommendation site={activeTabObj.selectedSite} />

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-8">
                    <CandidatePointsTable
                      sites={activeTabObj.sites}
                      selectedSite={activeTabObj.selectedSite}
                      onSelectSite={handleSelectSiteForActiveTab}
                    />
                  </div>

                  <ChartsPanel site={activeTabObj.selectedSite} sites={activeTabObj.sites} />
                </div>
              </div>
            ) : (
              <InitialWelcomeView
                onStartAnalysis={() => runEvaluation(missionConfig)}
                missionConfig={missionConfig}
                setMissionConfig={setMissionConfig}
                presetObjectives={PRESET_OBJECTIVE_WEIGHTS}
                defaultWeights={DEFAULT_WEIGHTS}
              />
            )}
          </main>
        ) : activeTab === 'globe' ? (
          <main className="flex-1 relative overflow-hidden bg-[#000000]">
            <MoonViewer3D
              namedSites={activeTabObj?.sites || sites}
              selectedSite={activeTabObj?.selectedSite || selectedSite}
              onSelectSite={handleSelectSiteForActiveTab}
              activeLayer={activeLayerId}
            />
          </main>
        ) : activeTab === 'moontrek' ? (
          <NasaMoonTrekView />
        ) : (
          <DatasetManager />
        )}

        {activeTabObj?.isAnalyzed && (
          <MissionConfiguration
            config={missionConfig}
            setConfig={setMissionConfig}
            onAnalyze={() => runEvaluation(missionConfig)}
            isAnalyzing={isAnalyzing}
            isCollapsed={isConfigCollapsed}
            setIsCollapsed={setIsConfigCollapsed}
          />
        )}
      </div>
    </div>
  );
}
