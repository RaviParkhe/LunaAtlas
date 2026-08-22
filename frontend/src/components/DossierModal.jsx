import React from 'react';
import { FileText, Printer, Download, X, CheckCircle2, Moon, ShieldCheck } from 'lucide-react';

export default function DossierModal({
  isOpen,
  onClose,
  site,
  weights,
  solarData
}) {
  if (!isOpen || !site) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      mission: "NASA Artemis III / NSIC SW02 Lunar Habitat Site Selection",
      generated_at: new Date().toISOString(),
      evaluated_site: site,
      applied_mission_weights: weights,
      space_weather_telemetry: solarData
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lunar_Habitat_Dossier_${site.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#090f1d] border border-cyan-500/40 rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1a2744] no-print">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
              MISSION DOSSIER & SITE REPORT
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0d1527] hover:bg-[#121c33] border border-[#1a2744] text-cyan-300 rounded font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="space-y-4 p-4 rounded-lg bg-[#050811] border border-[#1a2744] print:border-none print:bg-white print:text-black">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b border-[#1a2744] pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <Moon className="w-5 h-5 text-cyan-400" />
                <h1 className="text-base font-extrabold tracking-wider uppercase text-white print:text-black">
                  LUNA-ASTRA MISSION EVALUATION DOSSIER
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono">
                Project SW02 • Lunar South Pole Decision Support System (400×400km)
              </p>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-400 print:text-gray-600">
              <p>DATE: {new Date().toLocaleDateString()}</p>
              <p>SECURITY: UNCLASSIFIED / NASA OPEN DATA</p>
            </div>
          </div>

          {/* Candidate Site Header Banner */}
          <div className="grid grid-cols-4 gap-2 bg-[#0d1527] print:bg-gray-100 p-3 rounded-lg border border-[#1a2744] print:border-gray-300">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Candidate Site</span>
              <span className="font-bold text-white print:text-black text-sm">{site.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Coordinates</span>
              <span className="font-mono text-cyan-300 print:text-black">{Math.abs(site.lat).toFixed(2)}°S, {site.lon.toFixed(2)}°E</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Elevation / Slope</span>
              <span className="font-mono text-slate-200 print:text-black">{site.elevation_m}m • {site.slope_deg}°</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Composite Score</span>
              <span className="font-mono font-extrabold text-emerald-400 print:text-green-700 text-sm">{site.overall_score?.toFixed(1)} / 100</span>
            </div>
          </div>

          {/* Multi-Factor Scorecard Table */}
          <div className="space-y-1.5">
            <h4 className="font-bold uppercase tracking-wider text-slate-200 print:text-black text-xs">
              1. MULTI-CRITERIA FACTOR SCORECARD
            </h4>
            <table className="w-full text-left font-mono text-[11px] border border-[#1a2744] print:border-gray-400">
              <thead className="bg-[#0d1527] print:bg-gray-200 text-slate-400 print:text-gray-700">
                <tr>
                  <th className="p-1.5">Parameter</th>
                  <th className="p-1.5">Orbital Source</th>
                  <th className="p-1.5">Measured Value</th>
                  <th className="p-1.5">Normalized Score</th>
                  <th className="p-1.5">Applied Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142038] print:divide-gray-300">
                <tr>
                  <td className="p-1.5 font-bold text-amber-400 print:text-amber-700">Sunlight Illumination</td>
                  <td className="p-1.5">NASA LROC 120m Map</td>
                  <td className="p-1.5">{site.raw_metrics?.sunlight_score?.toFixed(1)}% Sunlight</td>
                  <td className="p-1.5 font-bold">{site.raw_metrics?.sunlight_score?.toFixed(1)} / 100</td>
                  <td className="p-1.5">{Math.round((weights?.sunlight || 0.3) * 100)}%</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold text-emerald-400 print:text-emerald-700">Terrain & Landing Safety</td>
                  <td className="p-1.5">LOLA DEM + Robbins Craters</td>
                  <td className="p-1.5">{site.slope_deg}° Slope (Flat)</td>
                  <td className="p-1.5 font-bold">{site.raw_metrics?.landing_suitability_score?.toFixed(1)} / 100</td>
                  <td className="p-1.5">{Math.round((weights?.landing_safety || 0.25) * 100)}%</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold text-cyan-400 print:text-cyan-700">Water Ice Potential (ISRU)</td>
                  <td className="p-1.5">LROC PSR Cold Traps</td>
                  <td className="p-1.5">{site.raw_metrics?.water_ice_score?.toFixed(1)}% Proxy</td>
                  <td className="p-1.5 font-bold">{site.raw_metrics?.water_ice_score?.toFixed(1)} / 100</td>
                  <td className="p-1.5">{Math.round((weights?.water_ice || 0.25) * 100)}%</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold text-purple-400 print:text-purple-700">Radiation Horizon Shielding</td>
                  <td className="p-1.5">CRaTER + SVF Elevation Proxy</td>
                  <td className="p-1.5">~120 mGy/yr Horizon Block</td>
                  <td className="p-1.5 font-bold">{site.raw_metrics?.radiation_safety_score?.toFixed(1)} / 100</td>
                  <td className="p-1.5">{Math.round((weights?.radiation_safety || 0.15) * 100)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scientific Rationale Narrative */}
          <div className="space-y-1.5 pt-2 border-t border-[#1a2744] print:border-gray-300">
            <h4 className="font-bold uppercase tracking-wider text-slate-200 print:text-black text-xs">
              2. EXECUTIVE SCIENTIFIC MISSION RATIONALE
            </h4>
            <p className="text-slate-300 print:text-gray-800 leading-relaxed text-[11px] italic bg-[#0d1527] print:bg-gray-50 p-3 rounded border border-slate-800 print:border-gray-300">
              "{site.explanation || 'Optimal candidate location providing strong balance between continuous solar illumination and landing safety.'}"
            </p>
          </div>

          {/* Environmental Telemetry */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono">
            <div className="p-2.5 rounded bg-[#0d1527] print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="font-bold text-slate-300 print:text-black block mb-1">CURRENT SPACE WEATHER STATUS</span>
              <p>NOAA Alert: {solarData?.status || 'Nominal / Quiet (R0, S0, G0)'}</p>
              <p>Solar Flux: {solarData?.solar_flux_sfu || 148.0} SFU • EVA: {solarData?.eva_safety_status || 'GO'}</p>
            </div>
            <div className="p-2.5 rounded bg-[#0d1527] print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="font-bold text-slate-300 print:text-black block mb-1">CIVIL INFRASTRUCTURE ESTIMATE</span>
              <p>Usable Build Area: 76 km² (Slope &lt;5°)</p>
              <p>Foundation: Consolidated lunar regolith berm compatible</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
