import React from 'react';
import { Layers, Sun, Droplets, Shield, TrendingUp, Anchor, Cpu } from 'lucide-react';

export default function ExplainableAI({ site }) {
  const metrics = [
    {
      label: 'Terrain (Flatness)',
      value: site?.metrics?.flatness || 92,
      status: 'Excellent',
      icon: Layers,
      color: 'bg-emerald-600'
    },
    {
      label: 'Sunlight Availability',
      value: site?.metrics?.sunlight || 91,
      status: 'Excellent',
      icon: Sun,
      color: 'bg-blue-600'
    },
    {
      label: 'Water Ice Probability',
      value: site?.metrics?.waterIce || 95,
      status: 'Excellent',
      icon: Droplets,
      color: 'bg-blue-600'
    },
    {
      label: 'Radiation Exposure',
      value: site?.metrics?.radiation || 89,
      status: 'Safe',
      icon: Shield,
      color: 'bg-blue-600'
    },
    {
      label: 'Expansion Potential',
      value: site?.metrics?.expansion || 94,
      status: 'Excellent',
      icon: TrendingUp,
      color: 'bg-emerald-600'
    },
    {
      label: 'Safe Landing Zone',
      value: site?.metrics?.landingZone || 93,
      status: 'Excellent',
      icon: Anchor,
      color: 'bg-emerald-600'
    }
  ];

  return (
    <div className="glass-panel p-5 bg-[#0d1322]">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            EXPLAINABLE AI – WHY THIS SITE?
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-[#090e18] rounded-lg p-3.5 border border-[#1e293b] flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-bold font-mono text-slate-100">
                  {m.value}%
                </span>
              </div>

              <div className="text-xs font-medium text-slate-300 truncate my-2" title={m.label}>
                {m.label}
              </div>

              {/* Progress bar - Solid Color */}
              <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${m.color}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>

              <div className="text-center">
                <span
                  className={`inline-block w-full py-0.5 text-[10px] font-semibold rounded ${
                    m.status === 'Safe' ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
