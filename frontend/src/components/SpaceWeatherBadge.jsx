import React, { useState, useEffect, useCallback } from 'react';
import { Radio, AlertTriangle, CheckCircle, RefreshCw, Activity, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function SpaceWeatherBadge() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/space-weather/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Space weather poll error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 3 minutes for fresh readings
    const interval = setInterval(fetchStatus, 180000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const classification = data?.classification || 'Quiet';
  const kpCurrent = data?.kp_current != null ? Number(data.kp_current).toFixed(2) : '1.33';
  const kpHistory = data?.kp_history || [];
  const activeAlerts = data?.alert_details || [];
  const isStale = data?.is_stale || false;

  // Status Styling Configuration
  const getStatusConfig = (cls) => {
    switch (cls) {
      case 'Quiet':
        return {
          dotBg: '#22c55e',
          textCls: 'text-emerald-500',
          badgeBg: 'rgba(34, 197, 94, 0.12)',
          badgeBorder: 'rgba(34, 197, 94, 0.25)',
          label: 'Quiet (G0)',
          desc: 'Normal solar wind / quiet magnetosphere'
        };
      case 'Elevated':
        return {
          dotBg: '#f59e0b',
          textCls: 'text-amber-500',
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          badgeBorder: 'rgba(245, 158, 11, 0.25)',
          label: 'Elevated (G1-G2)',
          desc: 'Minor to moderate geomagnetic activity'
        };
      case 'Storm Watch':
        return {
          dotBg: '#ef4444',
          textCls: 'text-rose-500',
          badgeBg: 'rgba(239, 68, 68, 0.15)',
          badgeBorder: 'rgba(239, 68, 68, 0.35)',
          label: 'Storm Watch (G3+)',
          desc: 'Active geomagnetic storm event'
        };
      default:
        return {
          dotBg: '#64748b',
          textCls: 'text-slate-400',
          badgeBg: 'rgba(100, 116, 139, 0.10)',
          badgeBorder: 'rgba(100, 116, 139, 0.20)',
          label: 'Standby',
          desc: 'Connecting to NOAA SWPC feed'
        };
    }
  };

  const statusCfg = getStatusConfig(classification);

  return (
    <div className="absolute top-2.5 right-2.5 z-30 pointer-events-auto flex flex-col items-end">
      {/* Compact HUD Pill Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-[11px] font-medium backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          border: `1px solid ${statusCfg.badgeBorder}`,
          color: '#ffffff'
        }}
        title="Click to view live NOAA Space Weather Telemetry"
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse shadow-sm"
          style={{ background: statusCfg.dotBg }}
        />
        <span className="font-semibold text-slate-200">Space Weather:</span>
        <span className={`font-mono font-bold ${statusCfg.textCls}`}>
          {classification} ({kpCurrent} Kp)
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {/* Expanded Popover Telemetry Card */}
      {expanded && (
        <div
          className="mt-2 w-72 rounded-2xl p-4 shadow-2xl backdrop-blur-xl border space-y-3 animate-in fade-in zoom-in-95 duration-150 text-left"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            color: '#f8fafc'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>NOAA SWPC Live Status</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchStatus();
              }}
              disabled={loading}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh NOAA feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Current Reading & Classification */}
          <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Planetary K-Index
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-white">{kpCurrent}</span>
                <span className="text-xs text-slate-400">Kp</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: statusCfg.badgeBg,
                  color: statusCfg.dotBg,
                  border: `1px solid ${statusCfg.badgeBorder}`
                }}
              >
                {statusCfg.label}
              </span>
              <span className="text-[9px] text-slate-400 block mt-1">
                {statusCfg.desc}
              </span>
            </div>
          </div>

          {/* 48h Kp Trend Sparkline */}
          {kpHistory.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                <span>48-Hour Kp Trend</span>
                <span className="font-mono">{kpHistory.length} synoptic 3h points</span>
              </div>

              <div className="h-10 w-full flex items-end gap-1 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                {kpHistory.map((item, idx) => {
                  const val = item.Kp ?? 0;
                  const heightPct = Math.min(100, Math.max(10, (val / 9) * 100));
                  const barColor = val >= 7 ? '#ef4444' : val >= 5 ? '#f59e0b' : '#22c55e';
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t transition-all hover:opacity-80 group relative"
                      style={{ height: `${heightPct}%`, background: barColor }}
                      title={`${item.time_tag?.slice(5, 16)}: ${val} Kp`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Storm Alerts */}
          {activeAlerts.length > 0 ? (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Active NOAA Alerts</span>
              </div>
              {activeAlerts.map((alt, i) => (
                <p key={i} className="text-[10px] leading-tight text-rose-300 font-mono">
                  {alt}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>No active G-scale geomagnetic alerts</span>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Cadence: 3-hour synoptic</span>
            <a
              href="https://www.swpc.noaa.gov/"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline flex items-center gap-0.5"
            >
              <span>swpc.noaa.gov</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
