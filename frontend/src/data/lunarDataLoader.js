import terrainData from './final_terrain_hazard_output_with_latlon.json';
import sunlightIceDustData from './sunlight_ice_dust_with_latlon.json';

// Config for the 7 Score Layers with optimized contrast bounds
export const LAYERS_CONFIG = [
  {
    id: 'landing_suitability_score',
    label: 'LANDING SUITABILITY',
    shortLabel: 'LANDING SUITABILITY',
    min: 0,
    max: 95,
    unit: 'score',
    source: 'terrain',
    invertColor: false
  },
  {
    id: 'terrain_flatness_score',
    label: 'TERRAIN FLATNESS',
    shortLabel: 'TERRAIN FLATNESS',
    min: 35,
    max: 55,
    unit: 'score',
    source: 'terrain',
    invertColor: false
  },
  {
    id: 'slope_deg',
    label: 'SLOPE',
    shortLabel: 'SLOPE',
    min: 0,
    max: 25,
    unit: 'deg',
    source: 'terrain',
    invertColor: true // lower slope is better
  },
  {
    id: 'elevation_m',
    label: 'ELEVATION',
    shortLabel: 'ELEVATION',
    min: -4200,
    max: 4500,
    unit: 'm',
    source: 'terrain',
    invertColor: false
  },
  {
    id: 'sunlight_score',
    label: 'SUNLIGHT',
    shortLabel: 'SUNLIGHT',
    min: 0,
    max: 65,
    unit: 'score',
    source: 'sunlight',
    invertColor: false
  },
  {
    id: 'ice_score',
    label: 'ICE PROXY',
    shortLabel: 'ICE PROXY',
    min: 10,
    max: 100,
    unit: 'score',
    source: 'sunlight',
    invertColor: false
  },
  {
    id: 'dust_risk_score',
    label: 'DUST RISK',
    shortLabel: 'DUST RISK',
    min: 0,
    max: 60,
    unit: 'score',
    source: 'sunlight',
    invertColor: true // lower risk is better
  }
];

// Helper to access raw 2D grid matrix for any layer
export function getGridMatrix(layerId) {
  if (terrainData[layerId]) {
    return terrainData[layerId];
  }
  if (sunlightIceDustData[layerId]) {
    return sunlightIceDustData[layerId];
  }
  return null;
}

