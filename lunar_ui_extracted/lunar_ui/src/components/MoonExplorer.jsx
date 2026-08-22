import React, { useRef, useEffect, useState } from 'react';
import { LAYERS_CONFIG, getGridMatrix, getHeatmapRGB, getPointLatLon } from '../data/lunarDataLoader';
import { Target, Layers, MapPin, Plus, Minus, RotateCcw, Hash, Compass } from 'lucide-react';

export default function MoonExplorer({ sites, selectedSite, onSelectSite }) {
  const canvasRef = useRef(null);
  const [activeLayerId, setActiveLayerId] = useState('landing_suitability_score');
  
  // Zoom & Pan state for deep inspection
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [hoveredPoint, setHoveredPoint] = useState(null);

  const activeLayer = LAYERS_CONFIG.find(l => l.id === activeLayerId) || LAYERS_CONFIG[0];

  // Draw Heatmap matrix canvas & site markers with Zoom & Pan transform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const matrix = getGridMatrix(activeLayerId);
    if (!matrix || !matrix.length) return;

    const numRows = matrix.length; // 400
    const numCols = matrix[0].length; // 400

    const width = canvas.width;
    const height = canvas.height;

    // Create offscreen buffer for 400x400 grid
    const imgData = ctx.createImageData(numCols, numRows);
    const data = imgData.data;

    const layerMin = activeLayer.min;
    const layerMax = activeLayer.max;
    const range = layerMax - layerMin || 1;

    let pIdx = 0;
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        let val = matrix[r][c];
        if (val === null || val === undefined || isNaN(val)) {
          val = layerMin;
        }

        let norm = (val - layerMin) / range;
        if (activeLayer.invertColor) {
          norm = 1 - norm;
        }

        const { r: red, g: green, b: blue } = getHeatmapRGB(norm);

        data[pIdx] = red;
        data[pIdx + 1] = green;
        data[pIdx + 2] = blue;
        data[pIdx + 3] = 255;
        pIdx += 4;
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = numCols;
    tempCanvas.height = numRows;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Apply Zoom & Pan Transformations
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    // Draw Grid overlay lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 / zoomLevel;
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

    // Draw Named Site Target Crosshair Markers
    sites.forEach((site) => {
      const isSelected = selectedSite && selectedSite.name === site.name;
      
      const cx = (site.col / numCols) * width;
      const cy = (site.row / numRows) * height;

      const markerScale = Math.max(0.6, 1 / Math.sqrt(zoomLevel));

      if (isSelected) {
        // Glowing target ring for active selected site — warm lunar amber
        ctx.beginPath();
        ctx.arc(cx, cy, 14 * markerScale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 200, 66, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#f5c842';
        ctx.lineWidth = 2 * markerScale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 8 * markerScale, 0, Math.PI * 2);
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.5 * markerScale;
        ctx.stroke();
      }

      // Target Crosshair Ring
      ctx.beginPath();
      ctx.arc(cx, cy, 7 * markerScale, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#f5c842' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5 * markerScale;
      ctx.stroke();

      // Crosshair lines (+)
      ctx.beginPath();
      ctx.moveTo(cx - 10 * markerScale, cy);
      ctx.lineTo(cx + 10 * markerScale, cy);
      ctx.moveTo(cx, cy - 10 * markerScale);
      ctx.lineTo(cx, cy + 10 * markerScale);
      ctx.strokeStyle = isSelected ? '#f5c842' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1 * markerScale;
      ctx.stroke();

      // Center Dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5 * markerScale, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#f5c842' : '#ffffff';
      ctx.fill();
    });

    ctx.restore();
  }, [activeLayerId, sites, selectedSite, zoomLevel, panOffset]);

  // Handle Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }, []);

  // Convert mouse screen event coordinates to matrix [row, col]
  const screenToGridCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { row: 0, col: 0, x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Inverse transform zoom and pan
    const transformedX = (x - panOffset.x) / zoomLevel;
    const transformedY = (y - panOffset.y) / zoomLevel;

    const col = Math.min(Math.max(Math.floor((transformedX / canvas.width) * 400), 0), 399);
    const row = Math.min(Math.max(Math.floor((transformedY / canvas.height) * 400), 0), 399);

    return { row, col, x, y };
  };

  // Mouse Interactivity (Hover Tooltip, Zoom Wheel, Pan Drag)
  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const { row, col, x, y } = screenToGridCoords(e.clientX, e.clientY);
    const matrix = getGridMatrix(activeLayerId);
    const val = matrix ? matrix[row]?.[col] : null;

    const nearbySite = sites.find(
      s => Math.abs(s.row - row) < 12 && Math.abs(s.col - col) < 12
    );

    const ptDetails = getPointLatLon(row, col);

    setHoveredPoint({
      row,
      col,
      point_id: ptDetails.point_id,
      latFormatted: ptDetails.latFormatted,
      lonFormatted: ptDetails.lonFormatted,
      val: val !== null ? Number(val).toFixed(1) : 'N/A',
      siteName: nearbySite ? nearbySite.name : null,
      x,
      y
    });
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);

    // If mouse didn't drag much, treat as a click to select site
    const { row, col } = screenToGridCoords(e.clientX, e.clientY);
    const closest = sites.reduce((best, s) => {
      const dist = Math.hypot(s.row - row, s.col - col);
      if (!best || dist < best.dist) return { site: s, dist };
      return best;
    }, null);

    if (closest && closest.dist < 20) {
      onSelectSite(closest.site);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomLevel(prev => Math.min(Math.max(prev * zoomFactor, 0.8), 6.0));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full bg-[#0d1322] border border-[#1e293b] rounded-lg">
      {/* Top Layer Switcher Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {LAYERS_CONFIG.map((layer) => {
            const isActive = layer.id === activeLayerId;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`px-2.5 py-1 rounded border text-[10px] font-semibold font-mono tracking-wider transition-colors ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/50 shadow-sm'
                    : 'border-[#1e293b] text-slate-400 bg-[#090e18] hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Heatmap Canvas Container */}
      <div
        className="relative flex-1 w-full min-h-[380px] rounded-lg overflow-hidden border border-[#1e293b] bg-[#070b16] cursor-grab active:cursor-grabbing select-none"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={() => { setHoveredPoint(null); setIsDragging(false); }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Controls (+ / - / Reset) */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev * 1.3, 6.0))}
            className="p-1.5 rounded bg-[#090e18]/90 text-slate-300 hover:text-white border border-[#1e293b] transition-colors"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev / 1.3, 0.8))}
            className="p-1.5 rounded bg-[#090e18]/90 text-slate-300 hover:text-white border border-[#1e293b] transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded bg-[#090e18]/90 text-slate-300 hover:text-white border border-[#1e293b] transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Level Indicator Badge */}
        {zoomLevel !== 1 && (
          <div className="absolute left-3 top-3 z-20 px-2 py-0.5 rounded bg-[#090e18]/90 border border-blue-500/40 text-[10px] font-mono text-cyan-400">
            {zoomLevel.toFixed(1)}x Zoom
          </div>
        )}

        {/* Hover Tooltip Card */}
        {hoveredPoint && !isDragging && (
          <div
            className="absolute z-30 pointer-events-none bg-[#090e18]/95 border border-cyan-500/30 p-3 rounded-lg shadow-2xl text-left text-xs font-mono min-w-[210px] space-y-1.5 backdrop-blur-md"
            style={{
              left: Math.min(hoveredPoint.x + 15, canvasRef.current?.width - 220 || 200),
              top: Math.min(hoveredPoint.y + 15, canvasRef.current?.height - 120 || 200)
            }}
          >
            {/* 1) Point ID Highlighted */}
            <div className="flex items-center justify-between text-[11px] border-b border-[#1e293b] pb-1">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Hash className="w-3 h-3" />
                #{hoveredPoint.point_id}
              </span>
              <span className="text-slate-500 text-[10px]">Grid [{hoveredPoint.row}, {hoveredPoint.col}]</span>
            </div>

            {/* 2) Nearest Site Name */}
            <div className="font-semibold text-blue-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
              <span>{hoveredPoint.siteName || 'South Pole Region'}</span>
            </div>

            {/* 3) Lat & Lon Coordinates */}
            <div className="text-cyan-300 font-bold flex items-center gap-1 text-[11px]">
              <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{hoveredPoint.latFormatted}, {hoveredPoint.lonFormatted}</span>
            </div>

            {/* Score Value */}
            <div className="text-slate-300 pt-1 border-t border-[#1e293b] flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase">{activeLayer.shortLabel}:</span>
              <span className="font-bold text-emerald-400 text-xs">{hoveredPoint.val} {activeLayer.unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Scale Legend & Active Layer Label */}
      <div className="flex items-center justify-between mt-3 pt-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>{activeLayer.min}</span>
          <div
            className="w-44 h-3 rounded overflow-hidden border border-slate-700/60"
            style={{
              background: 'linear-gradient(to right, #0a0a0b, #17181a, #46474d, #8a8b91, #cccdd1, #f5f4f0)'
            }}
          />
          <span>{activeLayer.max} {activeLayer.unit}</span>
        </div>

        <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
          {activeLayer.label}
        </div>
      </div>
    </div>
  );
}
