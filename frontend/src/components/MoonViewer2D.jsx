import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Eye, Compass, Maximize2 } from 'lucide-react';

export default function MoonViewer2D({
  gridData,
  activeLayer,
  namedSites,
  selectedSite,
  onSelectSite,
  radiusKm = 10
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredInfo, setHoveredInfo] = useState(null);

  // Color mapping functions
  const getColorForVal = (val, layer) => {
    // Normalization [0, 100]
    const norm = Math.max(0, Math.min(100, val)) / 100;
    
    if (layer === 'sunlight' || layer === 'sunlight_score') {
      // Shaded relief with high illumination highlights
      const c = Math.floor(norm * 255);
      return [c, Math.floor(c * 0.95), Math.floor(c * 0.7), 255];
    } else if (layer === 'ice' || layer === 'ice_score') {
      // Deep blues to bright cyan ice cold-traps
      const b = Math.floor(norm * 255);
      return [Math.floor(b * 0.1), Math.floor(b * 0.7), b, 255];
    } else if (layer === 'slope' || layer === 'slope_deg') {
      // Slope: 0-5 deg (green), 5-10 deg (yellow), 10-15 deg (orange), >15 deg (red)
      if (val < 5) return [16, 185, 129, 255]; // Emerald
      if (val < 10) return [234, 179, 8, 255]; // Yellow
      if (val < 15) return [249, 115, 22, 255]; // Orange
      return [239, 68, 68, 255]; // Red
    } else if (layer === 'radiation' || layer === 'radiation_safety_score') {
      // Radiation shielding: dark purple to bright cyan
      return [Math.floor(139 * norm), Math.floor(92 * norm), Math.floor(246 * norm), 255];
    } else {
      // Default: Composite Lunar Suitability (Dark Navy -> Cyan -> Green -> Gold)
      if (norm < 0.25) return [15, 23, 42, 255];
      if (norm < 0.5) return [14, 116, 144, 255];
      if (norm < 0.75) return [16, 185, 129, 255];
      return [245, 158, 11, 255]; // Gold
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // Draw background cratered lunar surface simulation or real matrix
    if (gridData && gridData.grid && gridData.grid.length > 0) {
      const grid = gridData.grid;
      const rows = grid.length;
      const cols = grid[0].length;
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        const gridY = Math.floor((y / height) * rows);
        for (let x = 0; x < width; x++) {
          const gridX = Math.floor((x / width) * cols);
          const val = grid[gridY] ? grid[gridY][gridX] || 0 : 0;
          const [r, g, b, a] = getColorForVal(val, activeLayer);
          const pIdx = (y * width + x) * 4;
          data[pIdx] = r;
          data[pIdx + 1] = g;
          data[pIdx + 2] = b;
          data[pIdx + 3] = a;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } else {
      // Fallback shaded lunar crater pattern
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, width, height);

      // Draw concentric polar coordinate grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let r = 50; r <= 200; r += 50) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Draw Polar Center Marker
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Named Sites Markers
    if (namedSites && namedSites.length > 0) {
      namedSites.forEach((site) => {
        // Convert row/col [0, 400] to canvas [0, width]
        const sx = (site.grid_col / 400) * width;
        const sy = (site.grid_row / 400) * height;
        const isSelected = selectedSite && selectedSite.name === site.name;
        const isRank1 = site.rank === 1;

        // Radius circle for analysis
        if (isSelected) {
          ctx.beginPath();
          const rPx = (radiusKm / 400) * width;
          ctx.arc(sx, sy, Math.max(12, rPx), 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.fill();
        }

        // Pin Glow
        ctx.beginPath();
        ctx.arc(sx, sy, isSelected ? 8 : 6, 0, 2 * Math.PI);
        ctx.fillStyle = isRank1 
          ? '#3b82f6' 
          : isSelected 
          ? '#10b981' 
          : site.rank <= 3 
          ? '#f59e0b' 
          : '#64748b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label Badge
        ctx.fillStyle = '#0d1527';
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#1e293b';
        ctx.lineWidth = 1;
        
        const labelText = `#${site.rank} ${site.name.split(' ')[0]}`;
        ctx.font = '10px JetBrains Mono';
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillRect(sx - textWidth / 2 - 4, sy - 22, textWidth + 8, 14);
        ctx.strokeRect(sx - textWidth / 2 - 4, sy - 22, textWidth + 8, 14);
        
        ctx.fillStyle = isRank1 ? '#60a5fa' : '#e2e8f0';
        ctx.fillText(labelText, sx - textWidth / 2, sy - 11);
      });
    }

    ctx.restore();
  }, [gridData, activeLayer, namedSites, selectedSite, zoom, pan, radiusKm]);

  // Mouse handlers for pan & click selection
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    
    // Calculate canvas grid coordinate
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const invX = (cx - rect.width / 2 - pan.x) / zoom + rect.width / 2;
    const invY = (cy - rect.height / 2 - pan.y) / zoom + rect.height / 2;
    const gridCol = Math.max(0, Math.min(399, Math.floor((invX / rect.width) * 400)));
    const gridRow = Math.max(0, Math.min(399, Math.floor((invY / rect.height) * 400)));

    // Convert to lat/lon approximation for HUD
    const halfExtent = 200; // km
    const xKm = (gridCol / 400) * 400 - halfExtent;
    const yKm = halfExtent - (gridRow / 400) * 400;
    const distFromPoleKm = Math.sqrt(xKm * xKm + yKm * yKm);
    const approxLat = -(90 - (distFromPoleKm / 1737.4) * (180 / Math.PI));
    const approxLon = (Math.atan2(xKm, -yKm) * 180) / Math.PI;

    setHoveredInfo({
      lat: approxLat.toFixed(2),
      lon: approxLon.toFixed(2),
      row: gridRow,
      col: gridCol
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasClick = (e) => {
    if (!namedSites || namedSites.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const invX = (cx - rect.width / 2 - pan.x) / zoom + rect.width / 2;
    const invY = (cy - rect.height / 2 - pan.y) / zoom + rect.height / 2;

    // Check if clicked near any site
    let clickedSite = null;
    let minDistance = 20; // px threshold

    namedSites.forEach((site) => {
      const sx = (site.grid_col / 400) * rect.width;
      const sy = (site.grid_row / 400) * rect.height;
      const dist = Math.sqrt((invX - sx) ** 2 + (invY - sy) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        clickedSite = site;
      }
    });

    if (clickedSite && onSelectSite) {
      onSelectSite(clickedSite);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#050811] rounded-lg overflow-hidden border border-[#1a2744]">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair object-contain"
      />

      {/* Floating HUD Coordinates */}
      {hoveredInfo && (
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-[#0d1527]/90 border border-[#1a2744] text-[10px] text-cyan-300 font-mono flex items-center space-x-2 pointer-events-none shadow-md">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>LAT: {hoveredInfo.lat}°S</span>
          <span>LON: {hoveredInfo.lon}°E</span>
          <span className="text-slate-500">[{hoveredInfo.col}, {hoveredInfo.row}]</span>
        </div>
      )}

      {/* Zoom / Reset Controls */}
      <div className="absolute right-3 bottom-12 flex flex-col space-y-1.5 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.3))}
          className="w-7 h-7 bg-[#0d1527]/90 hover:bg-[#1a2744] text-slate-300 rounded border border-[#1a2744] flex items-center justify-center text-xs transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.3))}
          className="w-7 h-7 bg-[#0d1527]/90 hover:bg-[#1a2744] text-slate-300 rounded border border-[#1a2744] flex items-center justify-center text-xs transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-7 h-7 bg-[#0d1527]/90 hover:bg-[#1a2744] text-slate-300 rounded border border-[#1a2744] flex items-center justify-center text-xs transition"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Elevation / Slope Scale Legend Bar (Bottom Left) */}
      <div className="absolute bottom-2 left-2 px-3 py-1.5 rounded bg-[#0d1527]/90 border border-[#1a2744] text-[10px] text-slate-300 flex flex-col space-y-1 shadow-md">
        <span className="font-semibold text-[9px] uppercase tracking-wider text-slate-400">
          {activeLayer.toUpperCase()} COLOR GRADIENT
        </span>
        <div className="w-36 h-2 rounded bg-gradient-to-r from-slate-900 via-emerald-500 to-amber-400 border border-slate-700" />
        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
          <span>0 (Low)</span>
          <span>50</span>
          <span>100 (Max)</span>
        </div>
      </div>

      {/* Scale Bar (Bottom Right) */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#0d1527]/90 border border-[#1a2744] text-[9px] text-slate-400 font-mono flex items-center space-x-1 shadow-md">
        <div className="w-8 h-1 bg-cyan-400 border-x border-white" />
        <span>50 km</span>
      </div>
    </div>
  );
}