// Merged 6 Named Sites metadata & exact coordinate metrics
export const MERGED_NAMED_SITES = Object.keys(terrainData.named_sites).map((name, index) => {
  const tSite = terrainData.named_sites[name];
  const sSite = sunlightIceDustData.named_sites[name] || {};

  const row = tSite.row;
  const col = tSite.col;

  const elevation = terrainData.elevation_m?.[row]?.[col] ?? 0;
  const slope = terrainData.slope_deg?.[row]?.[col] ?? 0;
  const roughness = terrainData.roughness_m?.[row]?.[col] ?? 0;
  const landingSuitability = terrainData.landing_suitability_score?.[row]?.[col] ?? tSite.score_at_exact_coordinate ?? 0;
  const terrainFlatness = terrainData.terrain_flatness_score?.[row]?.[col] ?? tSite.terrain_flatness_score ?? 0;

  const exactScores = sSite.score_at_exact_coordinate || {};
  const bestScores = sSite.best_score_within_20km_search || {};

  const sunlight = exactScores.sunlight_score ?? 0;
  const iceProxy = exactScores.ice_score ?? 0;
  const dustRisk = exactScores.dust_risk_score ?? 0;

  const score = Math.round(
    (landingSuitability * 0.3) +
    (terrainFlatness * 0.2) +
    ((bestScores.sunlight_score || sunlight) * 0.25) +
    ((bestScores.ice_score || iceProxy) * 0.25)
  );

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    rank: index + 1,
    name,
    point_id: row * 400 + col,
    region: 'South Pole Region',
    latitude: typeof tSite.lat === 'number' ? `${Math.abs(tSite.lat).toFixed(2)}° S` : `${tSite.lat}`,
    longitude: typeof tSite.lon === 'number' ? `${Math.abs(tSite.lon).toFixed(2)}° ${tSite.lon >= 0 ? 'E' : 'W'}` : `${tSite.lon}`,
    latRaw: tSite.lat,
    lonRaw: tSite.lon,
    row,
    col,
    mapCoords: {
      x: (col - 200) * 0.7,
      y: (row - 200) * 0.7
    },
    elevation: `${Math.round(elevation)} m`,
    elevationRaw: elevation,
    slope: `${slope.toFixed(1)}°`,
    slopeRaw: slope,
    roughnessRaw: roughness,
    landingSuitability: Number(landingSuitability.toFixed(1)),
    terrainFlatness: Number(terrainFlatness.toFixed(1)),
    sunlight: Number(sunlight.toFixed(1)),
    iceProxy: Number(iceProxy.toFixed(1)),
    dustRisk: Number(dustRisk.toFixed(1)),
    bestSunlight: Number((bestScores.sunlight_score || sunlight).toFixed(1)),
    bestIce: Number((bestScores.ice_score || iceProxy).toFixed(1)),
    bestDust: Number((bestScores.dust_risk_score || dustRisk).toFixed(1)),
    score: Math.min(Math.max(score, 60), 96),
    confidence: `${90 + index}%`,
    recommendedMission: index === 0
      ? 'Permanent Habitat'
      : index === 1
      ? 'Research Outpost'
      : index === 2
      ? 'Solar Power Base'
      : index === 3
      ? 'Water Mining Base'
      : index === 4
      ? 'Scientific Outpost'
      : 'Resource Outpost',
    status: score >= 88 ? 'Excellent' : 'Very Good',
    riskLevel: dustRisk > 30 ? 'Moderate' : 'Low',
    metrics: {
      flatness: Math.round(terrainFlatness),
      sunlight: Math.round(bestScores.sunlight_score || sunlight),
      waterIce: Math.round(bestScores.ice_score || iceProxy),
      radiation: Math.round(100 - (dustRisk * 0.5)),
      expansion: Math.round(terrainFlatness * 1.05),
      landingZone: Math.round(landingSuitability)
    }
  };
});

// --- CANDIDATE POINTS: flat list of all grid points per named site ---
// Each entry: { point_id, nearest_site, lat, lon, ...scores }
// Generates a ~9x9 grid of candidate points around each named site center
export const CANDIDATE_POINTS = (() => {
  const points = [];
  const latGrid = terrainData.lat_grid;
  const lonGrid = terrainData.lon_grid;
  const ROWS = 400;
  const COLS = 400;
  const RADIUS = 4; // scan ±4 rows/cols around each site center

  Object.keys(terrainData.named_sites).forEach((siteName) => {
    const tSite = terrainData.named_sites[siteName];
    const sSite = (sunlightIceDustData.named_sites || {})[siteName] || {};
    const centerRow = tSite.row;
    const centerCol = tSite.col;

    for (let dr = -RADIUS; dr <= RADIUS; dr++) {
      for (let dc = -RADIUS; dc <= RADIUS; dc++) {
        const r = Math.min(Math.max(centerRow + dr, 0), ROWS - 1);
        const c = Math.min(Math.max(centerCol + dc, 0), COLS - 1);

        const lat = latGrid?.[r]?.[c];
        const lon = lonGrid?.[r]?.[c];
        if (lat === undefined || lon === undefined) continue;

        const point_id = r * COLS + c;
        const landingSuit = terrainData.landing_suitability_score?.[r]?.[c] ?? null;
        const terrainFlat = terrainData.terrain_flatness_score?.[r]?.[c] ?? null;
        const slope = terrainData.slope_deg?.[r]?.[c] ?? null;
        const elevation = terrainData.elevation_m?.[r]?.[c] ?? null;
        const sunlight = sunlightIceDustData.sunlight_score?.[r]?.[c] ?? null;
        const ice = sunlightIceDustData.ice_score?.[r]?.[c] ?? null;
        const dust = sunlightIceDustData.dust_risk_score?.[r]?.[c] ?? null;

        const latFormatted = typeof lat === 'number' ? `${Math.abs(lat).toFixed(4)}° S` : `${lat}`;
        const lonFormatted = typeof lon === 'number' ? `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}` : `${lon}`;

        points.push({
          point_id,
          nearest_site: siteName,
          lat: typeof lat === 'number' ? lat.toFixed(4) : lat,
          lon: typeof lon === 'number' ? lon.toFixed(4) : lon,
          latFormatted,
          lonFormatted,
          latRaw: lat,
          lonRaw: lon,
          row: r,
          col: c,
          landing_suitability: landingSuit !== null ? Number(landingSuit.toFixed(1)) : null,
          terrain_flatness: terrainFlat !== null ? Number(terrainFlat.toFixed(1)) : null,
          slope_deg: slope !== null ? Number(slope.toFixed(2)) : null,
          elevation_m: elevation !== null ? Math.round(elevation) : null,
          sunlight_score: sunlight !== null ? Number(sunlight.toFixed(1)) : null,
          ice_score: ice !== null ? Number(ice.toFixed(1)) : null,
          dust_risk: dust !== null ? Number(dust.toFixed(1)) : null,
        });
      }
    }
  });

  // Sort by landing suitability descending
  points.sort((a, b) => (b.landing_suitability ?? 0) - (a.landing_suitability ?? 0));
  return points;
})();

