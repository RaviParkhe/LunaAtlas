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
        data[pIdx + 3] = 200;
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
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.35)';
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

      // Outer Target Reticle
      ctx.beginPath();
      ctx.arc(px, py, (isSelected ? 13 : isHovered ? 11 : 9) / zoomLevel, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? '#0066cc' : isHovered ? '#00daf3' : isRank1 ? '#0071e3' : '#ffffff';
      ctx.lineWidth = (isSelected || isHovered ? 2.5 : 1.5) / zoomLevel;
      ctx.stroke();

      // Crosshairs
      const armLen = (isSelected ? 17 : isHovered ? 15 : 12) / zoomLevel;
      ctx.beginPath();
      ctx.moveTo(px - armLen, py);
      ctx.lineTo(px + armLen, py);
      ctx.moveTo(px, py - armLen);
      ctx.lineTo(px, py + armLen);
      ctx.strokeStyle = isSelected ? '#0066cc' : isHovered ? '#00daf3' : '#ffffff';
      ctx.lineWidth = 1.2 / zoomLevel;
      ctx.stroke();

      // Label Text
      ctx.font = `600 ${Math.max(9.5, 11 / Math.sqrt(zoomLevel))}px -apple-system, sans-serif`;
      ctx.fillStyle = isSelected ? '#0066cc' : isHovered ? '#00daf3' : '#ffffff';
      ctx.textAlign = 'center';
      const label = `#${site.rank ?? 1} ${site.name.split(' ')[0]}`;
      ctx.fillText(label, px, py - (14 / zoomLevel));
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

    // Check if hovering directly over any candidate site reticle
    let match = null;
    if (sites && sites.length > 0) {
      for (const site of sites) {
        const px = ((site.lon + 180) / 360) * canvas.width;
        const py = ((site.lat + 90) / 10) * canvas.height;
        const dist = Math.hypot(transformedX - px, transformedY - py);
        if (dist < 22 / zoomLevel) {
          const gridC = Math.floor(((site.lon + 180) / 360) * 400);
          const gridR = Math.floor(((site.lat + 90) / 10) * 400);
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
      if (dist < 22 / zoomLevel) {
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
      return `${Number(val).toFixed(1)}% confidence`;
    }
    if (layerId === 'slope_deg') {
      const val = site.slope_deg ?? 1.1;
      return `${Number(val).toFixed(1)}° slope`;
    }
    if (layerId === 'elevation_m') {
      const val = site.elevation_m ?? 578;
      return `${Number(val).toFixed(0)} m`;
    }
    if (layerId === 'radiation_safety_score') {
      const val = raw.radiation_safety_score ?? site.metrics?.radiation ?? 0;
      return `${Number(val).toFixed(1)} score`;
    }
    return `${Number(site.overall_score || 0).toFixed(1)} score`;
  };

  // Continuous gradient style for the legend bar
  const getLegendGradientStyle = (layerId) => {
    if (layerId === 'sunlight_score') {
      return 'linear-gradient(to right, #090e18, #f59e0b, #fef08a)';
    }
    if (layerId === 'ice_score') {
      return 'linear-gradient(to right, #090e18, #06b6d4, #38bdf8)';
    }
    if (layerId === 'slope_deg') {
      return 'linear-gradient(to right, #10b981, #eab308, #ef4444)';
    }
    if (layerId === 'elevation_m') {
      return 'linear-gradient(to right, #0f1e64, #1e78b4, #c8b428, #f0dcc8)';
    }
    if (layerId === 'radiation_safety_score') {
      return 'linear-gradient(to right, #0f172a, #8b5cf6, #c084fc)';
    }
    return 'linear-gradient(to right, #0f172a, #0e7490, #10b981, #f59e0b)';
  };

  return (
    <div className="p-5 flex flex-col justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] shadow-sm select-none transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] text-[#0066cc]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-semibold tracking-tight text-[var(--text-secondary)] uppercase">
            NASA LROC South Pole 2D Heatmap (80°S - 90°S)
          </h3>
        </div>

        {/* Satellite Base Toggle + Layer Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowSatelliteBase(!showSatelliteBase)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
              showSatelliteBase
                ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-sm'
                : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle NASA Satellite Mosaic Base Layer"
          >
            <Eye className="w-3 h-3" />
            <span>Satellite</span>
          </button>

          <div className="flex items-center gap-1 overflow-x-auto">
            {layersConfig.map((l) => (
              <button
                key={l.id}
                onClick={() => onSelectLayer && onSelectLayer(l.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                  activeLayerId === l.id
                    ? 'bg-[#0066cc] text-white shadow-sm'
                    : 'bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2D Canvas Viewport */}
      <div className="w-full h-[420px] bg-[#000000] rounded-[14px] relative overflow-hidden flex items-center justify-center border border-[var(--border-color)] shadow-inner">
        <div
          className={`w-full h-full relative flex items-center justify-center ${
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

          {/* Interactive Site Hover Tooltip Card */}
          {hoveredSite && (
            <div
              className="absolute z-20 pointer-events-none p-3 rounded-[14px] bg-[var(--bg-card)]/95 backdrop-blur-md border border-[#0066cc] shadow-2xl space-y-1 min-w-[190px] transition-all"
              style={{
                left: `${Math.min(210, Math.max(10, hoveredSite.clientX + 14))}px`,
                top: `${Math.min(310, Math.max(10, hoveredSite.clientY - 45))}px`
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0066cc]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hoveredSite.site.name}</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                Grid: [{hoveredSite.gridCol}, {hoveredSite.gridRow}]
              </div>
              <div className="text-xs pt-1.5 border-t border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-medium text-[var(--text-muted)] block">
                  {activeLayerObj.label}:
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {getActiveLayerValue(hoveredSite.site, activeLayerId)}
                </span>
              </div>
            </div>
          )}

          {/* Hover Coordinate HUD (when not hovering on specific site) */}
          {hoveredPoint && !hoveredSite && (
            <div className="absolute top-3 left-3 pointer-events-none bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-pulse"></span>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {hoveredPoint.lat}°S, {hoveredPoint.lon}°E [{hoveredPoint.col}, {hoveredPoint.row}]
              </span>
            </div>
          )}

          {/* 2D Zoom Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-auto">
            <button
              onClick={() => setZoomLevel((z) => Math.min(15.0, z * 1.25))}
              className="w-7 h-7 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95 shadow-sm"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z * 0.8))}
              className="w-7 h-7 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95 shadow-sm"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="w-7 h-7 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95 shadow-sm mt-1"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Gradient Legend Bar */}
      <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">0</span>
          <div
            className="flex-1 h-2 rounded-full border border-[var(--border-color)]"
            style={{ background: getLegendGradientStyle(activeLayerId) }}
          />
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            {activeLayerId === 'elevation_m' ? '5000m' : activeLayerId === 'slope_deg' ? '30°' : '100'} {activeLayerObj.unit}
          </span>
        </div>

        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {activeLayerObj.label}
        </span>
      </div>
    </div>
  );
}
