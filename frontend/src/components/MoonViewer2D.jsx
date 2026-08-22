import React, { useRef, useEffect, useState, useMemo } from 'react';

export default function MoonViewer2D({
  gridData,
  activeLayer = 'overall_score',
  namedSites = [],
  selectedSite,
  onSelectSite,
  radiusKm = 10
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Transform state: zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCoord, setHoveredCoord] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle dynamic container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Scientific Colormap Interpolator with Smooth NASA Palettes
  const interpolateColor = (val, min, max, layer) => {
    const range = max - min || 1;
    const t = Math.max(0, Math.min(1, (val - min) / range));

    if (layer === 'sunlight_score') {
      // NASA Illumination: Deep Shadow (0%) -> Amber -> Peak Gold
      if (t < 0.25) {
        const k = t / 0.25;
        return [Math.floor(k * 120), Math.floor(k * 50), 5, 255];
      } else if (t < 0.65) {
        const k = (t - 0.25) / 0.4;
        return [120 + Math.floor(k * 115), 50 + Math.floor(k * 130), 5 + Math.floor(k * 20), 255];
      } else {
        const k = (t - 0.65) / 0.35;
        return [235 + Math.floor(k * 20), 180 + Math.floor(k * 70), 25 + Math.floor(k * 200), 255];
      }
    } else if (layer === 'ice_score') {
      // PSR Water Ice: Dark Obsidian (0) -> Deep Cobalt -> Cyan -> Ice White
      if (t < 0.15) {
        const k = t / 0.15;
        return [10 + Math.floor(k * 10), 16 + Math.floor(k * 25), 30 + Math.floor(k * 50), 255];
      } else if (t < 0.6) {
        const k = (t - 0.15) / 0.45;
        return [20 + Math.floor(k * 0), 41 + Math.floor(k * 170), 80 + Math.floor(k * 163), 255];
      } else {
        const k = (t - 0.6) / 0.4;
        return [20 + Math.floor(k * 220), 211 + Math.floor(k * 44), 243 + Math.floor(k * 12), 255];
      }
    } else if (layer === 'slope_deg') {
      // Lunar Slope Hazard Gradient: 0-5 deg (Emerald), 5-10 deg (Yellow), 10-15 deg (Orange), >15 deg (Red)
      if (val <= 5) {
        const k = val / 5;
        return [16 + Math.floor(k * 30), 185 - Math.floor(k * 20), 129 - Math.floor(k * 40), 255];
      } else if (val <= 10) {
        const k = (val - 5) / 5;
        return [46 + Math.floor(k * 188), 165 + Math.floor(k * 14), 89 - Math.floor(k * 81), 255];
      } else if (val <= 15) {
        const k = (val - 10) / 5;
        return [234 + Math.floor(k * 15), 179 - Math.floor(k * 64), 8 + Math.floor(k * 14), 255];
      } else {
        const k = Math.min(1, (val - 15) / 15);
        return [249 - Math.floor(k * 10), 115 - Math.floor(k * 47), 22 + Math.floor(k * 46), 255];
      }
    } else if (layer === 'elevation_m') {
      // LOLA DEM Topography: Deep Crater (-5445m) -> Green -> Yellow -> Brown -> Peak (+6980m)
      if (t < 0.25) {
        const k = t / 0.25;
        return [15 + Math.floor(k * 15), 30 + Math.floor(k * 60), 100 + Math.floor(k * 90), 255];
      } else if (t < 0.5) {
        const k = (t - 0.25) / 0.25;
        return [30 + Math.floor(k * 10), 90 + Math.floor(k * 90), 190 - Math.floor(k * 110), 255];
      } else if (t < 0.75) {
        const k = (t - 0.5) / 0.25;
        return [40 + Math.floor(k * 180), 180 + Math.floor(k * 30), 80 - Math.floor(k * 70), 255];
      } else {
        const k = (t - 0.75) / 0.25;
        return [220 + Math.floor(k * 35), 210 + Math.floor(k * 45), 10 + Math.floor(k * 245), 255];
      }
    } else if (layer === 'radiation_safety_score') {
      const r = Math.floor(t * 139);
      const g = Math.floor(t * 180);
      const b = Math.floor(90 + t * 165);
      return [r, g, b, 255];
    } else {
      // Composite Suitability Score (Turbo-inspired smooth NASA GIS palette)
      if (t < 0.25) {
        const k = t / 0.25;
        return [10 + Math.floor(k * 10), 20 + Math.floor(k * 35), 45 + Math.floor(k * 80), 255];
      } else if (t < 0.5) {
        const k = (t - 0.25) / 0.25;
        return [20 + Math.floor(k * 0), 55 + Math.floor(k * 125), 125 + Math.floor(k * 115), 255];
      } else if (t < 0.75) {
        const k = (t - 0.5) / 0.25;
        return [20 + Math.floor(k * 20), 180 - Math.floor(k * 15), 240 - Math.floor(k * 110), 255];
      } else {
        const k = (t - 0.75) / 0.25;
        return [40 + Math.floor(k * 205), 165 + Math.floor(k * 50), 130 - Math.floor(k * 120), 255];
      }
    }
  };

  // Pre-render the single high-resolution Master Scientific Matrix with Hillshade
  const offscreenBuffer = useMemo(() => {
    if (!gridData || !gridData.grid || gridData.grid.length === 0) return null;
    const grid = gridData.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    const buffer = document.createElement('canvas');
    buffer.width = cols;
    buffer.height = rows;
    const bctx = buffer.getContext('2d');
    const imgData = bctx.createImageData(cols, rows);
    const data = imgData.data;

    const minVal = gridData.min ?? 0;
    const maxVal = gridData.max ?? 100;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];

        // 1. Base scientific color
        const [baseR, baseG, baseB] = interpolateColor(val, minVal, maxVal, activeLayer);

        // 2. Compute local gradient hillshade relief (3D crater rim lighting)
        const left = c > 0 ? grid[r][c - 1] : val;
        const right = c < cols - 1 ? grid[r][c + 1] : val;
        const top = r > 0 ? grid[r - 1][c] : val;
        const bottom = r < rows - 1 ? grid[r + 1][c] : val;

        const dx = (right - left) / (maxVal - minVal || 1);
        const dy = (bottom - top) / (maxVal - minVal || 1);

        // Sun coming from North-West azimuth (-45 deg)
        const hillshade = Math.max(0.65, Math.min(1.35, 1.0 - (dx * 0.7 - dy * 0.7)));

        const finalR = Math.min(255, Math.floor(baseR * hillshade));
        const finalG = Math.min(255, Math.floor(baseG * hillshade));
        const finalB = Math.min(255, Math.floor(baseB * hillshade));

        const idx = (r * cols + c) * 4;
        data[idx] = finalR;
        data[idx + 1] = finalG;
        data[idx + 2] = finalB;
        data[idx + 3] = 255;
      }
    }

    bctx.putImageData(imgData, 0, 0);
    return buffer;
  }, [gridData, activeLayer]);

  // Main Canvas Render (Single Unified Master Grid)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, width, height);

    // Deep space background
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    // Compute Map Bounds: Perfectly fits container with nice tactical padding
    const mapSize = Math.min(width, height) * 0.94;
    const mapX = (width - mapSize) / 2;
    const mapY = (height - mapSize) / 2;

    // Apply Transformation Matrix (Pan & Zoom)
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // 1. Draw Deep Space Celestial Polar Grid Lines
    ctx.strokeStyle = 'rgba(0, 218, 243, 0.12)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 6 / zoom]);

    const centerX = mapX + mapSize / 2;
    const centerY = mapY + mapSize / 2;

    // Polar latitude concentric rings (80°S, 82°S, 84°S, 86°S, 88°S, 90°S)
    for (let i = 1; i <= 6; i++) {
      const r = (mapSize / 2) * (i / 6);
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Polar azimuth spoke lines every 45 degrees
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(rad) * (mapSize * 0.8), centerY + Math.sin(rad) * (mapSize * 0.8));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Draw Master NASA LOLA/LROC 400x400 Scientific Map
    if (offscreenBuffer) {
      // Glow border around South Pole 400km exploration zone
      ctx.shadowColor = 'rgba(0, 218, 243, 0.4)';
      ctx.shadowBlur = 20 / zoom;
      ctx.drawImage(offscreenBuffer, mapX, mapY, mapSize, mapSize);
      ctx.shadowBlur = 0;

      // Outer tactical frame border
      ctx.strokeStyle = '#00daf3';
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeRect(mapX, mapY, mapSize, mapSize);

      // Coordinate corner tick marks
      const tickLen = 12 / zoom;
      ctx.lineWidth = 2 / zoom;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(mapX, mapY + tickLen);
      ctx.lineTo(mapX, mapY);
      ctx.lineTo(mapX + tickLen, mapY);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(mapX + mapSize - tickLen, mapY);
      ctx.lineTo(mapX + mapSize, mapY);
      ctx.lineTo(mapX + mapSize, mapY + tickLen);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(mapX, mapY + mapSize - tickLen);
      ctx.lineTo(mapX, mapY + mapSize);
      ctx.lineTo(mapX + tickLen, mapY + mapSize);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(mapX + mapSize - tickLen, mapY + mapSize);
      ctx.lineTo(mapX + mapSize, mapY + mapSize);
      ctx.lineTo(mapX + mapSize, mapY + mapSize - tickLen);
      ctx.stroke();
    }

    // 3. Center Crosshair (South Pole: 90°S)
    ctx.strokeStyle = 'rgba(0, 218, 243, 0.5)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([3 / zoom, 3 / zoom]);
    ctx.beginPath();
    ctx.moveTo(centerX, mapY - 40 / zoom);
    ctx.lineTo(centerX, mapY + mapSize + 40 / zoom);
    ctx.moveTo(mapX - 40 / zoom, centerY);
    ctx.lineTo(mapX + mapSize + 40 / zoom, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Tactical Candidate Site Markers (Unique, Real 6 Candidate Sites)
    if (namedSites && namedSites.length > 0) {
      namedSites.forEach((site) => {
        const sx = mapX + (site.grid_col / 400) * mapSize;
        const sy = mapY + (site.grid_row / 400) * mapSize;
        const isSelected = selectedSite && selectedSite.name === site.name;
        const isRank1 = site.rank === 1;

        // A. Touchdown Radius Ring
        const ringRadius = 14 / zoom;
        ctx.beginPath();
        ctx.arc(sx, sy, ringRadius, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected
          ? 'rgba(0, 218, 243, 0.35)'
          : isRank1
          ? 'rgba(245, 158, 11, 0.35)'
          : 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#00daf3' : isRank1 ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = (isSelected ? 2.5 : 1.5) / zoom;
        ctx.stroke();

        // B. Center Core Pin
        ctx.beginPath();
        ctx.arc(sx, sy, 4 / zoom, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? '#ffffff' : isRank1 ? '#f59e0b' : '#00daf3';
        ctx.fill();

        // C. Tactical Holographic Label Card
        const labelText = `#${site.rank} ${site.name.split(' ')[0]}`;
        ctx.font = `bold ${Math.max(10, 11 / Math.sqrt(zoom))}px "JetBrains Mono", monospace`;
        const textWidth = ctx.measureText(labelText).width;
        const padX = 6 / zoom;
        const padY = 3 / zoom;
        const boxW = textWidth + padX * 2;
        const boxH = 16 / zoom;
        const boxX = sx - boxW / 2;
        const boxY = sy - ringRadius - boxH - (4 / zoom);

        ctx.fillStyle = isSelected ? 'rgba(0, 31, 36, 0.95)' : 'rgba(9, 14, 24, 0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = isSelected ? '#00daf3' : isRank1 ? '#f59e0b' : 'rgba(59, 73, 76, 0.9)';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = isSelected ? '#00daf3' : '#dee2f1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, sx, boxY + boxH / 2);
      });
    }

    ctx.restore();
  }, [offscreenBuffer, zoom, pan, namedSites, selectedSite, dimensions]);

  // Smooth Drag & Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    // Real-time Coordinate sampling
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const { width, height } = dimensions;
    const mapSize = Math.min(width, height) * 0.94;
    const mapX = (width - mapSize) / 2;
    const mapY = (height - mapSize) / 2;

    const transformedX = (clientX - (width / 2 + pan.x)) / zoom + width / 2;
    const transformedY = (clientY - (height / 2 + pan.y)) / zoom + height / 2;

    const col = Math.floor(((transformedX - mapX) / mapSize) * 400);
    const row = Math.floor(((transformedY - mapY) / mapSize) * 400);

    if (col >= 0 && col < 400 && row >= 0 && row < 400) {
      const xMeters = (col - 200) * 1000;
      const yMeters = (200 - row) * 1000;
      const distFromPoleMeters = Math.sqrt(xMeters * xMeters + yMeters * yMeters);
      const lat = -90 + (distFromPoleMeters / 1737400) * (180 / Math.PI);
      const lon = (Math.atan2(xMeters, -yMeters) * 180) / Math.PI;

      setHoveredCoord({
        lat: lat.toFixed(2),
        lon: lon.toFixed(2),
        col,
        row
      });
    } else {
      setHoveredCoord(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cursor-Centered Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.86;
    const newZoom = Math.max(0.6, Math.min(20.0, zoom * zoomFactor));

    const { width, height } = dimensions;
    const wx = (mouseX - (width / 2 + pan.x)) / zoom;
    const wy = (mouseY - (height / 2 + pan.y)) / zoom;

    const newPanX = mouseX - width / 2 - wx * newZoom;
    const newPanY = mouseY - height / 2 - wy * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Click on site to select
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !namedSites) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const { width, height } = dimensions;
    const mapSize = Math.min(width, height) * 0.94;
    const mapX = (width - mapSize) / 2;
    const mapY = (height - mapSize) / 2;

    const transformedX = (clientX - (width / 2 + pan.x)) / zoom + width / 2;
    const transformedY = (clientY - (height / 2 + pan.y)) / zoom + height / 2;

    namedSites.forEach((site) => {
      const sx = mapX + (site.grid_col / 400) * mapSize;
      const sy = mapY + (site.grid_row / 400) * mapSize;
      const dist = Math.hypot(transformedX - sx, transformedY - sy);
      if (dist < 22 / zoom) {
        onSelectSite && onSelectSite(site);
      }
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#080c16] select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
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

      {/* Real-time Pointer Coordinate HUD */}
      {hoveredCoord && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-[#090e18]/90 backdrop-blur border border-[#3b494c]/60 px-3.5 py-1.5 rounded flex items-center gap-2 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00daf3] animate-pulse"></span>
          <span className="font-data-mono text-xs text-[#dee2f1]">
            LAT: {hoveredCoord.lat}°S LON: {hoveredCoord.lon}°E [{hoveredCoord.col}, {hoveredCoord.row}]
          </span>
        </div>
      )}

      {/* Zoom HUD & Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 pointer-events-auto">
        <div className="bg-[#090e18]/90 backdrop-blur border border-[#3b494c]/60 px-2 py-1 rounded text-center font-data-mono text-[10px] text-[#00daf3] font-bold mb-1 shadow-md">
          {zoom.toFixed(1)}x
        </div>
        <button
          onClick={() => {
            const newZoom = Math.min(20.0, zoom * 1.3);
            setZoom(newZoom);
          }}
          className="w-8 h-8 bg-[#252a35]/90 hover:bg-[#303540] backdrop-blur border border-[#3b494c]/60 rounded flex items-center justify-center text-[#dee2f1] hover:text-[#00daf3] transition-colors cursor-pointer shadow-md"
          title="Zoom In"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(0.6, zoom * 0.77);
            setZoom(newZoom);
          }}
          className="w-8 h-8 bg-[#252a35]/90 hover:bg-[#303540] backdrop-blur border border-[#3b494c]/60 rounded flex items-center justify-center text-[#dee2f1] hover:text-[#00daf3] transition-colors cursor-pointer shadow-md"
          title="Zoom Out"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-[#252a35]/90 hover:bg-[#303540] backdrop-blur border border-[#3b494c]/60 rounded flex items-center justify-center text-[#dee2f1] hover:text-[#00daf3] transition-colors cursor-pointer shadow-md mt-1"
          title="Reset Center & Zoom"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
        </button>
      </div>
    </div>
  );
}
