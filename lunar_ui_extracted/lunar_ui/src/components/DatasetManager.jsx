import React, { useState } from 'react';
import { Database, HardDrive, RefreshCw, Upload, CheckCircle, FileCode, Layers, Search, Filter } from 'lucide-react';

export default function DatasetManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const datasets = [
    {
      id: 'lola-dem',
      name: 'LOLA DEM (Lunar Orbiter Laser Altimeter)',
      category: 'Topography & Elevation',
      provider: 'NASA LRO Mission',
      resolution: '5m / pixel',
      coverage: 'Global / South Pole Focus',
      status: 'Active & Synced',
      size: '1.4 TB',
      lastUpdate: '2025-05-01'
    },
    {
      id: 'lro-lamp',
      name: 'LRO LAMP Far-UV Albedo Maps',
      category: 'Volatiles & Water Ice',
      provider: 'NASA / SwRI',
      resolution: '10m / pixel',
      coverage: 'Permanently Shadowed Regions',
      status: 'Active & Synced',
      size: '850 GB',
      lastUpdate: '2025-04-28'
    },
    {
      id: 'chandrayaan-m3',
      name: 'Chandrayaan-1 M3 Spectrometer',
      category: 'Mineralogy & Hydration',
      provider: 'ISRO / NASA JPL',
      resolution: '20m / pixel',
      coverage: 'South Pole (-80° to -90°)',
      status: 'Active & Synced',
      size: '620 GB',
      lastUpdate: '2025-04-15'
    },
    {
      id: 'kaguya-tc',
      name: 'Kaguya Terrain Camera DEM',
      category: 'High-Res Optical Mapping',
      provider: 'JAXA Kaguya',
      resolution: '10m / pixel',
      coverage: 'Global Lunar Surface',
      status: 'Cached',
      size: '1.1 TB',
      lastUpdate: '2025-03-30'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-orbitron text-white">
              DATASET MANAGER
            </h2>
            <p className="text-xs text-slate-400">
              Manage lunar topography, spectrometry, and thermal imagery datasets for AI analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 rounded-lg bg-[#0b101d] text-xs font-medium text-slate-300 hover:text-white border border-slate-700/70 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Repositories</span>
          </button>

          <button className="btn-primary py-2 px-4 text-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Dataset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search datasets by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="custom-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Active Datasets: <strong className="text-cyan-400">3</strong></span>
          <span>•</span>
          <span>Total Storage: <strong className="text-slate-200">3.97 TB</strong></span>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredDatasets.map((dataset) => (
          <div
            key={dataset.id}
            className="glass-panel p-5 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    {dataset.category}
                  </span>
                  <h3 className="text-sm font-bold font-orbitron text-white mt-0.5">
                    {dataset.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {dataset.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono mt-4 pt-3 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">Provider</span>
                  <span className="text-slate-200 font-medium">{dataset.provider}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Spatial Resolution</span>
                  <span className="text-slate-200 font-medium">{dataset.resolution}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Coverage</span>
                  <span className="text-slate-200 font-medium">{dataset.coverage}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Data Size</span>
                  <span className="text-cyan-400 font-medium">{dataset.size}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500">
                Last updated: {dataset.lastUpdate}
              </span>
              <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-all">
                Configure Layers &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
