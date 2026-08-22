import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Layers, Plus, Minus, RotateCcw, Eye } from 'lucide-react';

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

  const layersConfig = [
    { id: 'landing_suitability_score', label: 'Landing Safety' },
    { id: 'sunlight_score', label: 'Sunlight' },
    { id: 'ice_score', label: 'Water Ice' },
    { id: 'slope_deg', label: 'Slope' },
    { id: 'elevation_m', label: 'Elevation' },
    { id: 'radiation_safety_score', label: 'Radiation' },
  ];

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
      const isRank1 = site.rank === 1;

      const px = ((site.lon + 180) / 360) * width;
      const py = ((site.lat + 90) / 10) * height;

      // Outer Target Reticle
      ctx.beginPath();
      ctx.arc(px, py, (isSelected ? 13 : 9) / zoomLevel, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? '#0066cc' : isRank1 ? '#0071e3' : '#ffffff';
      ctx.lineWidth = (isSelected ? 2.5 : 1.5) / zoomLevel;
      ctx.stroke();

      // Crosshairs
      const armLen = (isSelected ? 17 : 12) / zoomLevel;
      ctx.beginPath();
      ctx.moveTo(px - armLen, py);
      ctx.lineTo(px + armLen, py);
      ctx.moveTo(px, py - armLen);
      ctx.lineTo(px, py + armLen);
      ctx.strokeStyle = isSelected ? '#0066cc' : '#ffffff';
      ctx.lineWidth = 1.2 / zoomLevel;
      ctx.stroke();

      // Label Text
      ctx.font = `600 ${Math.max(9.5, 11 / Math.sqrt(zoomLevel))}px -apple-system, sans-serif`;
      ctx.fillStyle = isSelected ? '#0066cc' : '#ffffff';
      ctx.textAlign = 'center';
      const label = `#${site.rank ?? 1} ${site.name.split(' ')[0]}`;
      ctx.fillText(label, px, py - (14 / zoomLevel));
    });

    ctx.restore();
  }, [showSatelliteBase, satelliteImage, offscreenBuffer, zoomLevel, panOffset, sites, selectedSite]);

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
      if (dist < 20 / zoomLevel) {
        onSelectSite && onSelectSite(site);
      }
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
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
          className="w-full h-full relative cursor-grab active:cursor-grabbing flex items-center justify-center"
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

          {/* Hover Coordinate HUD */}
          {hoveredPoint && (
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
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
