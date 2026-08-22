import React, { useState, useMemo } from 'react';
import { CANDIDATE_POINTS } from '../data/lunarDataLoader';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Hash, MapPin, Compass, Info } from 'lucide-react';

const SITE_COLORS = {
  'Shackleton Crater Rim': { dot: 'bg-amber-400',   text: 'text-amber-300',   badge: 'bg-amber-950/60 border-amber-500/40' },
  'de Gerlache Rim':       { dot: 'bg-blue-400',    text: 'text-blue-300',    badge: 'bg-blue-950/60 border-blue-500/40' },
  'Malapert Massif':       { dot: 'bg-violet-400',  text: 'text-violet-300',  badge: 'bg-violet-950/60 border-violet-500/40' },
  'Faustini Rim':          { dot: 'bg-cyan-400',    text: 'text-cyan-300',    badge: 'bg-cyan-950/60 border-cyan-500/40' },
  'Nobile Rim':            { dot: 'bg-rose-400',    text: 'text-rose-300',    badge: 'bg-rose-950/60 border-rose-500/40' },
  'Haworth Crater':        { dot: 'bg-emerald-400', text: 'text-emerald-300', badge: 'bg-emerald-950/60 border-emerald-500/40' },
};

const DEFAULT_COLOR = { dot: 'bg-slate-400', text: 'text-slate-300', badge: 'bg-slate-800/40 border-slate-700/50' };

const COLUMNS = [
  { key: 'point_id',            label: 'Point ID',     align: 'left',  highlight: 'amber' },
  { key: 'nearest_site',        label: 'Nearest Site', align: 'left',  highlight: 'site'  },
  { key: 'lat',                 label: 'Latitude',     align: 'right', highlight: 'cyan'  },
  { key: 'lon',                 label: 'Longitude',    align: 'right', highlight: 'cyan'  },
  { key: 'landing_suitability', label: 'Landing',      align: 'right' },
  { key: 'terrain_flatness',    label: 'Flatness',     align: 'right' },
  { key: 'slope_deg',           label: 'Slope°',      align: 'right' },
  { key: 'elevation_m',         label: 'Elev (m)',     align: 'right' },
  { key: 'sunlight_score',      label: 'Sunlight',     align: 'right' },
  { key: 'ice_score',           label: 'Ice Proxy',    align: 'right' },
  { key: 'dust_risk',           label: 'Dust Risk',    align: 'right' },
];

const PAGE_SIZE = 20;

function ScoreBadge({ value, max = 100, invert = false }) {
  if (value === null || value === undefined) return <span className="text-slate-600">--</span>;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const good = invert ? 1 - pct : pct;
  const color = good > 0.65 ? 'text-emerald-400' : good > 0.35 ? 'text-amber-400' : 'text-rose-400';
  return <span className={`font-semibold ${color}`}>{value}</span>;
}

