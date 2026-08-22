import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Trophy, MapPin, Search } from 'lucide-react';

export default function CandidatePointsTable({ sites = [], selectedSite, onSelectSite }) {
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displaySites = sites && sites.length > 0 ? sites : [];

  const filteredSites = displaySites.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.unique_id && s.unique_id.toLowerCase().includes(q))
    );
  });

  const sortedSites = [...filteredSites].sort((a, b) => {
    let va = a[sortKey] ?? a.raw_metrics?.[sortKey] ?? 0;
    let vb = b[sortKey] ?? b.raw_metrics?.[sortKey] ?? 0;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();

    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)] inline ml-1" />;
    return sortAsc
      ? <ArrowUp className="w-3 h-3 text-[#0066cc] inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-[#0066cc] inline ml-1" />;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold';
    }
    if (rank === 2) {
      return 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/30 font-bold';
    }
    if (rank === 3) {
      return 'bg-amber-700/10 text-amber-700 dark:text-amber-500 border-amber-700/30 font-bold';
    }
    return 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] border-[var(--border-color)] font-medium';
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-5 flex flex-col gap-4 shadow-sm select-none transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-blue-500/10 text-[#0066cc]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-tight text-[var(--text-primary)] uppercase">
              Multi-Criteria Ranking & Exploration Decision System
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Ranked South Pole Lunar Habitats (Dynamic Scientific AHP Evaluation)
            </p>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search candidate crater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[var(--apple-parchment)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0066cc] w-48 transition-all"
          />
        </div>
      </div>

      {/* Modern High-Density Ranking Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-medium text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('rank')}>
                Rank <SortIcon k="rank" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('name')}>
                Candidate Habitat Site <SortIcon k="name" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('overall_score')}>
                Suitability Score <SortIcon k="overall_score" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('sunlight_score')}>
                Sunlight <SortIcon k="sunlight_score" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('water_ice_score')}>
                Ice Access <SortIcon k="water_ice_score" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('landing_suitability_score')}>
                Landing Safety <SortIcon k="landing_suitability_score" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('radiation_safety_score')}>
                Radiation Shield <SortIcon k="radiation_safety_score" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('elevation_m')}>
                Elevation / Slope <SortIcon k="elevation_m" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {sortedSites.map((s) => {
              const isSelected = selectedSite && selectedSite.name === s.name;
              const scoreVal = Number(s.overall_score ?? s.score ?? 0).toFixed(1);
              const raw = s.raw_metrics || {};

              return (
                <tr
                  key={s.name}
                  onClick={() => onSelectSite && onSelectSite(s)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-500/10 dark:bg-blue-950/40 text-[var(--text-primary)] font-medium border-l-4 border-l-[#0066cc]'
                      : 'hover:bg-[var(--apple-parchment)] text-[var(--text-secondary)]'
                  }`}
                >
                  {/* Rank Column */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full border ${getRankBadge(s.rank ?? 1)}`}>
                      #{s.rank ?? 1}
                    </span>
                  </td>

                  {/* Site Name & Subtitle */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0066cc]' : 'text-[var(--text-muted)]'}`} />
                      <div>
                        <span className={`font-semibold text-xs block ${isSelected ? 'text-[#0066cc]' : 'text-[var(--text-primary)]'}`}>
                          {s.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {Math.abs(s.lat ?? -87.3).toFixed(2)}°S, {Math.abs(s.lon ?? 77.0).toFixed(2)}°{s.lon >= 0 ? 'E' : 'W'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Composite Score */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-xs text-[var(--text-primary)] font-mono">
                        {scoreVal} <span className="text-[10px] text-[var(--text-muted)] font-normal">/ 100</span>
                      </span>
                      <div className="w-16 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0066cc]"
                          style={{ width: `${Math.min(100, Math.max(5, scoreVal))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Sunlight */}
                  <td className="py-3 px-3 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                    {raw.sunlight_score != null ? `${Number(raw.sunlight_score).toFixed(1)}%` : '—'}
                  </td>

                  {/* Water Ice */}
                  <td className="py-3 px-3 text-right font-mono font-medium text-cyan-600 dark:text-cyan-400">
                    {raw.water_ice_score != null ? `${Number(raw.water_ice_score).toFixed(1)}%` : '—'}
                  </td>

                  {/* Landing Safety */}
                  <td className="py-3 px-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {raw.landing_suitability_score != null ? `${Number(raw.landing_suitability_score).toFixed(1)}` : '—'}
                  </td>

                  {/* Radiation Shield */}
                  <td className="py-3 px-3 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                    {raw.radiation_safety_score != null ? `${Number(raw.radiation_safety_score).toFixed(1)}` : '—'}
                  </td>

                  {/* Elevation & Slope */}
                  <td className="py-3 px-3 text-right text-[11px] font-mono text-[var(--text-muted)]">
                    <span>{s.elevation_m != null ? `${s.elevation_m}m` : '—'}</span>
                    <span className="mx-1">·</span>
                    <span>{s.slope_deg != null ? `${s.slope_deg}°` : '—'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
