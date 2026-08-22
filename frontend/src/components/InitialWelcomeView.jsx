import React from 'react';
import { Rocket, Sliders, Search, Compass } from 'lucide-react';

export default function InitialWelcomeView({ onStartAnalysis }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-dark)] relative select-none overflow-y-auto">
      <div className="max-w-2xl text-center space-y-8 relative z-10">
        {/* Animated Rocket Badge (Apple Capsule) */}
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <Rocket className="w-10 h-10 text-[#0066cc]" />
        </div>

        {/* Hero Title & Editorial Subtitle */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-center gap-2.5">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
              LunaAstra
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--apple-parchment)] text-[var(--text-secondary)] border border-[var(--border-color)]">
              v2.5 AI
            </span>
          </div>
          <p className="text-base text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
            AI-Powered Lunar South Pole Habitat & Landing Site Decision Support System
          </p>
        </div>

        {/* Feature Cards Grid (Apple 18px Utility Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
          <div className="p-5 rounded-[18px] bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 transition-all">
            <div className="p-2 w-fit rounded-lg bg-[var(--apple-parchment)] text-[#0066cc]">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">1. Configure Mission</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Select objectives, duration, crew size, and heuristic weights in the right panel.</p>
          </div>

          <div className="p-5 rounded-[18px] bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 transition-all">
            <div className="p-2 w-fit rounded-lg bg-[var(--apple-parchment)] text-[#0066cc]">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">2. Run AI Analysis</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Evaluate 160,000 polar grid cells (80°S - 90°S) in real time via Python NumPy.</p>
          </div>

          <div className="p-5 rounded-[18px] bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 transition-all">
            <div className="p-2 w-fit rounded-lg bg-[var(--apple-parchment)] text-[#0066cc]">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">3. Explore Output</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Inspect 2D heatmaps, 3D globes, suitability scores, and candidate rankings.</p>
          </div>
        </div>

        {/* Apple Primary Action Blue Pill CTA */}
        <div className="pt-2">
          <button
            onClick={onStartAnalysis}
            className="apple-btn-primary px-7 py-3 text-sm font-medium shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Analyze & Find Sites</span>
          </button>
        </div>
      </div>
    </div>
  );
}
