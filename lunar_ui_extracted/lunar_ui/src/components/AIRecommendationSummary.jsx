import React from 'react';
import { Compass, Navigation, Mountain, Landmark, ShieldCheck, Cpu, Hash, MapPin } from 'lucide-react';

export default function AIRecommendationSummary({ site }) {
  if (!site) return null;

  const latStr = site.latRaw !== undefined 
    ? `${Math.abs(site.latRaw).toFixed(2)}° S` 
    : (site.latitude || '').replace(/^-/, '');
  const lonStr = site.lonRaw !== undefined 
    ? `${Math.abs(site.lonRaw).toFixed(2)}° ${site.lonRaw >= 0 ? 'E' : 'W'}` 
    : site.longitude;

  const pointId = site.point_id ?? (site.row !== undefined && site.col !== undefined ? site.row * 400 + site.col : 143520);

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full bg-[#0d1322] border border-[#1e293b] rounded-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3.5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            AI RECOMMENDATION SUMMARY
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
          High Suitability Zone
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-5 flex-1 items-stretch">
        {/* Left Side: Candidate Location Info */}
        <div className="col-span-7 bg-[#090e18] rounded-lg p-5 border border-[#1e293b] flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Recommended Nearest Site</span>
            </div>
            {/* 1) Nearest Site Name Highlighted */}
            <h3 className="text-2xl font-extrabold text-slate-100 tracking-tight leading-snug mb-3">
              {site.name}
            </h3>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                Primary Candidate
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {site.region || 'South Pole Region'}
              </span>
            </div>
          </div>

          {/* Location Attributes */}
          <div className="space-y-3 text-xs pt-4 border-t border-[#1e293b]">
            {/* 3) Point ID Highlighted */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-400 font-medium shrink-0">
                <Hash className="w-4 h-4 text-amber-400" />
                <span>Point ID</span>
              </div>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                #{pointId}
              </span>
            </div>

            {/* 2) Latitude Highlighted */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-400 font-medium shrink-0">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Latitude</span>
              </div>
              <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {latStr}
              </span>
            </div>

            {/* 2) Longitude Highlighted */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-400 font-medium shrink-0">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Longitude</span>
              </div>
              <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {lonStr}
              </span>
            </div>

            {/* Elevation */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-400 font-medium shrink-0">
                <Mountain className="w-4 h-4 text-blue-400" />
                <span>Elevation</span>
              </div>
              <span className="font-semibold text-slate-100">{site.elevation || '+1250 m'}</span>
            </div>

            {/* Landmark (Fixed spacing gap) */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-400 font-medium shrink-0">
                <Landmark className="w-4 h-4 text-blue-400" />
                <span>Landmark</span>
              </div>
              <span className="font-semibold text-slate-200 truncate max-w-[160px] text-right pl-2">
                {site.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Scores & Confidence */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Suitability Score Box */}
          <div className="bg-[#090e18] rounded-lg p-5 border border-[#1e293b] flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Suitability Score
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-slate-100">
                  {site.score}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/100</span>
              </div>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                {site.status || 'Excellent'}
              </span>
            </div>

            {/* Confidence Box */}
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confidence
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-2">
                {site.confidence || '96%'}
              </div>
            </div>
          </div>

          {/* Mission Details Box */}
          <div className="bg-[#090e18] rounded-lg p-5 border border-[#1e293b] flex-1 flex flex-col justify-around text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <span className="text-slate-400 font-medium">Mission Type</span>
              <span className="font-semibold text-slate-200">
                {site.recommendedMission || 'Permanent Habitat'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 font-medium">Risk Level</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {site.riskLevel || 'Low'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-[#1e293b] text-center text-xs">
        <div className="bg-[#090e18] p-3 rounded border border-[#1e293b]">
          <div className="text-xs text-slate-400 font-medium">Analysis Radius</div>
          <div className="font-bold text-slate-200 mt-1">10 km</div>
        </div>
        <div className="bg-[#090e18] p-3 rounded border border-[#1e293b]">
          <div className="text-xs text-slate-400 font-medium">Candidates Evaluated</div>
          <div className="font-bold text-slate-200 mt-1">276</div>
        </div>
        <div className="bg-[#090e18] p-3 rounded border border-[#1e293b]">
          <div className="text-xs text-slate-400 font-medium">Datasets Used</div>
          <div className="font-bold text-blue-400 mt-1">3</div>
        </div>
      </div>
    </div>
  );
}
