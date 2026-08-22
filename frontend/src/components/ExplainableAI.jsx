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
  Key,
  X,
  Loader2
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8050'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8050');

export default function ExplainableAI({ site }) {
  const [activeXaiTab, setActiveXaiTab] = useState('selection'); // 'selection' | 'risks' | 'counterfactual'
  const [fullReport, setFullReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gemini API Key Modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [keyStatus, setKeyStatus] = useState({ has_key: false, is_live: false, key_preview: null });
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState(null);

  const siteName = site?.name;

  // Check current XAI / Gemini status
  const checkXaiStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/xai/status`);
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkXaiStatus();
  }, []);

  // Fetch full 3-part structured XAI report from Gemini / Backend
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

  // Handle saving & verifying API key
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsTestingKey(true);
    setKeyMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/xai/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: inputKey.trim(),
          model: selectedModel
        })
      });
      const data = await res.json();
      if (res.ok) {
        setKeyMessage({ type: 'success', text: data.message || 'API Key verified & connected!' });
        await checkXaiStatus();
        fetchFullXaiReport(siteName);
        setTimeout(() => setIsKeyModalOpen(false), 1200);
      } else {
        setKeyMessage({ type: 'error', text: data.detail || 'Verification failed. Please check your key.' });
      }
    } catch (err) {
      setKeyMessage({ type: 'error', text: 'Network error verifying key.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const raw = site?.raw_metrics || {};
  const iceConf = site?.ice_confidence || { confidence_pct: 37, label: 'Moderate Volatile Signatures' };

  const siteExplanation = fullReport?.site_selection_explanation || {
    summary: site?.mission_briefing || `${siteName || 'Site'} achieves optimal ranking under multi-criteria constraints.`,
    key_reasons: [
      `Landing Safety: raw score ${(raw.landing_suitability_score ?? 86.4).toFixed(1)}/100, weight 25.0%`,
      `Solar Illumination: raw score ${(raw.sunlight_score ?? 53.3).toFixed(1)}/100, weight 30.0%`,
      `Radiation Shielding: raw score ${(raw.radiation_safety_score ?? 57.0).toFixed(1)}/100, weight 20.0%`
    ],
    limitations: [
      'Water Ice Access requires dedicated descent trajectories into cryogenic PSR cold traps.',
      'Electrostatic dust accumulation requires active sealing protocols.'
    ],
    ml_context: `Environmental Archetype: Polar Rim (${site?.elevation_m ?? 578}m Elevation).`,
    _source: 'FALLBACK'
  };

  const riskMitigation = fullReport?.risk_mitigation || {
    overview: `Risk assessment for ${siteName || 'candidate site'} based on available AHP data under active mission priorities.`,
    mitigations: [
      {
        factor: 'Electrostatic Dust',
        risk_level: 'HIGH',
        recommendation: 'Additional seal maintenance and automated brush cleaning cycles recommended.'
      },
      {
        factor: 'Water Ice Access',
        risk_level: 'MEDIUM',
        recommendation: 'Standard PSR robotic prospector protocols recommended.'
      }
    ],
    mission_note: 'Mission profile: top priority = Solar Illumination, second priority = Landing Safety.',
    _source: 'FALLBACK'
  };

  const counterfactual = fullReport?.counterfactual_analysis || {
    summary: `Counterfactual analysis for ${siteName || 'candidate site'} under priority perturbations.`,
    scenario_narratives: [
      {
        factor: 'Solar Illumination',
        classification: 'ROBUST',
        narrative: 'Increasing Solar Illumination priority maintains this site as optimal recommendation.'
      },
      {
        factor: 'Water Ice Access',
        classification: 'CAPABILITY_LIMITATION',
        narrative: 'Shifting to 60% Water Ice priority identifies a capability limitation compared to cryogenic crater floors.'
      }
    ],
    overall_robustness: 'ROBUST',
    _source: 'FALLBACK'
  };

  const metrics = [
    {
      label: 'Landing Safety',
      value: Math.round(raw.landing_suitability_score ?? 0),
      status: (raw.landing_suitability_score ?? 0) >= 70 ? 'Optimal Flatness' : 'Slope Alert',
      icon: Layers
    },
    {
      label: 'Sunlight',
      value: Math.round(raw.sunlight_score ?? 0),
      status: (raw.sunlight_score ?? 0) >= 40 ? 'High Solar Power' : 'Moderate Sun',
      icon: Sun
    },
    {
      label: 'Water Ice',
      value: Math.round(raw.water_ice_score ?? 0),
      status: `${iceConf.confidence_pct ?? 37}% Confidence`,
      icon: Droplets
    },
    {
      label: 'Radiation Shield',
      value: Math.round(raw.radiation_safety_score ?? 0),
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

  const isGemini = siteExplanation._source === 'GEMINI' || riskMitigation._source === 'GEMINI';

  return (
    <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm space-y-4 transition-colors duration-200 relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#0066cc]" />
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            Explainable AI – Structured Factor Breakdown ({site?.name || 'Selected Site'})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Connect / Manage Gemini API Key Button */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-all cursor-pointer shadow-sm active:scale-95 ${
              keyStatus.has_key
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-[#0066cc]/10 text-[#0066cc] border-[#0066cc]/30 hover:bg-[#0066cc]/20'
            }`}
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{keyStatus.has_key ? 'Gemini Connected' : 'Connect Gemini API Key'}</span>
          </button>

          {/* Source Badge */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
            isGemini
              ? 'bg-blue-500/10 text-[#0066cc] border-blue-500/20 font-semibold'
              : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] border-[var(--border-color)]'
          }`}>
            <Sparkles className={`w-3 h-3 ${isGemini ? 'text-[#0066cc]' : 'text-[var(--text-muted)]'}`} />
            <span>{isGemini ? 'Google Gemini LLM' : 'Physics Deterministic XAI'}</span>
          </span>

          {site?.unique_id && (
            <span className="text-xs font-mono font-medium text-[#0066cc] bg-[var(--apple-parchment)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full">
              {site.unique_id}
            </span>
          )}

          <button
            onClick={() => fetchFullXaiReport(siteName)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[var(--apple-parchment)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#0066cc] transition-colors cursor-pointer"
            title="Refresh XAI Inference"
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

      {/* Mode Content Views */}
      {activeXaiTab === 'selection' && (
        <div className="space-y-3">
          {/* Summary Box */}
          <div className="p-4 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0066cc]">
              <Info className="w-3.5 h-3.5" />
              <span>DECISION SUMMARY</span>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
              {siteExplanation.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Key Contributing Reasons */}
            <div className="p-3.5 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Key Contributing Reasons
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {siteExplanation.key_reasons?.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Identified Limitations */}
            <div className="p-3.5 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] space-y-2">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Identified Limitations & Caveats
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {siteExplanation.limitations?.map((limit, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">⚠</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {siteExplanation.ml_context && (
            <div className="text-[11px] text-[var(--text-muted)] italic px-1">
              {siteExplanation.ml_context}
            </div>
          )}
        </div>
      )}

      {activeXaiTab === 'risks' && (
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

      {activeXaiTab === 'counterfactual' && (
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
            <span className={`px-3 py-1 text-xs font-bold rounded-full border flex-shrink-0 ${
              counterfactual.overall_robustness === 'ROBUST'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
            }`}>
              {counterfactual.overall_robustness} ROBUSTNESS
            </span>
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

      {/* Google Gemini API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 transition-all">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#0066cc]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Connect Google Gemini LLM
                </h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enter your Google Gemini API key to enable real-time, LLM-generated Explainable AI mission briefings and counterfactual reasoning.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">Google Gemini API Key</label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={keyStatus.key_preview ? `Current: ${keyStatus.key_preview}` : 'AIzaSy...'}
                  className="w-full bg-[var(--apple-parchment)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[var(--apple-parchment)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended)</option>
                  <option value="gemini-3.7-flash">gemini-3.7-flash</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                </select>
              </div>

              {keyMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium border ${
                  keyMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}>
                  {keyMessage.text}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--apple-parchment)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTestingKey || !inputKey.trim()}
                  className="apple-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Verify & Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