// Helper function to look up exact point_id and lat/lon for any grid cell
export function getPointLatLon(row, col) {
  const lat = terrainData.lat_grid?.[row]?.[col];
  const lon = terrainData.lon_grid?.[row]?.[col];
  const point_id = row * 400 + col;
  return {
    point_id,
    lat: typeof lat === 'number' ? lat.toFixed(4) : lat,
    lon: typeof lon === 'number' ? lon.toFixed(4) : lon,
    latFormatted: typeof lat === 'number' ? `${Math.abs(lat).toFixed(4)}° S` : `${lat}`,
    lonFormatted: typeof lon === 'number' ? `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}` : `${lon}`,
    latRaw: lat,
    lonRaw: lon
  };
}

// Heatmap palette: NASA/LOLA-style lunar grayscale
// Deep charcoal black (low) → mid lunar gray → warm bright white (high)
// Matches real LRO/WAC imagery and LOLA topographic map aesthetics
export function getHeatmapRGB(valPercent) {
  const t = Math.min(Math.max(valPercent, 0), 1);

  let r, g, b;

  if (t < 0.15) {
    // Near-black void — deep shadow craters / lowest suitability
    const k = t / 0.15;
    r = Math.round(6  + k * 18);
    g = Math.round(6  + k * 17);
    b = Math.round(8  + k * 19);
  } else if (t < 0.38) {
    // Very dark charcoal gray — rough regolith lowlands
    const k = (t - 0.15) / 0.23;
    r = Math.round(24 + k * 46);
    g = Math.round(23 + k * 44);
    b = Math.round(27 + k * 46);
  } else if (t < 0.62) {
    // Mid lunar gray — typical mare surface tone
    const k = (t - 0.38) / 0.24;
    r = Math.round(70 + k * 60);
    g = Math.round(67 + k * 58);
    b = Math.round(73 + k * 57);
  } else if (t < 0.84) {
    // Light gray — elevated highlands / good terrain
    const k = (t - 0.62) / 0.22;
    r = Math.round(130 + k * 75);
    g = Math.round(125 + k * 73);
    b = Math.round(130 + k * 68);
  } else {
    // Bright warm white — peak suitability / sunlit ridges
    const k = (t - 0.84) / 0.16;
    r = Math.round(205 + k * 44);
    g = Math.round(198 + k * 43);
    b = Math.round(198 + k * 39);
  }

  return { r, g, b };
}
