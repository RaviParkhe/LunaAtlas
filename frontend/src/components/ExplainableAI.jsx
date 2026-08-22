import React, { useState, useEffect } from 'react';
import { Layers, Sun, Droplets, Shield, TrendingUp, Anchor, Cpu, Info, Sparkles, RefreshCw } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8050'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8050');

export default function ExplainableAI({ site }) {
  const [briefingData, setBriefingData] = useState({
    text: site?.mission_briefing || '',
    isLLM: false,
    model: 'Physics-Rule-Engine',
    isLoading: false
  });

  const siteName = site?.name;

  // Fetch live Google Gemini LLM briefing from backend API
  const fetchGeminiBriefing = async (name) => {
    if (!name) return;
    setBriefingData((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch(`${API_BASE}/api/xai/briefing/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setBriefingData({
          text: data.briefing || site?.mission_briefing || '',
          isLLM: Boolean(data.is_llm_generated),
          model: data.model || 'Physics-Rule-Engine',
          isLoading: false
        });
      } else {
        setBriefingData({
          text: site?.mission_briefing || '',
          isLLM: false,
          model: 'Physics-Rule-Engine',
          isLoading: false
        });
      }
    } catch (err) {
      setBriefingData({
        text: site?.mission_briefing || '',
        isLLM: false,
        model: 'Physics-Rule-Engine',
        isLoading: false
      });
    }
  };

  useEffect(() => {
    if (siteName) {
      fetchGeminiBriefing(siteName);
    }
  }, [siteName]);

  const raw = site?.raw_metrics || {};
  const iceConf = site?.ice_confidence || { confidence_pct: 37, label: 'Moderate Volatile Signatures' };

  const metrics = [
    {
      label: 'Landing Safety',
      value: Math.round(raw.landing_suitability_score ?? 89),
      status: (raw.landing_suitability_score ?? 89) >= 70 ? 'Optimal Flatness' : 'Slope Alert',
      icon: Layers
    },
    {
      label: 'Sunlight',
      value: Math.round(raw.sunlight_score ?? 42),
      status: (raw.sunlight_score ?? 42) >= 40 ? 'High Solar Power' : 'Moderate Sun',
      icon: Sun
    },
    {
      label: 'Water Ice',
      value: Math.round(raw.water_ice_score ?? 22),
      status: `${iceConf.confidence_pct}% Confidence`,
      icon: Droplets
    },
    {
      label: 'Radiation Shield',
      value: Math.round(raw.radiation_safety_score ?? 57),
      status: (raw.radiation_safety_score ?? 57) >= 50 ? 'Shielded Rim' : 'Exposed Plain',
      icon: Shield
    },
    {
      label: 'Touchdown Zone',
      value: Math.round(raw.best_nearby_landing_score ?? 90),
      status: 'Optimal Pad Zone',
      icon: Anchor
    },
    {
      label: 'Low Dust Risk',
      value: Math.round(100 - (raw.dust_risk_score ?? 48)),
      status: 'Controlled',
      icon: TrendingUp
    }
  ];

  return (
    <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#0066cc]" />
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            Explainable AI – Factor Breakdown ({site?.name || 'Selected Site'})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* LLM / Engine Source Badge */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
            briefingData.isLLM
              ? 'bg-blue-500/10 text-[#0066cc] border-blue-500/20 font-semibold'
              : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] border-[var(--border-color)]'
          }`}>
            <Sparkles className={`w-3 h-3 ${briefingData.isLLM ? 'text-[#0066cc]' : 'text-[var(--text-muted)]'}`} />
            <span>{briefingData.isLLM ? `Google Gemini (${briefingData.model})` : 'Physics-Rule Engine'}</span>
          </span>

          {site?.unique_id && (
            <span className="text-xs font-mono font-medium text-[#0066cc] bg-[var(--apple-parchment)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full">
              {site.unique_id}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Physics & Gemini Mission Briefing Banner */}
      <div className="p-4 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-start justify-between gap-3 transition-all">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#0066cc] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[#0066cc] uppercase tracking-wider block">
                Mission Intelligence Briefing
              </span>
              {briefingData.isLoading && (
                <span className="text-[10px] text-[var(--text-muted)] italic animate-pulse">
                  Querying Gemini LLM...
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {briefingData.text || site?.mission_briefing || 'Loading mission telemetry and planetary briefing...'}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchGeminiBriefing(siteName)}
          disabled={briefingData.isLoading}
          className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#0066cc] transition-colors cursor-pointer flex-shrink-0"
          title="Regenerate Gemini Explanation"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${briefingData.isLoading ? 'animate-spin text-[#0066cc]' : ''}`} />
        </button>
      </div>

      {/* 6 Core Factor Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-[var(--apple-parchment)] rounded-[14px] p-3.5 border border-[var(--border-color)] flex flex-col justify-between hover:border-[var(--border-active)] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-[#0066cc]" />
                </div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {m.value}%
                </span>
              </div>

              <div className="text-xs font-medium text-[var(--text-secondary)] truncate my-1.5" title={m.label}>
                {m.label}
              </div>

              <div className="w-full h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full rounded-full bg-[#0066cc]"
                  style={{ width: `${Math.min(100, Math.max(5, m.value))}%` }}
                />
              </div>

              <div className="text-center">
                <span className="inline-block w-full py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate px-1">
                  {m.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
