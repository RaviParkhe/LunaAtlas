import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Layers, Eye, MapPin, ShieldAlert, RotateCcw, Sliders, Moon } from 'lucide-react';
import SpaceWeatherBadge from './SpaceWeatherBadge';

export default function MoonExplorer({
  sites = [],
  selectedSite,
  onSelectSite,
  gridHeatmap,
  activeLayerId = 'real_terrain',
  onSelectLayer
}) {
  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 400 });

  // Heatmap overlay opacity (0 to 1) - default 0.85
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.80);

  // Zoom & Pan state for 2D mode
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSite, setHoveredSite] = useState(null);

  const layersConfig = [
    { id: 'real_terrain', label: '🌕 Real Terrain', unit: '' },
    { id: 'landing_suitability_score', label: 'Landing Suitability', unit: 'score' },
    { id: 'sunlight_score', label: 'Sunlight', unit: '%' },
    { id: 'ice_score', label: 'Ice Proxy', unit: '%' },
    { id: 'slope_deg', label: 'Slope', unit: '°' },
    { id: 'elevation_m', label: 'Elevation', unit: 'm' },
    { id: 'radiation_safety_score', label: 'Radiation', unit: 'score' },
  ];

  const activeLayerObj = layersConfig.find((l) => l.id === activeLayerId) || layersConfig[0];
  const isRealTerrainOnly = activeLayerId === 'real_terrain';

  const [satelliteImageLoaded, setSatelliteImageLoaded] = useState(false);

  // Pre-load High-Resolution Real Optical South Pole Terrain Image
  const satelliteImage = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const img = new Image();
    img.onload = () => setSatelliteImageLoaded(true);
    img.src = '/textures/south_pole_real_optical.jpg';
    if (img.complete) setSatelliteImageLoaded(true);
    return img;
  }, []);

  // Update canvas dimensions dynamically to fill container with zero letterboxing
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
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

  // Interpolate continuous float color based on active layer
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
      // Authentic Radiation Model Colormap (RdYlGn: Red [worst/exposed] -> Yellow -> Green [best/shielded])
      if (t < 0.25) {
        const u = t / 0.25;
        return [Math.floor(180 + u * (235 - 180)), Math.floor(20 + u * (100 - 20)), Math.floor(30 + u * (40 - 30))];
      } else if (t < 0.5) {
        const u = (t - 0.25) / 0.25;
        return [Math.floor(235 + u * (250 - 235)), Math.floor(100 + u * (210 - 100)), Math.floor(40 + u * (70 - 40))];
      } else if (t < 0.75) {
        const u = (t - 0.5) / 0.25;
        return [Math.floor(250 + u * (140 - 250)), Math.floor(210 + u * (210 - 210)), Math.floor(70 + u * (70 - 70))];
      } else {
        const u = (t - 0.75) / 0.25;
        return [Math.floor(140 + u * (20 - 140)), Math.floor(210 + u * (160 - 210)), Math.floor(70 + u * (60 - 70))];
      }
    } else {
      if (t < 0.3) return [15, 23, 42];
      if (t < 0.6) return [14, 116, 144];
      if (t < 0.85) return [16, 185, 129];
      return [245, 158, 11];
    }
  };

  // Pre-render the matrix buffer from live layer data
  const offscreenBuffer = useMemo(() => {
    if (isRealTerrainOnly || !gridHeatmap || !gridHeatmap.grid || gridHeatmap.grid.length === 0) return null;
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

    const alphaByte = Math.round(heatmapOpacity * 255);

    let pIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c] ?? minVal;
        const norm = (val - minVal) / range;
        const [red, grn, blu] = getRGB(norm, activeLayerId);

        data[pIdx] = red;
        data[pIdx + 1] = grn;
        data[pIdx + 2] = blu;
        data[pIdx + 3] = alphaByte;
        pIdx += 4;
      }
    }

    bctx.putImageData(imgData, 0, 0);
    return buffer;
  }, [gridHeatmap, activeLayerId, isRealTerrainOnly, heatmapOpacity]);

  // Main 2D Render Loop (Canvas for all layers including Real Optical Terrain)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvasSize.width;
    const height = canvasSize.height;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    // 1. Render High-Res Real Optical South Pole Terrain Base Layer (full bleed)
    if (satelliteImage && satelliteImage.complete && satelliteImage.naturalWidth > 0) {
      ctx.drawImage(satelliteImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#1e2024';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Render Scientific Heatmap Overlay Matrix (when active)
    if (!isRealTerrainOnly && offscreenBuffer) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreenBuffer, 0, 0, width, height);
    }

    // 3. Polar Latitude Guide Rings & Coordinate Grid
    ctx.strokeStyle = isRealTerrainOnly ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.25)';
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
        ctx.arc(px, py, (isSelected ? 22 : 18) / zoomLevel, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(0, 102, 204, 0.40)' : 'rgba(0, 218, 243, 0.35)';
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
      ctx.lineTo(px + armLen, py);
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
      const fontSize = Math.max(9, 11 / Math.sqrt(zoomLevel));
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const pillPadX = 6 / zoomLevel;
      const pillPadY = 3 / zoomLevel;
      const textY = py - (14 / zoomLevel);

      // Pill Background Box for high contrast readability
      ctx.fillStyle = isSelected
        ? 'rgba(0, 102, 204, 0.95)'
        : isHovered
        ? 'rgba(0, 180, 240, 0.92)'
        : 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(
        px - textWidth / 2 - pillPadX,
        textY - fontSize - pillPadY / 2,
        textWidth + pillPadX * 2,
        fontSize + pillPadY * 2,
        4 / zoomLevel
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
  }, [satelliteImage, satelliteImageLoaded, offscreenBuffer, zoomLevel, panOffset, sites, selectedSite, hoveredSite, activeLayerId, canvasSize, isRealTerrainOnly]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - dragStart.y });
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

    setHoveredPoint({ lat, lon });

    let match = null;
    if (sites) {
      for (const site of sites) {
        const px = ((site.lon + 180) / 360) * canvas.width;
        const py = ((site.lat + 90) / 10) * canvas.height;
        const dist = Math.hypot(transformedX - px, transformedY - py);
        if (dist < 22 / zoomLevel) {
          const gridR = Math.max(0, Math.min(399, Math.floor(normY * 400)));
          const gridC = Math.max(0, Math.min(399, Math.floor(normX * 400)));
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
      if (dist < 28 / zoomLevel) {
        onSelectSite && onSelectSite(site);
      }
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Value formatting helper for active layer in hover card
  const getActiveLayerValue = (site, layerId) => {
    if (!site) return '0.0';
    const raw = site.raw_metrics || {};
    if (layerId === 'real_terrain') {
      return `Elevation: ${site.elevation_m ?? 578}m, Slope: ${site.slope_deg ?? 1.1}°`;
    }
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
      const score = site.radiation_v1?.radiation_score ?? raw.radiation_safety_score ?? 0;
      const dose = site.radiation_v1?.radiation_dose_mSv_per_year ?? 266.5;
      const svf = site.radiation_v1?.svf ?? 0.943;
      return `${Number(score).toFixed(1)} score (${Number(dose).toFixed(1)} mSv/yr, SVF: ${Number(svf).toFixed(3)})`;
    }
    return `${Number(site.overall_score ?? 0).toFixed(1)} score`;
  };

  const isRadiationActive = activeLayerId === 'radiation_safety_score';

  return (
    <div
      ref={containerRef}
      className="p-4 flex flex-col justify-between rounded-[18px] shadow-sm relative select-none transition-colors duration-200 h-full overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Top Header & Layer Selectors */}
      <div
        className="flex items-center justify-between pb-2.5 mb-2 flex-wrap gap-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: 'var(--apple-primary)' }} />
          <h2
            className="text-xs font-semibold tracking-tight uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            2D Polar Heatmap &amp; Decision Space
          </h2>
        </div>

        {/* Primary Layer Selection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {layersConfig.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onSelectLayer && onSelectLayer(layer.id)}
              className="px-2.5 py-1 text-[11px] rounded-full transition-all cursor-pointer"
              style={{
                background: activeLayerId === layer.id ? 'var(--apple-primary)' : 'var(--apple-parchment)',
                color: activeLayerId === layer.id ? '#ffffff' : 'var(--text-secondary)',
                border: activeLayerId === layer.id ? '1px solid var(--apple-primary)' : '1px solid var(--border-color)',
                fontWeight: activeLayerId === layer.id ? 600 : 500
              }}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radiation Model Physics Info Callout (when Radiation is active) */}
      {isRadiationActive && (
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-xl mb-2 gap-2 shrink-0 text-xs"
          style={{ background: 'var(--apple-parchment)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--apple-primary)' }}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Terrain-Shielding Sky View Factor (SVF) Radiation Surrogate Model (Burahmah &amp; Heilbronn 2023 PHITS)</span>
          </div>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' }}
          >
            Solar Minimum (Worst-Case GCR)
          </span>
        </div>
      )}

      {/* Main Full-Bleed Map Viewport Container (Zero letterboxing) */}
      <div
        ref={canvasWrapperRef}
        className="flex-1 min-h-0 relative w-full rounded-[14px] overflow-hidden flex items-center justify-center"
        style={{ border: '1px solid var(--border-color)', background: '#101418' }}
      >
        <div
          className={`w-full h-full relative ${
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
            className="w-full h-full block"
          />

          {/* Hover Tooltip Card */}
          {hoveredSite && (
            <div
              className="absolute z-30 pointer-events-none p-3.5 rounded-2xl border shadow-2xl space-y-1 min-w-[220px] backdrop-blur-md"
              style={{
                left: `${Math.min(canvasSize.width - 240, Math.max(10, hoveredSite.clientX - 60))}px`,
                top: `${Math.max(10, hoveredSite.clientY - 110)}px`,
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                borderColor: '#e2e8f0'
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--apple-primary)' }}>
                <MapPin className="w-4 h-4" />
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

          {/* Floating Coordinates HUD */}
          {hoveredPoint && !hoveredSite && (
            <div
              className="absolute top-2.5 left-2.5 pointer-events-none px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-[10px] font-mono backdrop-blur-md"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--apple-primary)' }}></span>
              <span>{hoveredPoint.lat}°S, {hoveredPoint.lon}°E</span>
            </div>
          )}

          {/* Layer Blend / Opacity Controller (for overlay layers) */}
          {!isRealTerrainOnly && (
            <div
              className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 text-[10px] font-medium backdrop-blur-md"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff'
              }}
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>Overlay: {Math.round(heatmapOpacity * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 cursor-pointer accent-[#0066cc]"
                title="Adjust Heatmap Overlay Opacity over Real Terrain"
              />
            </div>
          )}

          {/* Live Space Weather HUD Badge (Top-Right corner of Moon map) */}
          <SpaceWeatherBadge />

          {/* Reset View Button */}
          {zoomLevel !== 1 && (
            <button
              onClick={resetZoom}
              className="absolute top-2.5 right-48 p-1.5 rounded-full shadow-sm text-xs flex items-center gap-1 backdrop-blur-md cursor-pointer transition-all z-30"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Colorbar / Status Footer */}
      <div
        className="mt-2 pt-2 flex items-center justify-between text-[11px] font-medium shrink-0"
        style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Eye className="w-3.5 h-3.5" style={{ color: 'var(--apple-primary)' }} />
          <span>
            Active View: <strong style={{ color: 'var(--text-primary)' }}>{activeLayerObj.label}</strong>
          </span>
        </div>

        {/* Dynamic Colorbar according to layer */}
        <div className="flex items-center gap-2">
          {isRealTerrainOnly ? (
            <span className="text-[10px] font-mono text-cyan-600 font-semibold flex items-center gap-1">
              <Moon className="w-3 h-3" /> NASA LROC Photorealistic Optical Surface Mosaic
            </span>
          ) : isRadiationActive ? (
            <>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>0 (Exposed / High Dose)</span>
              <div
                className="w-28 md:w-36 h-2 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #b4141e, #ea6428, #f5d246, #8cc846, #14a03c)',
                  border: '1px solid var(--border-color)'
                }}
              />
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>100 (Shielded)</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>0</span>
              <div
                className="w-24 md:w-32 h-2 rounded-full"
                style={{
                  border: '1px solid var(--border-color)',
                  background:
                    activeLayerId === 'sunlight_score'
                      ? 'linear-gradient(to right, #0f172a, #ca8a04, #fef08a)'
                      : activeLayerId === 'ice_score'
                      ? 'linear-gradient(to right, #0f172a, #06b6d4, #a5f3fc)'
                      : activeLayerId === 'slope_deg'
                      ? 'linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444)'
                      : activeLayerId === 'elevation_m'
                      ? 'linear-gradient(to right, #0f1e64, #1e78b4, #c8b428, #f0dcc8)'
                      : 'linear-gradient(to right, #0f172a, #0e7490, #10b981, #f59e0b)'
                }}
              />
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>100 {activeLayerObj.unit}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
