import React from 'react';
import { ShieldAlert, CheckCircle, Home, Zap, Users, Maximize, Clock, Cpu } from 'lucide-react';

export default function RiskAndRecommendation({ site }) {
  const strengths = [
    'Stable and relatively flat terrain',
    'High solar illumination (>90%)',
    'High water ice probability',
    'Low radiation exposure',
    'Large expansion capability'
  ];

  const weaknesses = [
    'Moderate lunar dust accumulation',
    'Communication blackout during eclipse',
    'Extreme temperature variations'
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Risk Assessment Box */}
      <div className="col-span-5 glass-panel p-5 flex flex-col justify-between bg-[#0d1322]">
        <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3 mb-4">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            RISK ASSESSMENT
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs flex-1">
          {/* Strengths Column */}
          <div className="bg-[#090e18] rounded-lg p-4 border border-[#1e293b] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-wider block mb-3">
                STRENGTHS
              </span>
              <ul className="space-y-2">
                {strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-[11px] leading-snug">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Weaknesses Column */}
          <div className="bg-[#090e18] rounded-lg p-4 border border-[#1e293b] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-3">
                WEAKNESSES
              </span>
              <ul className="space-y-2">
                {weaknesses.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-[11px] leading-snug">
                    <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Habitat Recommendation Box */}
      <div className="col-span-7 glass-panel p-5 flex flex-col justify-between bg-[#0d1322]">
        <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3 mb-4">
          <Home className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            HABITAT RECOMMENDATION
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs flex-1">
          <div className="bg-[#090e18] rounded-lg p-3.5 border border-[#1e293b] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Recommended Habitat Type</div>
              <div className="font-semibold text-slate-100 mt-0.5 leading-snug">Permanent Modular In-Situ Habitat</div>
            </div>
          </div>

          <div className="bg-[#090e18] rounded-lg p-3.5 border border-[#1e293b] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Energy Strategy</div>
              <div className="font-semibold text-slate-100 mt-0.5 leading-snug">Hybrid (Solar + Nuclear)</div>
            </div>
          </div>

          <div className="bg-[#090e18] rounded-lg p-3.5 border border-[#1e293b] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Estimated Crew Capacity</div>
              <div className="font-semibold text-slate-100 mt-0.5 leading-snug">20 - 50 Astronauts</div>
            </div>
          </div>

          <div className="bg-[#090e18] rounded-lg p-3.5 border border-[#1e293b] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Maximize className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Expansion Potential</div>
              <div className="font-semibold text-slate-100 mt-0.5 leading-snug">Excellent (300+ hectares)</div>
            </div>
          </div>

          <div className="bg-[#090e1a] rounded-lg p-3.5 border border-[#1e293b] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Mission Duration</div>
              <div className="font-semibold text-slate-100 mt-0.5 leading-snug">Permanent Settlement</div>
            </div>
          </div>

          <div className="bg-[#090e18] rounded-lg p-3.5 border border-[#1e293b] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Infrastructure Score</div>
              <div className="font-bold text-blue-400 mt-0.5 font-mono text-sm">92%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
