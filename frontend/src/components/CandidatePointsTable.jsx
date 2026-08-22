import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Trophy, MapPin, Search, ShieldCheck } from 'lucide-react';
import BlockchainPassportModal from './BlockchainPassportModal';

export default function CandidatePointsTable({ sites = [], selectedSite, onSelectSite }) {
  const [passportSite, setPassportSite] = useState(null);
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
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)] inline ml-1" />;
    return sortAsc
      ? <ArrowUp className="w-3 h-3 text-[var(--apple-primary)] inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-[var(--apple-primary)] inline ml-1" />;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return {
      className: 'border font-bold',
      style: { background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.4)' }
    };
    if (rank === 2) return {
      className: 'border font-bold',
      style: { background: 'rgba(100, 116, 139, 0.10)', color: 'var(--text-secondary)', borderColor: 'rgba(100, 116, 139, 0.3)' }
    };
    if (rank === 3) return {
      className: 'border font-bold',
      style: { background: 'rgba(180, 83, 9, 0.10)', color: '#b45309', borderColor: 'rgba(180, 83, 9, 0.3)' }
    };
    return {
      className: 'border font-medium',
      style: { background: 'var(--apple-parchment)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
    };
  };

  return (
    <div
      className="rounded-[18px] p-5 flex flex-col gap-4 select-none transition-colors duration-200"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between pb-3 flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-full"
            style={{ background: 'rgba(0, 102, 204, 0.10)', color: 'var(--apple-primary)' }}
          >
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2
              className="text-xs font-semibold tracking-tight uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              Multi-Criteria Ranking &amp; Exploration Decision System
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Ranked South Pole Lunar Habitats (Dynamic Scientific AHP Evaluation)
            </p>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search candidate crater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 rounded-full text-xs focus:outline-none w-48 transition-all"
            style={{
              background: 'var(--apple-parchment)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--apple-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
        </div>
      </div>

      {/* Ranking Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-wider font-semibold"
              style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            >
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
                Radiation <SortIcon k="radiation_safety_score" />
              </th>
              <th className="py-2.5 px-3 text-right">
                Elevation · Slope
              </th>
              <th className="py-2.5 px-3 text-center">
                Passport
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSites.map((s) => {
              const isSelected = selectedSite && selectedSite.name === s.name;
              const scoreVal = Number(s.overall_score ?? s.score ?? 0).toFixed(1);
              const raw = s.raw_metrics || {};
              const rankStyle = getRankStyle(s.rank ?? 1);

              return (
                <tr
                  key={s.name}
                  onClick={() => onSelectSite && onSelectSite(s)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(0, 102, 204, 0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--apple-primary)' : '3px solid transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--apple-parchment)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Rank Badge */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full ${rankStyle.className}`}
                      style={rankStyle.style}
                    >
                      #{s.rank ?? 1}
                    </span>
                  </td>

                  {/* Site Name & Coords */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: isSelected ? 'var(--apple-primary)' : 'var(--text-muted)' }}
                      />
                      <div>
                        <span
                          className="font-semibold text-xs block"
                          style={{ color: isSelected ? 'var(--apple-primary)' : 'var(--text-primary)' }}
                        >
                          {s.name}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {Math.abs(s.lat ?? -87.3).toFixed(2)}°S, {Math.abs(s.lon ?? 77.0).toFixed(2)}°{s.lon >= 0 ? 'E' : 'W'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Composite Suitability Score + Mini Bar */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                        {scoreVal}{' '}
                        <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>/100</span>
                      </span>
                      <div
                        className="w-16 h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--border-color)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, Number(scoreVal)))}%`,
                            background: 'var(--apple-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Sunlight — amber */}
                  <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: '#d97706' }}>
                    {raw.sunlight_score != null ? `${Number(raw.sunlight_score).toFixed(1)}%` : '—'}
                  </td>

                  {/* Ice Access — cyan */}
                  <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: '#0891b2' }}>
                    {raw.water_ice_score != null ? `${Number(raw.water_ice_score).toFixed(1)}%` : '—'}
                  </td>

                  {/* Landing Safety — emerald */}
                  <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: '#059669' }}>
                    {raw.landing_suitability_score != null ? `${Number(raw.landing_suitability_score).toFixed(1)}` : '—'}
                  </td>

                  {/* Radiation Shield — blue */}
                  <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: '#2563eb' }}>
                    {raw.radiation_safety_score != null ? `${Number(raw.radiation_safety_score).toFixed(1)}` : '—'}
                  </td>

                  {/* Elevation & Slope — muted */}
                  <td className="py-3 px-3 text-right text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>{s.elevation_m != null ? `${s.elevation_m}m` : '—'}</span>
                    <span className="mx-1">·</span>
                    <span>{s.slope_deg != null ? `${s.slope_deg}°` : '—'}</span>
                  </td>

                  {/* Blockchain Passport Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPassportSite(s);
                      }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer hover:scale-105 active:scale-95"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderColor: 'rgba(16, 185, 129, 0.25)',
                        color: '#059669'
                      }}
                      title="View Cryptographic Blockchain Passport"
                    >
                      ⛓️ Passport
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Blockchain Passport Modal */}
      <BlockchainPassportModal
        site={passportSite}
        isOpen={!!passportSite}
        onClose={() => setPassportSite(null)}
      />
    </div>
  );
}
