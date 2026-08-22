import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Layers, Plus, Minus, RotateCcw, Eye, MapPin } from 'lucide-react';

export default function MoonExplorer({
  sites = [],
  selectedSite,
  onSelectSite,
  gridHeatmap,
  activeLayerId = 'landing_suitability_score',
  onSelectLayer
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showSatelliteBase, setShowSatelliteBase] = useState(true);

  // Zoom & Pan state for 2D mode
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSite, setHoveredSite] = useState(null);

  const layersConfig = [
    { id: 'landing_suitability_score', label: 'Landing Suitability', unit: 'score' },
    { id: 'sunlight_score', label: 'Sunlight', unit: '%' },
    { id: 'ice_score', label: 'Ice Proxy', unit: '%' },
    { id: 'slope_deg', label: 'Slope', unit: '°' },
    { id: 'elevation_m', label: 'Elevation', unit: 'm' },
    { id: 'radiation_safety_score', label: 'Radiation', unit: 'score' },
  ];

  const activeLayerObj = layersConfig.find((l) => l.id === activeLayerId) || layersConfig[0];

  // Pre-load NASA LROC South Pole Satellite Mosaic Image
  const satelliteImage = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const img = new Image();
    img.src = '/textures/lroc_south_pole_mosaic.jpg';
    return img;
  }, []);

  // Helper to format site labels cleanly without awkward truncation
  const getShortSiteName = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('gerlache')) return 'de Gerlache';
    if (lower.includes('shackleton')) return 'Shackleton';
    if (lower.includes('malapert')) return 'Malapert';
    if (lower.includes('faustini')) return 'Faustini';
    if (lower.includes('haworth')) return 'Haworth';
    if (lower.includes('nobile')) return 'Nobile';
    return name.split(' ')[0];
  };

  // Interpolate continuous float color
  const getRGB = (norm, layerId) => {
    const t = Math.max(0, Math.min(1, norm));
    if (layerId === 'sunlight_score') {
      return [Math.floor(t * 255), Math.floor(t * 210), Math.floor(t * 60)];
    } else if (layerId === 'ice_score') {
      return [Math.floor((1 - t) * 20), Math.floor(t * 218), Math.floor(t * 243)];
    } else if (layerId === 'slope_deg') {
      if (t < 0.25) return [16, 185, 129];
      if (t < 0.5) return [234, 179, 8];
      if (t < 0.75) return [249, 115, 22];
      return [239, 68, 68];
    } else if (layerId === 'elevation_m') {
      if (t < 0.25) return [15, 30, 100];
      if (t < 0.5) return [30, 120, 180];
      if (t < 0.75) return [200, 180, 40];
      return [240, 220, 200];
    } else if (layerId === 'radiation_safety_score') {
      return [Math.floor(15 + t * 140), Math.floor(23 + (1 - t) * 50), Math.floor(42 + t * 200)];
    } else {
      if (t < 0.3) return [15, 23, 42];
      if (t < 0.6) return [14, 116, 144];
      if (t < 0.85) return [16, 185, 129];
      return [245, 158, 11];
    }
  };

  // Pre-render the matrix buffer
  const offscreenBuffer = useMemo(() => {
    if (!gridHeatmap || !gridHeatmap.grid || gridHeatmap.grid.length === 0) return null;
    const grid = gridHeatmap.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    const buffer = document.createElement('canvas');
    buffer.width = cols;
    buffer.height = rows;
    const bctx = buffer.getContext('2d');
    const imgData = bctx.createImageData(cols, rows);
    const data = imgData.data;

    const minVal = gridHeatmap.min ?? 0;
    const maxVal = gridHeatmap.max ?? 100;
    const range = maxVal - minVal || 1;

    let pIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c] ?? minVal;
        const norm = (val - minVal) / range;
        const [red, grn, blu] = getRGB(norm, activeLayerId);

        data[pIdx] = red;
        data[pIdx + 1] = grn;
        data[pIdx + 2] = blu;
        data[pIdx + 3] = 195;
        pIdx += 4;
      }
    }

    bctx.putImageData(imgData, 0, 0);
    return buffer;
  }, [gridHeatmap, activeLayerId]);

  // Main 2D Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    // 1. Render NASA LROC South Pole Satellite Imagery Base Layer
    if (showSatelliteBase && satelliteImage && satelliteImage.complete && satelliteImage.naturalWidth > 0) {
      ctx.drawImage(satelliteImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#151516';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Render Scientific Heatmap Overlay Matrix
    if (offscreenBuffer) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreenBuffer, 0, 0, width, height);
    }

    // 3. Polar Grid Overlay Lines (80°S - 90°S)
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.30)';
    ctx.lineWidth = 1 / zoomLevel;
    ctx.setLineDash([4 / zoomLevel, 6 / zoomLevel]);

    const stepX = width / 8;
    const stepY = height / 8;
    for (let x = stepX; x < width; x += stepX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = stepY; y < height; y += stepY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 4. Candidate Site Markers
    sites && sites.forEach((site) => {
      const isSelected = selectedSite && selectedSite.name === site.name;
      const isHovered = hoveredSite && hoveredSite.site.name === site.name;
      const isRank1 = site.rank === 1;

      const px = ((site.lon + 180) / 360) * width;
      const py = ((site.lat + 90) / 10) * height;

      // Glow Halo on Selection/Hover
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(px, py, (isSelected ? 20 : 16) / zoomLevel, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(0, 102, 204, 0.25)' : 'rgba(0, 218, 243, 0.22)';
        ctx.fill();
      }

      // Outer Target Reticle
      ctx.beginPath();
      ctx.arc(px, py, (isSelected ? 13 : isHovered ? 11 : 9) / zoomLevel, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? '#0066cc' : isHovered ? '#00daf3' : isRank1 ? '#0071e3' : '#ffffff';
      ctx.lineWidth = (isSelected || isHovered ? 2.5 : 1.5) / zoomLevel;
      ctx.stroke();

      // Crosshairs
      const armLen = (isSelected ? 18 : isHovered ? 15 : 12) / zoomLevel;
      ctx.beginPath();
      ctx.moveTo(px - armLen, py);
      ctx.lineTo(px + armLen, py);
      ctx.moveTo(px, py - armLen);
      ctx.lineTo(px, py + armLen);
      ctx.strokeStyle = isSelected ? '#0066cc' : isHovered ? '#00daf3' : '#ffffff';
      ctx.lineWidth = 1.2 / zoomLevel;
      ctx.stroke();

      // Center Core Dot
      ctx.beginPath();
      ctx.arc(px, py, 2.2 / zoomLevel, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#0066cc' : isHovered ? '#00daf3' : '#ffffff';
      ctx.fill();

      // Site Label Badge
      const shortName = getShortSiteName(site.name);
      const labelText = `#${site.rank ?? 1} ${shortName}`;
      const fontSize = Math.max(9, 10.5 / Math.sqrt(zoomLevel));
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const pillPadX = 5 / zoomLevel;
      const pillPadY = 2.5 / zoomLevel;
      const textY = py - (14 / zoomLevel);

      // Pill Background Box for high contrast readability
      ctx.fillStyle = isSelected
        ? 'rgba(0, 102, 204, 0.95)'
        : isHovered
        ? 'rgba(0, 180, 240, 0.92)'
        : 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(
        px - textWidth / 2 - pillPadX,
        textY - fontSize - pillPadY / 2,
        textWidth + pillPadX * 2,
        fontSize + pillPadY * 2,
        3.5 / zoomLevel
      );
      ctx.fill();

      // Pill Border
      ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? '#00daf3' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.8 / zoomLevel;
      ctx.stroke();

      // Text String
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, px, textY);
    });

    ctx.restore();
  }, [showSatelliteBase, satelliteImage, offscreenBuffer, zoomLevel, panOffset, sites, selectedSite, hoveredSite]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const transformedX = (clientX - (canvas.width / 2 + panOffset.x)) / zoomLevel + canvas.width / 2;
    const transformedY = (clientY - (canvas.height / 2 + panOffset.y)) / zoomLevel + canvas.height / 2;

    const normX = Math.max(0, Math.min(1, transformedX / canvas.width));
    const normY = Math.max(0, Math.min(1, transformedY / canvas.height));

    const lat = (-90 + normY * 10).toFixed(2);
    const lon = (-180 + normX * 360).toFixed(2);

    const col = Math.floor(normX * 400);
    const row = Math.floor(normY * 400);

    setHoveredPoint({ lat, lon, col, row });

    // Generous hit-testing radius for all candidate sites
    let match = null;
    if (sites && sites.length > 0) {
      for (const site of sites) {
        const px = ((site.lon + 180) / 360) * canvas.width;
        const py = ((site.lat + 90) / 10) * canvas.height;
        const dist = Math.hypot(transformedX - px, transformedY - py);
        if (dist < 26 / zoomLevel) {
          const gridC = site.grid_col ?? Math.floor(((site.lon + 180) / 360) * 400);
          const gridR = site.grid_row ?? Math.floor(((site.lat + 90) / 10) * 400);
          match = {
            site,
            clientX,
            clientY,
            gridCol: gridC,
            gridRow: gridR
          };
          break;
        }
      }
    }
    setHoveredSite(match);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.18 : 0.85;
    setZoomLevel((prev) => Math.max(0.6, Math.min(18.0, prev * zoomFactor)));
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const transformedX = (clientX - (canvas.width / 2 + panOffset.x)) / zoomLevel + canvas.width / 2;
    const transformedY = (clientY - (canvas.height / 2 + panOffset.y)) / zoomLevel + canvas.height / 2;

    sites && sites.forEach((site) => {
      const px = ((site.lon + 180) / 360) * canvas.width;
      const py = ((site.lat + 90) / 10) * canvas.height;
      const dist = Math.hypot(transformedX - px, transformedY - py);
      if (dist < 26 / zoomLevel) {
        onSelectSite && onSelectSite(site);
      }
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setHoveredSite(null);
  };

  // Value formatting helper for active layer in hover card
  const getActiveLayerValue = (site, layerId) => {
    if (!site) return '0.0';
    const raw = site.raw_metrics || {};
    if (layerId === 'landing_suitability_score') {
      const val = raw.landing_suitability_score ?? site.overall_score ?? site.score ?? 0;
      return `${Number(val).toFixed(1)} score`;
    }
    if (layerId === 'sunlight_score') {
      const val = raw.sunlight_score ?? site.metrics?.sunlight ?? 0;
      return `${Number(val).toFixed(1)}%`;
    }
    if (layerId === 'ice_score') {
      const val = raw.water_ice_score ?? site.ice_confidence?.confidence_pct ?? 0;
      return `${Number(val).toFixed(1)}%`;
    }
    if (layerId === 'slope_deg') {
      return `${Number(site.slope_deg ?? 1.1).toFixed(1)}°`;
    }
    if (layerId === 'elevation_m') {
      return `${Number(site.elevation_m ?? 578).toFixed(0)} m`;
    }
    if (layerId === 'radiation_safety_score') {
      const val = raw.radiation_safety_score ?? site.metrics?.radiation ?? 0;
      return `${Number(val).toFixed(1)} score`;
    }
    return `${Number(site.overall_score ?? 0).toFixed(1)} score`;
  };

  return (
    <div
      ref={containerRef}
      className="p-5 flex flex-col justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm relative select-none transition-colors duration-200"
    >
      {/* Top Header & Layer Selectors */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0066cc]" />
          <h2 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            2D Polar Heatmap & Decision Space
          </h2>
        </div>

        {/* Layer Selection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {layersConfig.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onSelectLayer && onSelectLayer(layer.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer ${
                activeLayerId === layer.id
                  ? 'bg-[#0066cc] text-white shadow-sm font-semibold'
                  : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Interactive Viewport */}
      <div
        className={`relative w-full aspect-square max-h-[420px] mx-auto rounded-[16px] overflow-hidden border border-[var(--border-color)] bg-[#0d1117] flex items-center justify-center ${
          hoveredSite ? 'cursor-pointer' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          className="w-full h-full block"
        />

        {/* Floating Tooltip Card on Site Hover (Exact Apple Card Design) */}
        {hoveredSite && (
          <div
            className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-white/95 text-slate-900 border border-slate-200/90 shadow-2xl space-y-1 min-w-[200px] backdrop-blur-md transition-all duration-75"
            style={{
              left: `${Math.min(220, Math.max(10, hoveredSite.clientX - 60))}px`,
              top: `${Math.max(10, hoveredSite.clientY - 110)}px`
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0066cc]">
              <MapPin className="w-4 h-4 fill-[#0066cc]/10 text-[#0066cc]" />
              <span>{hoveredSite.site.name}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Grid: [{hoveredSite.gridCol}, {hoveredSite.gridRow}]
            </div>
            <div className="border-t border-slate-200/80 my-1.5" />
            <div className="space-y-0.5">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {activeLayerObj.label}:
              </div>
              <div className="text-sm font-bold text-slate-950 font-mono">
                {getActiveLayerValue(hoveredSite.site, activeLayerId)}
              </div>
            </div>
          </div>
        )}

        {/* Coordinates HUD Indicator */}
        {hoveredPoint && !hoveredSite && (
          <div className="absolute top-3 left-3 pointer-events-none bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-[10px] text-[var(--text-secondary)] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-pulse"></span>
            <span>{hoveredPoint.lat}°S, {hoveredPoint.lon}°E</span>
          </div>
        )}
      </div>

      {/* Continuous Gradient Colorbar Legend */}
      <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <Eye className="w-3.5 h-3.5 text-[#0066cc]" />
          <span>Layer: <strong className="text-[var(--text-primary)]">{activeLayerObj.label}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">0</span>
          <div
            className="w-24 md:w-32 h-2 rounded-full border border-[var(--border-color)]"
            style={{
              background:
                activeLayerId === 'sunlight_score'
                  ? 'linear-gradient(to right, #0f172a, #ca8a04, #fef08a)'
                  : activeLayerId === 'ice_score'
                  ? 'linear-gradient(to right, #0f172a, #06b6d4, #a5f3fc)'
                  : activeLayerId === 'slope_deg'
                  ? 'linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444)'
                  : activeLayerId === 'elevation_m'
                  ? 'linear-gradient(to right, #0f1e64, #1e78b4, #c8b428, #f0dcc8)'
                  : activeLayerId === 'radiation_safety_score'
                  ? 'linear-gradient(to right, #0f172a, #3b82f6, #93c5fd)'
                  : 'linear-gradient(to right, #0f172a, #0e7490, #10b981, #f59e0b)'
            }}
          />
          <span className="text-[10px] font-mono text-[var(--text-muted)]">100 {activeLayerObj.unit}</span>
        </div>
      </div>
    </div>
  );
}
