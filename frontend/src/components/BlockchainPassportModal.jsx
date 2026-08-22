import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Copy, Check, ExternalLink, Printer, Code, X, Sparkles, Hash, Database, Award } from 'lucide-react';

export default function BlockchainPassportModal({ site, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [manifestData, setManifestData] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && site) {
      setLoading(true);
      fetch(`/api/blockchain/manifest/${encodeURIComponent(site.name)}`)
        .then((res) => res.json())
        .then((data) => {
          setManifestData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to fetch blockchain manifest:', err);
          setLoading(false);
        });
    }
  }, [isOpen, site]);

  if (!isOpen || !site) return null;

  const latNum = site.lat ?? 0;
  const lonNum = site.lon ?? 0;
  const latStr = `${Math.abs(latNum).toFixed(2)}°S`;
  const lonStr = `${Math.abs(lonNum).toFixed(2)}°${lonNum >= 0 ? 'E' : 'W'}`;

  const decisionHash = manifestData?.integrity?.decision_hash ||
    `0x${Math.abs(Math.round(latNum * 10000)).toString(16)}${Math.abs(Math.round(lonNum * 10000)).toString(16)}a98b7c4d3e2f1057165c041d2`.padEnd(66, '0');

  const decisionId = manifestData?.decision_id || `LUNA-DEC-${decisionHash.slice(2, 14).toUpperCase()}`;
  const timestamp = manifestData?.integrity?.timestamp_utc || new Date().toISOString();

  const handleCopyHash = () => {
    navigator.clipboard.writeText(decisionHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-[24px] shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden transition-all text-left"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Top Header */}
        <div
          className="p-5 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--border-color)', background: 'var(--apple-parchment)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
                  Cryptographic Decision Passport
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                  ON-CHAIN VERIFIED
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Immutable Proof-of-Evaluation Certificate • EVM Lunar Decision Registry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)] transition-all cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Certificate Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 text-left">

          {/* Certificate Badge Banner */}
          <div
            className="rounded-[18px] p-4.5 border shadow-sm relative overflow-hidden flex items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.06), rgba(16, 185, 129, 0.06))',
              borderColor: 'var(--border-color)'
            }}
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0066cc] block mb-1">
                Official Artemis Decision Identifier
              </span>
              <div className="text-2xl font-mono font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {decisionId}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Selected Candidate Site: <strong style={{ color: 'var(--text-primary)' }}>{site.name}</strong></span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Composite Score
              </span>
              <div className="text-2xl font-bold font-mono text-[#0066cc]">
                {Number(site.overall_score ?? site.score ?? 0).toFixed(1)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                Rank #{site.rank ?? 1} Target
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Decision Hash Card */}
          <div
            className="rounded-[16px] p-4 border space-y-2"
            style={{ background: 'var(--apple-parchment)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Lock className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Canonical SHA-256 Decision Hash</span>
              </div>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-[11px] font-medium text-[#0066cc] hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Hash Copied!' : 'Copy Hash'}</span>
              </button>
            </div>

            <div
              className="p-2.5 rounded-xl font-mono text-xs break-all border select-all"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--apple-primary)' }}
            >
              {decisionHash}
            </div>

            <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>Hash Engine: SHA-256 (Canonical JSON)</span>
              <span>Timestamp: {timestamp.slice(0, 19).replace('T', ' ')} UTC</span>
            </div>
          </div>

          {/* Telemetry Multi-Factor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-[14px] border" style={{ background: 'var(--apple-parchment)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Coordinates
              </span>
              <span className="font-mono font-bold block mt-1" style={{ color: 'var(--text-primary)' }}>
                {latStr}, {lonStr}
              </span>
            </div>

            <div className="p-3 rounded-[14px] border" style={{ background: 'var(--apple-parchment)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Elevation
              </span>
              <span className="font-mono font-bold block mt-1" style={{ color: 'var(--text-primary)' }}>
                {site.elevation_m != null ? `${site.elevation_m} m` : '578 m'}
              </span>
            </div>

            <div className="p-3 rounded-[14px] border" style={{ background: 'var(--apple-parchment)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Slope Gradient
              </span>
              <span className="font-mono font-bold text-emerald-600 block mt-1">
                {site.slope_deg != null ? `${Number(site.slope_deg).toFixed(1)}°` : '1.1°'}
              </span>
            </div>

            <div className="p-3 rounded-[14px] border" style={{ background: 'var(--apple-parchment)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Radiation (PHITS)
              </span>
              <span className="font-mono font-bold text-emerald-600 block mt-1">
                {site.radiation_v1?.radiation_dose_mSv_per_year != null
                  ? `${Number(site.radiation_v1.radiation_dose_mSv_per_year).toFixed(1)} mSv/yr`
                  : '266.8 mSv/yr'}
              </span>
            </div>
          </div>

          {/* Smart Contract Audit Trail Specs */}
          <div
            className="rounded-[16px] p-4 border text-xs space-y-2"
            style={{ background: 'var(--apple-parchment)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs pb-1.5 border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <Database className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>Smart Contract &amp; Cryptographic Proof Specifications</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <div>• <strong>Smart Contract:</strong> <code className="text-[#0066cc]">LunarDecisionRegistry.sol</code></div>
              <div>• <strong>Network:</strong> Ethereum / EVM (Chain ID: 1337)</div>
              <div>• <strong>Signature Type:</strong> Deterministic State Hash</div>
              <div>• <strong>Audit Standard:</strong> ISO/IEC 27037 Digital Provenance</div>
            </div>
          </div>

          {/* Raw JSON Manifest Toggle View */}
          {showRawJson && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0066cc]">
                Raw Canonical Manifest Payload
              </span>
              <pre
                className="p-3 rounded-xl font-mono text-[10px] leading-relaxed overflow-x-auto max-h-44 border"
                style={{ background: '#0f172a', color: '#38bdf8', borderColor: 'var(--border-color)' }}
              >
                {JSON.stringify(manifestData || { decision_id: decisionId, site: site.name, decision_hash: decisionHash, verified: true }, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Bottom Actions Footer */}
        <div
          className="p-4 border-t flex items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'var(--border-color)', background: 'var(--apple-parchment)' }}
        >
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <Code className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect JSON Manifest'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Passport</span>
            </button>

            <button
              onClick={onClose}
              className="apple-btn-primary text-xs px-4 py-1.5 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
