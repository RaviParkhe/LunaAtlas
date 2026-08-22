import React from 'react';
import { Radar, BarChart2 } from 'lucide-react';

export default function ChartsPanel({ site }) {
  // Factor comparison metrics for radar chart
  const factors = [
    { label: 'Terrain', value: site?.metrics?.flatness || 92 },
    { label: 'Sunlight', value: site?.metrics?.sunlight || 91 },
    { label: 'Water Ice', value: site?.metrics?.waterIce || 95 },
    { label: 'Radiation', value: site?.metrics?.radiation || 89 },
    { label: 'Expansion', value: site?.metrics?.expansion || 94 },
    { label: 'Safety', value: site?.metrics?.landingZone || 93 },
  ];

  // Helper to calculate radar polygon points
  const radius = 55;
  const cx = 100;
  const cy = 95;
  const total = factors.length;

  const getCoordinates = (index, valuePercent) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (radius * valuePercent) / 100;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = factors
    .map((f, i) => {
      const { x, y } = getCoordinates(i, f.value);
      return `${x},${y}`;
    })
    .join(' ');

  // Distribution chart data
  const distributionData = [
    { range: '0-20', count: 12, height: '15%' },
    { range: '20-40', count: 28, height: '30%' },
    { range: '40-60', count: 64, height: '55%' },
    { range: '60-80', count: 110, height: '78%' },
    { range: '80-100', count: 175, height: '98%' },
  ];

  return (
    <div className="w-80 min-w-[320px] flex flex-col gap-6">
      {/* FACTOR COMPARISON (Radar / Spider Chart) */}
      <div className="glass-panel p-6 flex flex-col justify-between bg-[#0d1322]">
        <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3 mb-3">
          <Radar className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            FACTOR COMPARISON
          </h2>
        </div>

        <div className="w-full h-56 relative flex items-center justify-center py-2">
          <svg viewBox="0 0 200 190" className="w-full h-full">
            {/* Background Web Rings */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((ringLevel, rIdx) => {
              const ringPoints = factors
                .map((_, i) => {
                  const { x, y } = getCoordinates(i, ringLevel * 100);
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={rIdx}
                  points={ringPoints}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axis Lines from Center */}
            {factors.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Factor Polygon - Solid Muted Blue */}
            <polygon
              points={polygonPoints}
              fill="rgba(37, 99, 235, 0.25)"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Node Points */}
            {factors.map((f, i) => {
              const { x, y } = getCoordinates(i, f.value);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Labels */}
            {factors.map((f, i) => {
              const { x, y } = getCoordinates(i, 124);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {f.label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* SUITABILITY SCORE DISTRIBUTION (Histogram) */}
      <div className="glass-panel p-6 flex flex-col justify-between bg-[#0d1322]">
        <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3 mb-3">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            SUITABILITY SCORE DISTRIBUTION
          </h2>
        </div>

        <div className="h-56 flex flex-col justify-end pt-3">
          {/* Y Axis Reference Grid */}
          <div className="relative flex-1 flex items-end justify-between px-2 pb-2 border-b border-[#1e293b]">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-500 font-medium">
              <div className="border-b border-[#1e293b] w-full pt-1">175</div>
              <div className="border-b border-[#1e293b] w-full">50</div>
              <div className="border-b border-[#1e293b] w-full">25</div>
              <div>0</div>
            </div>

            {/* Bars - Solid Blue */}
            <div className="w-full h-full flex items-end justify-around z-10 pl-6">
              {distributionData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 group h-full justify-end">
                  <div
                    className="w-7 rounded-t bg-blue-600 group-hover:bg-blue-500 transition-colors"
                    style={{ height: d.height }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-around pt-3 text-xs text-slate-400 font-medium pl-6">
            {distributionData.map((d, i) => (
              <span key={i}>{d.range}</span>
            ))}
          </div>
          <div className="text-center text-xs text-slate-500 font-medium mt-1.5">
            Score Range
          </div>
        </div>
      </div>
    </div>
  );
}
