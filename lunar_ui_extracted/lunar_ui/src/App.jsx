import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MissionConfiguration from './components/MissionConfiguration';
import MoonExplorer from './components/MoonExplorer';
import AIRecommendationSummary from './components/AIRecommendationSummary';
import ExplainableAI from './components/ExplainableAI';
import RiskAndRecommendation from './components/RiskAndRecommendation';
import CandidatePointsTable from './components/CandidatePointsTable';
import ChartsPanel from './components/ChartsPanel';
import DatasetManager from './components/DatasetManager';
import { MERGED_NAMED_SITES } from './data/lunarDataLoader';

export default function App() {
  // Navigation tab state (dashboard / dataset)
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Left sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Analyzing trigger state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mission Configuration State
  const [missionConfig, setMissionConfig] = useState({
    objective: 'Long-Term Human Habitat',
    duration: 'Permanent',
    crewSize: '11-20',
    powerStrategy: 'Solar',
    isru: 'Use ISRU (Yes)',
    locationStrategy: 'find_best',
    selectedSpecificSites: ['Shackleton Crater Rim', 'de Gerlache Rim'],
    weights: {
      flatness: 25,
      sunlight: 25,
      waterIce: 30,
      radiation: 20
    }
  });

  // Candidate sites list from merged datasets
  const [sites, setSites] = useState(MERGED_NAMED_SITES);

  // Active selected site
  const [selectedSite, setSelectedSite] = useState(MERGED_NAMED_SITES[0]);

  // Simulate AI Re-Analysis
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#070b16]">
      {/* Top Header Bar */}
      <Header onRunAnalysis={handleRunAnalysis} isAnalyzing={isAnalyzing} />

      {/* Body Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Center Main View Area */}
        {activeTab === 'dashboard' ? (
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Row: Moon Explorer Heatmap Canvas + AI Recommendation Summary */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-6">
                <MoonExplorer
                  sites={sites}
                  selectedSite={selectedSite}
                  onSelectSite={setSelectedSite}
                />
              </div>
              <div className="col-span-6">
                <AIRecommendationSummary site={selectedSite} />
              </div>
            </div>

            {/* Middle Row: Explainable AI Metrics */}
            <div>
              <ExplainableAI site={selectedSite} />
            </div>

            {/* Bottom Section: Risk Assessment + 6 Sites Sortable Table + Spider Charts */}
            <div className="flex gap-6">
              <div className="flex-1 space-y-6">
                <RiskAndRecommendation site={selectedSite} />
                <CandidatePointsTable />
              </div>

              {/* Spider/Radar + Histogram Charts Panel */}
              <ChartsPanel site={selectedSite} />
            </div>
          </main>
        ) : (
          <DatasetManager />
        )}

        {/* Right Fixed Mission Configuration Panel */}
        <MissionConfiguration
          config={missionConfig}
          setConfig={setMissionConfig}
          onAnalyze={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </div>
  );
}
