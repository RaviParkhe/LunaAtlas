import React, { useState } from 'react';
import { List, FileText, Download, Share2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function TopCandidateSites({ sites, selectedSite, onSelectSite }) {
  const [sortField, setSortField] = useState('landingSuitability');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Sort sites dynamically
  const sortedSites = [...sites].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-blue-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 inline ml-1" />
    );
  };

  return (
    <div className="glass-panel p-5 flex flex-col justify-between space-y-4 bg-[#0d1322] border border-[#1e293b] rounded-lg">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <List className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            SITE COMPARISON TABLE (6 NAMED SITES)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Click column headers to sort
        </span>
      </div>

      {/* Sortable Interactive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e293b] text-slate-400 text-[11px] uppercase tracking-wider select-none">
              <th className="pb-3 pl-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('rank')}>
                Rank {renderSortIcon('rank')}
              </th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('name')}>
                Site Name {renderSortIcon('name')}
              </th>
              <th className="pb-3">Lat / Lon</th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('landingSuitability')}>
                Landing Suitability {renderSortIcon('landingSuitability')}
              </th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('terrainFlatness')}>
                Flatness {renderSortIcon('terrainFlatness')}
              </th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('slopeRaw')}>
                Slope {renderSortIcon('slopeRaw')}
              </th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('elevationRaw')}>
                Elevation {renderSortIcon('elevationRaw')}
              </th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('bestSunlight')}>
                Sunlight {renderSortIcon('bestSunlight')}
              </th>
              <th className="pb-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('bestIce')}>
                Ice Proxy {renderSortIcon('bestIce')}
              </th>
              <th className="pb-3 pr-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('bestDust')}>
                Dust Risk {renderSortIcon('bestDust')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {sortedSites.map((site) => {
              const isSelected = selectedSite && selectedSite.name === site.name;
              return (
                <tr
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-900/30 text-white font-semibold border-l-4 border-l-blue-500'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-3 pl-3 font-bold text-slate-400">{site.rank}</td>
                  <td className="py-3 font-sans font-semibold text-slate-100">{site.name}</td>
                  <td className="py-3 text-slate-400 text-[11px]">{site.latitude}, {site.longitude}</td>
                  <td className="py-3 font-bold text-emerald-400">{site.landingSuitability}</td>
                  <td className="py-3 text-slate-200">{site.terrainFlatness}</td>
                  <td className="py-3 text-slate-200">{site.slope}</td>
                  <td className="py-3 text-slate-200">{site.elevation}</td>
                  <td className="py-3 text-amber-400">{site.bestSunlight}</td>
                  <td className="py-3 text-blue-400">{site.bestIce}</td>
                  <td className="py-3 pr-3 text-right text-slate-400">{site.bestDust}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mission Report & Export Footer */}
      <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase">
            MISSION REPORT & EXPORT
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Generate detailed mission report with full analysis, maps, and recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="px-3.5 py-2 rounded bg-[#090e18] text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-[#1e293b] flex items-center gap-2 transition-colors">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Generate Report (PDF)</span>
          </button>

          <button className="px-3.5 py-2 rounded bg-[#090e18] text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-[#1e293b] flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Data (CSV)</span>
          </button>

          <button className="px-3.5 py-2 rounded bg-[#090e18] text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-[#1e293b] flex items-center gap-2 transition-colors">
            <Share2 className="w-4 h-4 text-blue-400" />
            <span>Share Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
}
