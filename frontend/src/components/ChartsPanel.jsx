import React from 'react';
import { Radar } from 'lucide-react';

export default function ChartsPanel({ site, sites = [] }) {
  const raw = site?.raw_metrics || {};

  // Real-time factor comparison metrics for radar chart from active site XAI telemetry
  const factors = [
    {
      label: 'Terrain',
      value: Math.round(raw.landing_suitability_score ?? site?.metrics?.flatness ?? 75)
    },
    {
      label: 'Sunlight',
      value: Math.round(raw.sunlight_score ?? site?.metrics?.sunlight ?? 50)
    },
    {
      label: 'Water Ice',
      value: Math.round(raw.water_ice_score ?? site?.metrics?.waterIce ?? 35)
    },
    {
      label: 'Radiation',
      value: Math.round(raw.radiation_safety_score ?? site?.metrics?.radiation ?? 60)
    },
    {
      label: 'Expansion',
      value: Math.round(100 - (raw.dust_risk_score ?? 45))
    },
    {
      label: 'Safety',
      value: Math.round(raw.best_nearby_landing_score ?? site?.metrics?.landingZone ?? 85)
    }
  ];

  // Helper to calculate radar polygon points
  const radius = 62;
  const cx = 100;
  const cy = 100;
  const total = factors.length;

  const getCoordinates = (index, valuePercent) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (radius * Math.max(10, Math.min(100, valuePercent))) / 100;
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

  return (
    <div className="w-80 min-w-[320px] flex flex-col gap-4">
      {/* FACTOR COMPARISON (Radar / Spider Chart) */}
      <div className="p-5 flex flex-col justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-[#0066cc]" />
            <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
              Factor Comparison
            </h2>
          </div>
          <span className="text-xs font-medium text-[#0066cc] truncate max-w-[120px]">
            {site?.name || 'Selected Site'}
          </span>
        </div>

        <div className="w-full h-60 relative flex items-center justify-center py-1">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background Web Rings */}
            {[0.25, 0.5, 0.75, 1.0].map((ringLevel, rIdx) => {
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
                  stroke="var(--border-color)"
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
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Factor Polygon */}
            <polygon
              points={polygonPoints}
              fill="rgba(0, 102, 204, 0.22)"
              stroke="#0066cc"
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
                  fill="#0066cc"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Labels */}
            {factors.map((f, i) => {
              const { x, y } = getCoordinates(i, 126);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill="var(--text-secondary)"
                  fontSize="8.5"
                  fontWeight="500"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {f.label} ({f.value}%)
                </text>
              );
            })}
          </svg>
        </div>

        {/* Live Factor Metric Badges */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)] text-xs">
          {factors.map((f, idx) => (
            <div key={idx} className="bg-[var(--apple-parchment)] p-2 rounded-[10px] border border-[var(--border-color)] flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">{f.label}</span>
              <span className="text-[#0066cc] font-medium">{f.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
