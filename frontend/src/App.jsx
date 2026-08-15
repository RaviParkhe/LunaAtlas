import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MissionAnalysisView from './components/MissionAnalysisView';
import TerrainAnalysisView from './components/TerrainAnalysisView';
import MissionConfigSidebar from './components/MissionConfigSidebar';
import NaturalLanguageModal from './components/NaturalLanguageModal';
import WhatIfModal from './components/WhatIfModal';
import DossierModal from './components/DossierModal';

const API_BASE = 'http://127.0.0.1:8000';

const DEFAULT_WEIGHTS = {
  sunlight: 0.30,
  landing_safety: 0.25,
  water_ice: 0.25,
  radiation_safety: 0.15,
  dust_penalty: 0.05
};

export default function App() {
  const [currentView, setCurrentView] = useState('mission'); // 'mission' or 'terrain'
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [activeProfile, setActiveProfile] = useState('balanced');
  const [applyFlatnessGate, setApplyFlatnessGate] = useState(true);

  const [rankedSites, setRankedSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [gridHeatmap, setGridHeatmap] = useState(null);
  const [activeLayer, setActiveLayer] = useState('overall_score');
  const [solarData, setSolarData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isNLPModalOpen, setIsNLPModalOpen] = useState(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  // 1. Fetch live NOAA Solar Data
  const fetchSolarData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/monitor/solar`);
      if (res.ok) {
        const data = await res.json();
        setSolarData(data);
      }
    } catch (e) {
      console.warn('Backend offline or unreachable, using fallback solar telemetry');
    }
  };

  // 2. Evaluate Sites via FastAPI Backend
  const runEvaluation = async (customWeights = weights, profile = activeProfile, gate = applyFlatnessGate) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profile,
          custom_weights: customWeights,
          apply_flatness_gate: gate
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRankedSites(data.ranked_named_sites || []);
        if (!selectedSite && data.ranked_named_sites?.length > 0) {
          setSelectedSite(data.ranked_named_sites[0]);
        } else if (selectedSite && data.ranked_named_sites?.length > 0) {
          // Keep updated scores for currently selected site
          const updated = data.ranked_named_sites.find((s) => s.name === selectedSite.name);
          if (updated) setSelectedSite(updated);
        }
      }
    } catch (e) {
      console.warn('Backend offline, using local scoring fallback');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fetch Grid Heatmap Matrix
  const fetchHeatmap = async (layer = activeLayer, customWeights = weights) => {
    try {
      const res = await fetch(`${API_BASE}/api/grid/heatmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer: layer,
          custom_weights: customWeights,
          downsample_factor: 2
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGridHeatmap(data);
      }
    } catch (e) {
      console.warn('Failed to fetch heatmap array');
    }
  };

  // Initial load
  useEffect(() => {
    fetchSolarData();
    runEvaluation(DEFAULT_WEIGHTS, 'balanced', true);
    fetchHeatmap('overall_score', DEFAULT_WEIGHTS);

    const timer = setInterval(fetchSolarData, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handler for weight changes
  const handleWeightChange = (key, val) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    setActiveProfile('custom');
    runEvaluation(updated, 'custom', applyFlatnessGate);
    if (activeLayer === 'overall_score') {
      fetchHeatmap('overall_score', updated);
    }
  };

  // Handler for profile presets
  const handleSelectProfile = (pId) => {
    setActiveProfile(pId);
    let newWeights = DEFAULT_WEIGHTS;
    if (pId === 'power_first') {
      newWeights = { sunlight: 0.50, landing_safety: 0.25, water_ice: 0.10, radiation_safety: 0.10, dust_penalty: 0.05 };
    } else if (pId === 'isru_mining') {
      newWeights = { sunlight: 0.15, landing_safety: 0.25, water_ice: 0.45, radiation_safety: 0.10, dust_penalty: 0.05 };
    } else if (pId === 'max_safety') {
      newWeights = { sunlight: 0.15, landing_safety: 0.45, water_ice: 0.10, radiation_safety: 0.25, dust_penalty: 0.05 };
    }
    setWeights(newWeights);
    runEvaluation(newWeights, pId, applyFlatnessGate);
    if (activeLayer === 'overall_score') {
      fetchHeatmap('overall_score', newWeights);
    }
  };

  // Handler for layer switch
  const handleChangeLayer = (layerId) => {
    setActiveLayer(layerId);
    fetchHeatmap(layerId, weights);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        solarData={solarData}
        onOpenNLPModal={() => setIsNLPModalOpen(true)}
        onOpenWhatIfModal={() => setIsWhatIfModalOpen(true)}
        onOpenDossierModal={() => setIsDossierModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Workstation View Area */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'mission' ? (
            <MissionAnalysisView
              rankedSites={rankedSites}
              selectedSite={selectedSite}
              onSelectSite={(s) => setSelectedSite(s)}
              gridHeatmap={gridHeatmap}
              activeLayer={activeLayer}
              onChangeLayer={handleChangeLayer}
            />
          ) : (
            <TerrainAnalysisView
              selectedSite={selectedSite}
              rankedSites={rankedSites}
              gridHeatmap={gridHeatmap}
              onSelectSite={(s) => setSelectedSite(s)}
            />
          )}
        </main>

        {/* Right Mission Configuration Sidebar */}
        <MissionConfigSidebar
          weights={weights}
          onWeightChange={handleWeightChange}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          applyFlatnessGate={applyFlatnessGate}
          onToggleFlatnessGate={() => {
            const next = !applyFlatnessGate;
            setApplyFlatnessGate(next);
            runEvaluation(weights, activeProfile, next);
          }}
          onResetWeights={() => handleSelectProfile('balanced')}
        />
      </div>

      {/* Modals */}
      <NaturalLanguageModal
        isOpen={isNLPModalOpen}
        onClose={() => setIsNLPModalOpen(false)}
        onApplyParsedWeights={(parsed) => {
          setWeights(parsed);
          setActiveProfile('custom');
          runEvaluation(parsed, 'custom', applyFlatnessGate);
          fetchHeatmap('overall_score', parsed);
        }}
      />

      <WhatIfModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        onApplyScenario={(scenarioId) => handleSelectProfile(scenarioId)}
      />

      <DossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        site={selectedSite}
        weights={weights}
        solarData={solarData}
      />
    </div>
  );
}
