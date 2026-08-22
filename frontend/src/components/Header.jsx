import React from 'react';
import { Rocket, Play, Loader2, Sun, Moon } from 'lucide-react';

export default function Header({ onRunAnalysis, isAnalyzing, theme = 'dark', onToggleTheme }) {
  return (
    <header className="w-full border-b border-[var(--border-color)] px-6 py-2 flex items-center justify-between z-20 sticky top-0 bg-[var(--bg-card)]/90 backdrop-blur-md select-none transition-colors duration-200 h-[52px]">
      {/* Brand Logo & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] transition-colors shadow-sm">
          <Rocket className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            LunaAstra
          </h1>
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[var(--apple-parchment)] text-[var(--text-secondary)] border border-[var(--border-color)]">
            v2.5 AI
          </span>
          <span className="hidden md:inline text-xs text-[var(--text-secondary)] pl-2 border-l border-[var(--border-color)]">
            Lunar South Pole Decision Support Workstation
          </span>
        </div>
      </div>

      {/* Top Right Controls: Theme Segmented Pill + Action Blue Primary Pill */}
      <div className="flex items-center gap-3">
        {/* Apple Segmented Theme Switcher [ ☀️ Light | 🌙 Dark ] */}
        <div className="flex items-center p-0.5 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] shadow-sm">
          <button
            onClick={() => theme !== 'light' && onToggleTheme()}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Switch to Light Theme"
          >
            <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-[var(--text-muted)]'}`} />
            <span>Light</span>
          </button>

          <button
            onClick={() => theme !== 'dark' && onToggleTheme()}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#272729] text-white shadow-sm font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Switch to Dark Theme"
          >
            <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-blue-400' : 'text-[var(--text-muted)]'}`} />
            <span>Dark</span>
          </button>
        </div>

        {/* Apple Primary Action Blue Pill CTA */}
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`apple-btn-primary ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Run AI Analysis</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
