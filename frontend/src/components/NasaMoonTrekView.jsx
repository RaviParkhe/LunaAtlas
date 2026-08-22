import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Compass, ExternalLink, Plus, Minus, RotateCcw, MapPin, Info } from 'lucide-react';

export default function NasaMoonTrekView() {
  const canvasRef = useRef(null);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedLandmark, setSelectedLandmark] = useState(null);

  // Pre-load NASA LROC 2048x2048 South Pole Relief Mosaic
  const polarImage = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const img = new Image();
    img.src = '/textures/lroc_south_pole_mosaic.jpg';
    return img;
  }, []);

  const southPoleCraters = [
    { name: 'Shackleton Crater Rim', lat: -89.67, lon: 129.78, type: 'Artemis Target / PSR Cold Trap', elev: '1,926 m', slope: '0.75°' },
    { name: 'Malapert Massif (Peak 5k)', lat: -86.04, lon: -2.71, type: 'Communications Relay / High Peak', elev: '4,910 m', slope: '6.33°' },
    { name: 'Faustini Crater Rim', lat: -87.30, lon: 77.00, type: 'Optimal Landing Zone', elev: '578 m', slope: '1.12°' },
    { name: 'Nobile Rim (VIPER)', lat: -85.25, lon: 53.50, type: 'NASA Volatiles Prospecting', elev: '458 m', slope: '4.16°' },
    { name: 'Haworth Crater', lat: -86.87, lon: -5.20, type: 'Deep Cryogenic PSR Basin', elev: '-1,620 m', slope: '12.20°' },
    { name: 'de Gerlache Rim', lat: -88.50, lon: -87.10, type: 'Illumination Ridge', elev: '1,740 m', slope: '8.80°' },
    { name: 'Shoemaker Crater', lat: -88.10, lon: 45.60, type: 'Prospecting Basin', elev: '-850 m', slope: '7.50°' },
    { name: 'Amundsen Rim', lat: -84.50, lon: 82.80, type: 'Extended Science Target', elev: '1,200 m', slope: '3.90°' }
  ];

  // Render Loop
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

    // 1. Draw High-Res NASA South Pole Photographic Relief Mosaic
    if (polarImage && polarImage.complete && polarImage.naturalWidth > 0) {
      ctx.drawImage(polarImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#151516';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Polar Concentric Latitude Range Rings (82°S, 84°S, 86°S, 88°S)
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = width / 2;

    [82, 84, 86, 88].forEach((lat) => {
      const r = ((90 - lat) / 10) * maxRadius;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 102, 204, 0.35)';
      ctx.lineWidth = 1 / zoomLevel;
      ctx.setLineDash([4 / zoomLevel, 6 / zoomLevel]);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 102, 204, 0.9)';
      ctx.font = `${Math.max(9, 10 / Math.sqrt(zoomLevel))}px -apple-system, sans-serif`;
      ctx.fillText(`${lat}°S`, cx + 4, cy - r + 10);
    });
    ctx.setLineDash([]);

    // 3. Central Polar Crosshair (90°S Pole)
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 1.2 / zoomLevel;
    ctx.beginPath();
    ctx.moveTo(cx - 15 / zoomLevel, cy);
    ctx.lineTo(cx + 15 / zoomLevel, cy);
    ctx.moveTo(cx, cy - 15 / zoomLevel);
    ctx.lineTo(cx, cy + 15 / zoomLevel);
    ctx.stroke();

    ctx.fillStyle = '#0066cc';
    ctx.font = `bold ${Math.max(9, 10 / Math.sqrt(zoomLevel))}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SOUTH POLE (90°S)', cx, cy + 18 / zoomLevel);

    // 4. Draw Major South Pole Crater Markers
    southPoleCraters.forEach((crater) => {
      const isSelected = selectedLandmark && selectedLandmark.name === crater.name;
      const latOffset = 90 - Math.abs(crater.lat);
      const rDist = (latOffset / 10) * maxRadius;
      const lonRad = (crater.lon * Math.PI) / 180;

      const px = cx + rDist * Math.sin(lonRad);
      const py = cy - rDist * Math.cos(lonRad);

      // Pinpoint Ring
      ctx.beginPath();
      ctx.arc(px, py, (isSelected ? 11 : 7) / zoomLevel, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#0066cc' : 'rgba(29, 29, 31, 0.85)';
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0066cc';
      ctx.lineWidth = (isSelected ? 2.5 : 1.5) / zoomLevel;
      ctx.fill();
      ctx.stroke();

      // Center Dot
      ctx.beginPath();
      ctx.arc(px, py, 2.5 / zoomLevel, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label Box
      ctx.font = `600 ${Math.max(8.5, 9.5 / Math.sqrt(zoomLevel))}px -apple-system, sans-serif`;
      ctx.fillStyle = isSelected ? '#0066cc' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(crater.name.split(' ')[0], px, py - (14 / zoomLevel));
    });

    ctx.restore();
  }, [polarImage, zoomLevel, panOffset, selectedLandmark]);

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

    const dx = transformedX - canvas.width / 2;
    const dy = -(transformedY - canvas.height / 2);
    const dist = Math.hypot(dx, dy);
    const maxRadius = canvas.width / 2;

    if (dist <= maxRadius) {
      const lat = (90 - (dist / maxRadius) * 10).toFixed(2);
      let angleRad = Math.atan2(dx, dy);
      let lon = ((angleRad * 180) / Math.PI).toFixed(2);
      setHoveredPoint({ lat, lon });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.2 : 0.82;
    setZoomLevel((prev) => Math.max(0.7, Math.min(18.0, prev * zoomFactor)));
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const transformedX = (clientX - (canvas.width / 2 + panOffset.x)) / zoomLevel + canvas.width / 2;
    const transformedY = (clientY - (canvas.height / 2 + panOffset.y)) / zoomLevel + canvas.height / 2;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = canvas.width / 2;

    southPoleCraters.forEach((crater) => {
      const latOffset = 90 - Math.abs(crater.lat);
      const rDist = (latOffset / 10) * maxRadius;
      const lonRad = (crater.lon * Math.PI) / 180;
      const px = cx + rDist * Math.sin(lonRad);
      const py = cy - rDist * Math.cos(lonRad);

      const clickDist = Math.hypot(transformedX - px, transformedY - py);
      if (clickDist < 25 / zoomLevel) {
        setSelectedLandmark(crater);
      }
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedLandmark(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-hidden select-none font-sans transition-colors duration-200">
      {/* Header Bar */}
      <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between flex-wrap gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--apple-parchment)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] uppercase">
                Explore Lunar South Pole (80°S - 90°S)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--apple-parchment)] text-[#0066cc] border border-[var(--border-color)]">
                NASA LROC HIGH-RES
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Interactive un-distorted polar stereographic mosaic with Artemis candidate landing zones & crater topography.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://trek.nasa.gov/moon/index.html?polar=sp"
            target="_blank"
            rel="noreferrer"
            className="apple-btn-primary text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open NASA Moon Trek</span>
          </a>
        </div>
      </div>

      {/* Main Map Viewport Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden relative">
        {/* Left Side: High-Res Interactive Canvas */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 h-full relative bg-[var(--bg-dark)] flex items-center justify-center border-r border-[var(--border-color)]">
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
              width={720}
              height={720}
              className="max-w-full max-h-full block shadow-xl rounded-2xl"
            />

            {/* Hover Coordinate HUD */}
            {hoveredPoint && (
              <div className="absolute top-4 left-4 pointer-events-none bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse"></span>
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {hoveredPoint.lat}°S, {hoveredPoint.lon}°E (Zoom: {zoomLevel.toFixed(1)}x)
                </span>
              </div>
            )}

            {/* Floating Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 pointer-events-auto">
              <button
                onClick={() => setZoomLevel((z) => Math.min(18.0, z * 1.3))}
                className="w-8 h-8 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer shadow-sm active:scale-95 backdrop-blur-md"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z * 0.75))}
                className="w-8 h-8 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer shadow-sm active:scale-95 backdrop-blur-md"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="w-8 h-8 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer shadow-sm active:scale-95 backdrop-blur-md mt-1"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Key South Pole Targets & Selected Landmark Telemetry */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 bg-[var(--bg-card)] p-5 flex flex-col justify-between overflow-y-auto space-y-4 transition-colors duration-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0066cc] uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>South Pole Candidate Sites</span>
            </div>

            <div className="space-y-2">
              {southPoleCraters.map((c, idx) => {
                const isSelected = selectedLandmark && selectedLandmark.name === c.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedLandmark(c)}
                    className={`p-3 rounded-[14px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--apple-parchment)] border-[#0066cc] shadow-sm font-medium'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{c.name}</span>
                      <span className="text-[11px] font-mono font-medium text-[#0066cc] bg-[var(--apple-parchment)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                        {Math.abs(c.lat).toFixed(1)}°S
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] mt-1">{c.type}</div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border-color)]">
                      <span>Elev: <strong className="text-[var(--text-primary)]">{c.elev}</strong></span>
                      <span>Slope: <strong className="text-[var(--text-primary)]">{c.slope}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-[14px] bg-[var(--apple-parchment)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium text-xs">
              <Info className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>Map Navigation</span>
            </div>
            <ul className="space-y-1 text-xs text-[var(--text-secondary)] pl-4 list-disc">
              <li>Scroll wheel zooms up to 18.0x into crater floors</li>
              <li>Left-click drag to pan across the pole</li>
              <li>Click any marker to inspect elevation & slope</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
