import React, { useState, useEffect } from 'react';
import { Database, HardDrive, RefreshCw, Upload, CheckCircle, FileCode, Layers, Search, Filter, FileText, Download, ExternalLink, ShieldCheck, AlertTriangle, ChevronRight, Info } from 'lucide-react';

export default function DatasetManager() {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'datasets'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportsData, setReportsData] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8050/api/reports/datasets')
      .then(res => res.json())
      .then(data => {
        if (data.reports) {
          setReportsData(data.reports);
          if (data.reports.length > 0) {
            setSelectedReportId(data.reports[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to load dataset reports:', err));
  }, []);

  const datasets = [
    {
      id: 'lola-dem',
      name: 'LOLA DEM (Lunar Orbiter Laser Altimeter)',
      filename: 'LDEM_80S_80MPP_ADJ.tiff',
      category: 'Topography & Elevation',
      provider: 'NASA LRO Mission · Goddard PGDA',
      resolution: '80m / pixel (resampled)',
      coverage: 'South Pole (80°S - 90°S)',
      status: 'Active & Synced',
      size: '181 MB',
      lastUpdate: '2026-08-21',
      reportId: 'ldem-80s',
      pdfUrl: '/dataset-reports/LDEM report demo.pdf'
    },
    {
      id: 'robbins-craters',
      name: 'Robbins Lunar Crater Database v1',
      filename: 'lunar_crater_database_robbins_2018.csv',
      category: 'Crater Geomorphology & Hazard',
      provider: 'USGS Astrogeology Science Center',
      resolution: 'Complete to ~1–2 km crater dia',
      coverage: 'Global & South Pole Focus',
      status: 'Active & Synced',
      size: '93 MB',
      lastUpdate: '2026-08-21',
      reportId: 'robbins-craters',
      pdfUrl: '/dataset-reports/dataset_reports.html'
    },
    {
      id: 'avgvisib-lbl',
      name: 'LOLA Multi-Year Solar Illumination Model',
      filename: 'AVGVISIB_75S_120M_201608.LBL / .IMG',
      category: 'Solar Energy & Illumination',
      provider: 'NASA LRO LOLA Team (MIT PDS Node)',
      resolution: '120m / pixel',
      coverage: '75°S to South Pole',
      status: 'Active & Synced',
      size: '111 MB',
      lastUpdate: '2026-08-21',
      reportId: 'avgvisib-lbl',
      pdfUrl: '/dataset-reports/dataset_reports.html'
    },
    {
      id: 'lro-lend-ice',
      name: 'LRO LEND Epithermal Neutron Flux (Ice Proxy)',
      filename: 'LEND_Epithermal_Neutrons_Polar.npz',
      category: 'Volatiles & Water Ice Cold Traps',
      provider: 'NASA / IKI Roscosmos / SwRI',
      resolution: '500m / pixel',
      coverage: 'Permanently Shadowed Regions (PSR)',
      status: 'Active & Synced',
      size: '42 MB',
      lastUpdate: '2026-08-20',
      reportId: 'ldem-80s',
      pdfUrl: '/dataset-reports/dataset_reports.html'
    }
  ];

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedReport = reportsData.find(r => r.id === selectedReportId) || reportsData[0];

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 select-none bg-[var(--bg-dark)] text-[var(--text-primary)] font-sans transition-colors duration-200">
      {/* Header Bar */}
      <div className="p-5 flex items-center justify-between border border-[var(--border-color)] rounded-[18px] bg-[var(--bg-card)] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] uppercase">
                Dataset Manager & Provenance Reports
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--apple-parchment)] text-[#0066cc] border border-[var(--border-color)]">
                PDS4 VERIFIED
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Scientific provenance, technical specifications, and processing pipeline audit for all ingested lunar datasets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Apple Segmented Pill Navigation */}
          <div className="flex items-center p-1 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)]">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'reports'
                  ? 'bg-[#0066cc] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Technical Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('datasets')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'datasets'
                  ? 'bg-[#0066cc] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dataset Grid ({datasets.length})</span>
            </button>
          </div>

          <a
            href="http://127.0.0.1:8050/dataset-reports/LDEM report demo.pdf"
            target="_blank"
            rel="noreferrer"
            className="apple-btn-secondary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Official PDF</span>
          </a>
        </div>
      </div>

      {activeTab === 'reports' ? (
        /* TECHNICAL DATASET REPORTS TAB */
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: List of Report Files */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">
              Provenance Dossiers ({reportsData.length})
            </div>

            <div className="space-y-2.5">
              {reportsData.map((report) => {
                const isSelected = selectedReportId === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-4 rounded-[18px] border transition-all cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-[var(--apple-parchment)] border-[#0066cc] shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[220px]">
                        {report.filename}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 text-emerald-600 border border-emerald-500/20">
                        {report.badge}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                      {report.subtitle}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-3 pt-2.5 border-t border-[var(--border-color)]">
                      <span>{report.provenance?.publisher}</span>
                      <span className="text-[#0066cc] font-medium">{report.provenance?.file_size}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Scientific Report View */}
          <div className="col-span-12 lg:col-span-8">
            {selectedReport ? (
              <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm space-y-6">
                {/* Dossier Header */}
                <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-[#0066cc]" />
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {selectedReport.filename}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {selectedReport.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedReport.pdf_url && (
                      <a
                        href={`http://127.0.0.1:8050${selectedReport.pdf_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="apple-btn-primary"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Document</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 1. Provenance Details */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-[#0066cc] uppercase tracking-wider">
                    Provenance & Origin
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[var(--apple-parchment)] p-4 rounded-[14px] border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Publisher</span>
                      <span className="text-[var(--text-primary)] font-medium">{selectedReport.provenance?.publisher}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Instrument</span>
                      <span className="text-[var(--text-primary)] font-medium">{selectedReport.provenance?.instrument}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">File Size</span>
                      <span className="text-[#0066cc] font-medium">{selectedReport.provenance?.file_size}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Accessed On</span>
                      <span className="text-[var(--text-secondary)] font-mono">{selectedReport.provenance?.accessed_on}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[var(--text-muted)] text-[10px] block">License & Citation</span>
                      <span className="text-[var(--text-secondary)]">{selectedReport.provenance?.license}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Technical Specifications */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-[#0066cc] uppercase tracking-wider">
                    Technical Specifications
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[var(--apple-parchment)] p-4 rounded-[14px] border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Coverage</span>
                      <span className="text-[var(--text-primary)] font-medium">{selectedReport.specifications?.coverage}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Native Resolution</span>
                      <span className="text-[var(--text-primary)] font-medium">{selectedReport.specifications?.native_resolution}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Format</span>
                      <span className="text-[var(--text-primary)] font-mono">{selectedReport.specifications?.format}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-[var(--text-muted)] text-[10px] block">Coordinate System (CRS)</span>
                      <span className="text-[var(--text-secondary)] font-mono text-[11px]">{selectedReport.specifications?.coordinate_system}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Processing Pipeline */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-[#0066cc] uppercase tracking-wider">
                    Ingestion & Processing Pipeline
                  </div>
                  <div className="space-y-2">
                    {selectedReport.pipeline?.map((step, idx) => (
                      <div key={idx} className="p-3 rounded-[12px] bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-start gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-[var(--text-secondary)] leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Validation Checks & Limitations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Validation */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-emerald-600 text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Validation Audit</span>
                    </div>
                    <div className="space-y-2">
                      {selectedReport.validation?.map((v, idx) => (
                        <div key={idx} className="p-2.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/20 text-xs text-[var(--text-secondary)] flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{v.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limitations */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-amber-600 text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Known Limitations</span>
                    </div>
                    <div className="space-y-2">
                      {selectedReport.limitations?.map((lim, idx) => (
                        <div key={idx} className="p-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--text-secondary)] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{lim}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[var(--text-muted)] text-xs">
                Select a dataset dossier on the left to inspect detailed specifications.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DATASET REPOSITORIES GRID TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search datasets by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="apple-input pl-10"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Active Repositories: <strong className="text-[var(--text-primary)]">{datasets.length}</strong></span>
              <span>•</span>
              <span>Total Cached: <strong className="text-[var(--text-primary)]">427 MB</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] hover:border-[var(--border-active)] transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#0066cc] uppercase tracking-wider">
                        {dataset.category}
                      </span>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                        {dataset.name}
                      </h3>
                      <span className="text-xs text-[var(--text-secondary)] block mt-0.5 font-mono">
                        File: {dataset.filename}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {dataset.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mt-4 pt-3 border-t border-[var(--border-color)]">
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Provider</span>
                      <span className="text-[var(--text-primary)] font-medium">{dataset.provider}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Spatial Resolution</span>
                      <span className="text-[var(--text-primary)] font-medium">{dataset.resolution}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Coverage</span>
                      <span className="text-[var(--text-primary)] font-medium">{dataset.coverage}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Data Size</span>
                      <span className="text-[#0066cc] font-medium">{dataset.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Last updated: {dataset.lastUpdate}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReportId(dataset.reportId);
                      setActiveTab('reports');
                    }}
                    className="apple-btn-secondary py-1 px-3 text-xs"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
