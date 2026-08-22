import React from 'react';
import { Compass, Navigation, Mountain, Cpu } from 'lucide-react';

export default function AIRecommendationSummary({ site }) {
  if (!site) return null;

  const latNum = site.lat ?? site.latRaw ?? -89.42;
  const lonNum = site.lon ?? site.lonRaw ?? 27.31;

  const latStr = `${Math.abs(latNum).toFixed(2)}°S`;
  const lonStr = `${Math.abs(lonNum).toFixed(2)}°${lonNum >= 0 ? 'E' : 'W'}`;

  const uniqueId = site.unique_id || `LUN-${Math.abs(Math.round(latNum * 100))}-${Math.abs(Math.round(lonNum * 100))}`;
  const scoreVal = (site.overall_score ?? site.score ?? 49.1).toFixed(1);
  const elevationVal = site.elevation_m !== undefined ? `${site.elevation_m} m` : (site.elevation || '+577.9 m');

  return (
    <div className="p-5 flex flex-col justify-between h-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] text-[#0066cc]">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            AI Recommendation Summary
          </h2>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 flex-1 items-stretch">
        {/* Left Side: Candidate Location Info */}
        <div className="col-span-12 sm:col-span-7 bg-[var(--apple-parchment)] rounded-[14px] p-4 border border-[var(--border-color)] flex flex-col justify-between space-y-3">
          <div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Recommended Site
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-snug">
              {site.name}
            </h3>

            {/* UNIQUE ID Display */}
            <div className="mt-2.5">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Unique Identifier
              </span>
              <span className="text-sm font-mono font-medium text-[#0066cc] bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-full inline-block">
                {uniqueId}
              </span>
            </div>
          </div>

          {/* Location Attributes */}
          <div className="space-y-2 text-xs pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Compass className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Latitude</span>
              </div>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {latStr}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Navigation className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Longitude</span>
              </div>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {lonStr}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Mountain className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Elevation</span>
              </div>
              <span className="font-medium text-[var(--text-primary)]">{elevationVal}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Scores & Confidence */}
        <div className="col-span-12 sm:col-span-5 flex flex-col gap-3">
          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-4 border border-[var(--border-color)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Suitability Score
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
                  {scoreVal}
                </span>
                <span className="text-xs text-[var(--text-muted)]">/100</span>
              </div>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {site.status || (parseFloat(scoreVal) >= 48 ? 'Optimal Target' : 'Suitable')}
              </span>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Confidence
              </div>
              <div className="text-xl font-semibold text-[#0066cc] mt-1.5">
                {site.confidence || '94%'}
              </div>
            </div>
          </div>

          <div className="bg-[var(--apple-parchment)] rounded-[14px] p-4 border border-[var(--border-color)] flex-1 flex flex-col justify-around text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-[var(--text-secondary)]">Mission Profile</span>
              <span className="font-medium text-[var(--text-primary)]">
                {site.recommendedMission || 'Permanent Habitat'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Risk Assessment</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Low Risk ({site.slope_deg ? `${site.slope_deg}° slope` : '1.1° slope'})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
