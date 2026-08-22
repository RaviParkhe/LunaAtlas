import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Hash, MapPin } from 'lucide-react';

export default function CandidatePointsTable({ sites = [], selectedSite, onSelectSite }) {
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortAsc, setSortAsc] = useState(false);

  const displaySites = sites && sites.length > 0 ? sites : [
    { name: 'Faustini Rim', rank: 1, overall_score: 49.1, lat: -87.3, lon: 77.0, elevation_m: 577.9, slope_deg: 1.12, raw_metrics: { sunlight_score: 41.8, water_ice_score: 22.4, landing_suitability_score: 89.1, radiation_safety_score: 56.8 } },
    { name: 'Nobile Rim', rank: 2, overall_score: 49.2, lat: -85.3, lon: 53.3, elevation_m: 458.1, slope_deg: 1.84, raw_metrics: { sunlight_score: 45.2, water_ice_score: 18.2, landing_suitability_score: 88.4, radiation_safety_score: 52.1 } },
    { name: 'Shackleton Crater Rim', rank: 3, overall_score: 47.4, lat: -89.7, lon: 129.8, elevation_m: 1926.5, slope_deg: 2.45, raw_metrics: { sunlight_score: 53.3, water_ice_score: 31.0, landing_suitability_score: 76.5, radiation_safety_score: 61.2 } },
    { name: 'Malapert Massif', rank: 4, overall_score: 42.1, lat: -86.0, lon: -2.3, elevation_m: 4911.0, slope_deg: 3.10, raw_metrics: { sunlight_score: 48.1, water_ice_score: 12.0, landing_suitability_score: 72.1, radiation_safety_score: 58.9 } },
    { name: 'de Gerlache Rim', rank: 5, overall_score: 37.8, lat: -88.5, lon: -87.1, elevation_m: 2100.0, slope_deg: 4.20, raw_metrics: { sunlight_score: 42.0, water_ice_score: 15.5, landing_suitability_score: 65.0, radiation_safety_score: 48.0 } },
    { name: 'Haworth Crater', rank: 6, overall_score: 30.2, lat: -86.9, lon: -4.0, elevation_m: -1200.0, slope_deg: 5.80, raw_metrics: { sunlight_score: 25.1, water_ice_score: 42.0, landing_suitability_score: 51.2, radiation_safety_score: 41.0 } }
  ];

  const sortedSites = [...displaySites].sort((a, b) => {
    let va = a[sortKey] ?? a.raw_metrics?.[sortKey] ?? 0;
    let vb = b[sortKey] ?? b.raw_metrics?.[sortKey] ?? 0;
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

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-5 flex flex-col gap-4 shadow-sm select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] text-[#0066cc]">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-tight text-[var(--text-primary)] uppercase">
              Evaluated Candidate Landing Sites
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Ranked South Pole Exploration Zones
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--apple-parchment)] text-[#0066cc] border border-[var(--border-color)]">
          {displaySites.length} Candidates
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-medium text-[11px]">
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('rank')}>
                Rank <SortIcon k="rank" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('name')}>
                Candidate Site <SortIcon k="name" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('overall_score')}>
                Score / 100 <SortIcon k="overall_score" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('lat')}>
                Coordinates <SortIcon k="lat" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('elevation_m')}>
                Elevation <SortIcon k="elevation_m" />
              </th>
              <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('slope_deg')}>
                Slope <SortIcon k="slope_deg" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {sortedSites.map((s) => {
              const isSelected = selectedSite && selectedSite.name === s.name;
              const scoreVal = (s.overall_score ?? s.score ?? 0).toFixed(1);
              return (
                <tr
                  key={s.name}
                  onClick={() => onSelectSite && onSelectSite(s)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--apple-parchment)] text-[#0066cc] font-medium'
                      : 'hover:bg-[var(--apple-parchment)] text-[var(--text-secondary)]'
                  }`}
                >
                  <td className="py-3 px-3 font-semibold text-[#0066cc]">
                    #{s.rank ?? 1}
                  </td>
                  <td className="py-3 px-3 font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>{s.name}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#0066cc]">
                    {scoreVal}
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                    {Math.abs(s.lat ?? -87.3).toFixed(1)}°S, {(s.lon ?? 77.0).toFixed(1)}°E
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                    {s.elevation_m !== undefined ? `${s.elevation_m}m` : '577m'}
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                    {s.slope_deg !== undefined ? `${s.slope_deg}°` : '1.1°'}
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