export default function CandidatePointsTable() {
  const [sortKey, setSortKey]       = useState('landing_suitability');
  const [sortAsc, setSortAsc]       = useState(false);
  const [filter, setFilter]         = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [page, setPage]             = useState(0);

  const siteNames = useMemo(
    () => ['ALL', ...Array.from(new Set(CANDIDATE_POINTS.map(p => p.nearest_site)))],
    []
  );

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let pts = CANDIDATE_POINTS;
    if (siteFilter !== 'ALL') pts = pts.filter(p => p.nearest_site === siteFilter);
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      pts = pts.filter(p =>
        String(p.point_id).includes(q) ||
        p.nearest_site.toLowerCase().includes(q) ||
        String(p.lat).includes(q) ||
        String(p.lon).includes(q)
      );
    }
    return [...pts].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va === null) va = sortAsc ? Infinity : -Infinity;
      if (vb === null) vb = sortAsc ? Infinity : -Infinity;
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortAsc, filter, siteFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1 shrink-0" />;
    return sortAsc
      ? <ArrowUp   className="w-3 h-3 text-blue-400 inline ml-1 shrink-0" />
      : <ArrowDown className="w-3 h-3 text-blue-400 inline ml-1 shrink-0" />;
  };

  return (
    <div className="bg-[#0d1322] border border-[#1e293b] rounded-xl p-5 flex flex-col gap-4">

      {/* Main Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
              <span>Candidate Location Points</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-normal">
                LRO 400x400 Grid
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {CANDIDATE_POINTS.length} sampled points across {siteNames.length - 1} named site regions
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Showing {filtered.length} of {CANDIDATE_POINTS.length} points
        </span>
      </div>

      {/* Explanatory Callout Box highlighting repeated Site Names & unique Point ID + Lat/Lon */}
      <div className="bg-[#080d19] border border-cyan-500/30 rounded-lg p-3 flex items-start gap-3 text-xs font-mono text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100 uppercase tracking-wide text-[11px]">
              Highlighted Location Identifiers:
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              1) Point ID
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
              2) Nearest Site Name
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              3) Lat & Lon Coordinates
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Site names repeat across rows because multiple candidate landing points belong to the same named crater/rim area.
            <span className="text-cyan-300 font-semibold ml-1">Latitude, Longitude, and Point ID</span> differ for each row to pinpoint exact coordinates within each site.
          </p>
        </div>
      </div>

      {/* Site filter pills + search */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {siteNames.map(s => {
            const col = s === 'ALL' ? DEFAULT_COLOR : (SITE_COLORS[s] || DEFAULT_COLOR);
            const active = siteFilter === s;
            return (
              <button
                key={s}
                onClick={() => { setSiteFilter(s); setPage(0); }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                  active
                    ? `${col.badge} ${col.text} border-current shadow-sm`
                    : 'bg-transparent border-[#1e293b] text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All Sites' : s}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 ml-auto bg-[#090e18] border border-[#1e293b] rounded px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Point ID, Site, Lat, Lon..."
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
            className="bg-transparent text-[11px] font-mono text-slate-300 placeholder-slate-600 outline-none w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
        <table className="w-full text-left text-[11px] font-mono">
          <thead>
            <tr className="bg-[#090e18] text-slate-400 uppercase tracking-wider text-[10px] select-none border-b border-[#1e293b]">
              {COLUMNS.map(col => {
                let colStyle = 'hover:text-slate-200';
                if (col.highlight === 'amber') colStyle = 'text-amber-400 font-bold bg-amber-950/20';
                if (col.highlight === 'site') colStyle = 'text-blue-300 font-bold bg-blue-950/20';
                if (col.highlight === 'cyan') colStyle = 'text-cyan-300 font-bold bg-cyan-950/20';

                return (
                  <th
                    key={col.key}
                    className={`px-3 py-3 cursor-pointer transition-colors whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } ${colStyle}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.key === 'point_id' && <Hash className="w-3 h-3 text-amber-400" />}
                      {col.key === 'nearest_site' && <MapPin className="w-3 h-3 text-blue-400" />}
                      {(col.key === 'lat' || col.key === 'lon') && <Compass className="w-3 h-3 text-cyan-400" />}
                      {col.label}
                      <SortIcon k={col.key} />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-slate-600">
                  No candidate points match the current search filter.
                </td>
              </tr>
            ) : paginated.map((pt, i) => {
              const col = SITE_COLORS[pt.nearest_site] || DEFAULT_COLOR;
              return (
                <tr
                  key={`${pt.point_id}-${i}`}
                  className="hover:bg-white/[0.04] transition-colors"
                >
                  {/* 1) Point ID Highlighted */}
                  <td className="px-3 py-2.5 text-left bg-amber-950/10">
                    <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      <Hash className="w-3 h-3 text-amber-400 shrink-0" />
                      #{pt.point_id}
                    </span>
                  </td>

                  {/* 2) Nearest Site Name Highlighted */}
                  <td className="px-3 py-2.5 text-left bg-blue-950/10">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${col.badge} ${col.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${col.dot} shrink-0`} />
                      {pt.nearest_site}
                    </span>
                  </td>

                  {/* 3) Latitude Highlighted */}
                  <td className="px-3 py-2.5 text-right font-mono bg-cyan-950/10">
                    <span className="px-2 py-0.5 rounded bg-[#070d18] border border-cyan-500/30 text-cyan-300 font-bold">
                      {pt.latFormatted || `${pt.lat}° S`}
                    </span>
                  </td>

                  {/* 3) Longitude Highlighted */}
                  <td className="px-3 py-2.5 text-right font-mono bg-cyan-950/10">
                    <span className="px-2 py-0.5 rounded bg-[#070d18] border border-cyan-500/30 text-cyan-300 font-bold">
                      {pt.lonFormatted || `${pt.lon}°`}
                    </span>
                  </td>

                  {/* Scores */}
                  <td className="px-3 py-2.5 text-right"><ScoreBadge value={pt.landing_suitability} max={100} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBadge value={pt.terrain_flatness}    max={60} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBadge value={pt.slope_deg}           max={30} invert /></td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{pt.elevation_m !== null ? `${pt.elevation_m}m` : '--'}</td>
                  <td className="px-3 py-2.5 text-right"><ScoreBadge value={pt.sunlight_score}      max={100} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBadge value={pt.ice_score}           max={100} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBadge value={pt.dust_risk}           max={60} invert /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
        <span>
          Page {page + 1} of {totalPages || 1} &nbsp;&middot;&nbsp; {filtered.length} candidate points
        </span>
        <div className="flex gap-1.5">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-2.5 py-1 rounded border border-[#1e293b] hover:border-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &larr; Prev
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="px-2.5 py-1 rounded border border-[#1e293b] hover:border-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

