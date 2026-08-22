import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sun,
  Droplets,
  Shield,
  TrendingUp,
  Anchor,
  Cpu,
  Info,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Loader2,
  AlertOctagon
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8050'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8050');

export default function ExplainableAI({ site }) {
  const [activeXaiTab, setActiveXaiTab] = useState('selection'); // 'selection' | 'risks' | 'counterfactual'
  const [fullReport, setFullReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const siteName = site?.name;

  // Fetch full 3-part structured XAI report directly from live Google Gemini LLM
  const fetchFullXaiReport = async (name) => {
    if (!name) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/xai/full_report/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setFullReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch full XAI report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (siteName) {
      fetchFullXaiReport(siteName);
    }
  }, [siteName]);

  const raw = site?.raw_metrics || {};
  const iceConf = site?.ice_confidence || {};

  const siteExplanation = fullReport?.site_selection_explanation;
  const riskMitigation = fullReport?.risk_mitigation;
  const counterfactual = fullReport?.counterfactual_analysis;

  const isError = siteExplanation?._source === 'ERROR' || riskMitigation?._source === 'ERROR' || counterfactual?._source === 'ERROR';
  const errorMessage = siteExplanation?.error || riskMitigation?.error || counterfactual?.error;
  const errorType = siteExplanation?.error_type || riskMitigation?.error_type || counterfactual?.error_type || 'API_ERROR';

  const metrics = [
    {
      label: 'Landing Safety',
      value: raw.landing_suitability_score != null ? Math.round(raw.landing_suitability_score) : 0,
      status: (raw.landing_suitability_score ?? 0) >= 70 ? 'Optimal Flatness' : 'Slope Alert',
      icon: Layers
    },
    {
      label: 'Sunlight',
      value: raw.sunlight_score != null ? Math.round(raw.sunlight_score) : 0,
      status: (raw.sunlight_score ?? 0) >= 40 ? 'High Solar Power' : 'Moderate Sun',
      icon: Sun
    },
    {
      label: 'Water Ice',
      value: raw.water_ice_score != null ? Math.round(raw.water_ice_score) : 0,
      status: `${iceConf.confidence_pct != null ? iceConf.confidence_pct : Math.round(raw.water_ice_score ?? 0)}% Confidence`,
      icon: Droplets
    },
    {
      label: 'Radiation Shield',
      value: raw.radiation_safety_score != null ? Math.round(raw.radiation_safety_score) : 0,
      status: (raw.radiation_safety_score ?? 0) >= 50 ? 'Shielded Rim' : 'Exposed Plain',
      icon: Shield
    },
    {
      label: 'Touchdown Zone',
      value: Math.round(raw.best_nearby_landing_score ?? raw.landing_suitability_score ?? 0),
      status: 'Optimal Pad Zone',
      icon: Anchor
    },
    {
      label: 'Low Dust Risk',
      value: Math.round(100 - (raw.dust_risk_score ?? 50)),
      status: 'Controlled',
      icon: TrendingUp
    }
  ];

  return (
    <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm space-y-4 transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#0066cc]" />
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            Explainable AI – Structured Factor Breakdown ({site?.name || 'Selected Site'})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Google Gemini LLM / Error Badge */}
          {isError ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Gemini Rate/Credit Limit ({errorType})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-[#0066cc] border-blue-500/20">
              <Sparkles className="w-3 h-3 text-[#0066cc]" />
              <span>Google Gemini LLM (gemini-3.6-flash)</span>
            </span>
          )}

          {site?.unique_id && (
            <span className="text-xs font-mono font-medium text-[#0066cc] bg-[var(--apple-parchment)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full">
              {site.unique_id}
            </span>
          )}

          <button
            onClick={() => fetchFullXaiReport(siteName)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[var(--apple-parchment)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#0066cc] transition-colors cursor-pointer"
            title="Refresh Live Gemini Explanation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0066cc]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Structured XAI Modes Navigation Segmented Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 flex-wrap">
        <button
          onClick={() => setActiveXaiTab('selection')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            activeXaiTab === 'selection'
              ? 'bg-[#0066cc] text-white shadow-sm font-semibold'
              : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>1. Site Selection & Key Drivers</span>
        </button>

        <button
          onClick={() => setActiveXaiTab('risks')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            activeXaiTab === 'risks'
              ? 'bg-[#0066cc] text-white shadow-sm font-semibold'
              : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>2. Risk & Mitigations</span>
        </button>

        <button
          onClick={() => setActiveXaiTab('counterfactual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            activeXaiTab === 'counterfactual'
              ? 'bg-[#0066cc] text-white shadow-sm font-semibold'
              : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>3. Counterfactual Sensitivity</span>
        </button>
      </div>

      {/* Live Loading State */}
      {isLoading ? (
        <div className="p-8 rounded-[16px] bg-[var(--apple-parchment)] border border-[var(--border-color)] flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-2 text-[#0066cc] font-semibold text-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" />
            <span>Querying Google Gemini LLM in real time for {siteName}...</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] text-center max-w-sm">
            Generating multi-criteria site selection reasoning, risk mitigation protocols, and counterfactual sensitivity narratives.
          </p>
        </div>
      ) : isError ? (
        /* Real API Error / Rate Limit / Credit Limit Display */
        <div className="p-5 rounded-[16px] bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
            <AlertOctagon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>GOOGLE GEMINI API: {errorType === 'RESOURCE_EXHAUSTED' ? '429 RESOURCE_EXHAUSTED (Rate / Quota Limit)' : 'API Error Occurred'}</span>
          </div>
          <p className="text-xs text-[var(--text-primary)] font-mono leading-relaxed bg-[var(--apple-parchment)] p-3 rounded-xl border border-[var(--border-color)] break-words">
            {errorMessage || 'Google Gemini API request failed. Please check rate limit or account credits.'}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[var(--text-muted)]">
              The dashboard displays live API responses directly without placeholder text.
            </span>
            <button
              onClick={() => fetchFullXaiReport(siteName)}
              className="px-3.5 py-1.5 bg-[#0066cc] text-white text-xs font-semibold rounded-lg hover:bg-[#0055aa] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Query</span>
            </button>
          </div>
        </div>
      ) : (
        /* Mode Content Views */
        <>
          {activeXaiTab === 'selection' && siteExplanation && (
            <div className="space-y-3">
              {/* Summary Box */}
              <div className="p-4 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0066cc]">
                  <Info className="w-3.5 h-3.5" />
                  <span>DECISION SUMMARY (LIVE GEMINI SYNTHESIS)</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                  {siteExplanation.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Key Contributing Reasons */}
                {siteExplanation.key_reasons && siteExplanation.key_reasons.length > 0 && (
                  <div className="p-3.5 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Key Contributing Reasons
                    </span>
                    <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                      {siteExplanation.key_reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Identified Limitations */}
                {siteExplanation.limitations && siteExplanation.limitations.length > 0 && (
                  <div className="p-3.5 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      Identified Limitations & Caveats
                    </span>
                    <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                      {siteExplanation.limitations.map((limit, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">⚠</span>
                          <span>{limit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {siteExplanation.ml_context && (
                <div className="text-[11px] text-[var(--text-muted)] italic px-1">
                  {siteExplanation.ml_context}
                </div>
              )}
            </div>
          )}

          {activeXaiTab === 'risks' && riskMitigation && (
            <div className="space-y-3">
              <div className="p-4 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-1.5">
                <span className="text-[10px] font-semibold text-[#0066cc] uppercase tracking-wider block">
                  Risk Profile Overview
                </span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  {riskMitigation.overview}
                </p>
              </div>

              <div className="space-y-2">
                {riskMitigation.mitigations?.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-[12px] bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{m.factor}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          m.risk_level === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : m.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {m.risk_level} RISK
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{m.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>

              {riskMitigation.mission_note && (
                <div className="text-[11px] text-[var(--text-muted)] px-1 italic">
                  {riskMitigation.mission_note}
                </div>
              )}
            </div>
          )}

          {activeXaiTab === 'counterfactual' && counterfactual && (
            <div className="space-y-3">
              <div className="p-4 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-[#0066cc] uppercase tracking-wider block">
                    Perturbation Sensitivity Overview
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {counterfactual.summary}
                  </p>
                </div>
                {counterfactual.overall_robustness && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border flex-shrink-0 ${
                    counterfactual.overall_robustness === 'ROBUST'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }`}>
                    {counterfactual.overall_robustness} ROBUSTNESS
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {counterfactual.scenario_narratives?.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-[12px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{s.factor} Priority Shift</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        s.classification === 'ROBUST'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : s.classification === 'SENSITIVE'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {s.classification}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {s.narrative}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 6 Core Factor Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
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
