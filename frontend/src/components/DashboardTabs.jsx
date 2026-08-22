import React, { useState } from 'react';
import { Map, Brain, Trophy } from 'lucide-react';
import MoonExplorer from './MoonExplorer';
import AIRecommendationSummary from './AIRecommendationSummary';
import ExplainableAI from './ExplainableAI';
import CandidatePointsTable from './CandidatePointsTable';

const TABS = [
  { id: 'map',     label: 'Map & Summary',  icon: Map },
  { id: 'xai',     label: 'Explainable AI', icon: Brain },
  { id: 'ranking', label: 'Site Ranking',   icon: Trophy },
];

export default function DashboardTabs({
  activeTabObj,
  selectedSite,
  sites,
  onSelectSite,
  gridHeatmap,
  activeLayerId,
  onSelectLayer,
}) {
  const [activePanel, setActivePanel] = useState('map');

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{ background: 'var(--bg-dark)' }}
    >
      {/* ── Tab Bar ── */}
      <div
        className="flex items-center gap-1 px-4 pt-3 pb-0 shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-xl transition-all cursor-pointer shrink-0"
              style={{
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--apple-primary)' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                borderBottom: isActive ? '1px solid var(--bg-card)' : '1px solid transparent',
                marginBottom: isActive ? '-1px' : '0',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ── */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-card)' }}>

        {/* ── TAB 1: Map & Summary (Full Height Clean Side-by-Side) ── */}
        {activePanel === 'map' && (
          <div className="h-full grid grid-cols-12 gap-4 p-4 overflow-hidden">
            {/* LEFT: 2D Polar Map */}
            <div className="col-span-12 xl:col-span-7 h-full min-h-0 flex flex-col">
              <MoonExplorer
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={onSelectSite}
                gridHeatmap={gridHeatmap}
                activeLayerId={activeLayerId}
                onSelectLayer={onSelectLayer}
              />
            </div>

            {/* RIGHT: AI Recommendation Summary */}
            <div className="col-span-12 xl:col-span-5 h-full min-h-0 flex flex-col overflow-hidden">
              <AIRecommendationSummary site={selectedSite} />
            </div>
          </div>
        )}

        {/* ── TAB 2: Explainable AI ── */}
        {activePanel === 'xai' && (
          <div className="h-full p-4 overflow-hidden flex flex-col">
            <ExplainableAI site={selectedSite} />
          </div>
        )}

        {/* ── TAB 3: Site Ranking ── */}
        {activePanel === 'ranking' && (
          <div className="h-full p-4 overflow-hidden flex flex-col">
            <CandidatePointsTable
              sites={sites}
              selectedSite={selectedSite}
              onSelectSite={onSelectSite}
            />
          </div>
        )}

      </div>
    </div>
  );
}
