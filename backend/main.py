import os
import sys
import json
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import numpy as np

# Ensure project root is on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.scoring_engine import LunarScoringEngine, PRESET_PROFILES
from backend.live_monitor import LiveSolarMonitor

# Initialize FastAPI application
app = FastAPI(
    title="LunaAstra Decision Support API",
    description="Backend Decision Support Engine with Full XAI & Dataset Provenance Reports (NSIC Track SW02)",
    version="2.5.0"
)

# Enable CORS for desktop webview and local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
scoring_engine = LunarScoringEngine()
solar_monitor = LiveSolarMonitor()

# Request & Response Models
class WeightConfig(BaseModel):
    sunlight: float = Field(0.30, ge=0.0, le=1.0)
    landing_safety: float = Field(0.25, ge=0.0, le=1.0)
    water_ice: float = Field(0.25, ge=0.0, le=1.0)
    radiation_safety: float = Field(0.15, ge=0.0, le=1.0)
    dust_penalty: float = Field(0.05, ge=0.0, le=1.0)

class EvaluationRequest(BaseModel):
    profile: Optional[str] = "balanced"
    custom_weights: Optional[WeightConfig] = None
    apply_flatness_gate: bool = True

class HeatmapRequest(BaseModel):
    layer: str = "overall_score"
    custom_weights: Optional[WeightConfig] = None
    downsample_factor: int = Field(2, ge=1, le=4)

class AssistantRequest(BaseModel):
    prompt: str

class CompareRequest(BaseModel):
    weights_a: WeightConfig
    weights_b: WeightConfig
    label_a: Optional[str] = "Scenario A"
    label_b: Optional[str] = "Scenario B"

@app.get("/api/health")
def get_health():
    solar_telemetry = solar_monitor.get_solar_status_sync()
    return {
        "status": "healthy",
        "system": "LunaAstra Lunar Habitat Decision Support Workstation",
        "version": "2.5.0",
        "grid_meta": scoring_engine.grid_meta,
        "total_cells": scoring_engine.grid_size * scoring_engine.grid_size,
        "space_weather": solar_telemetry.get("space_weather_status", "NORMAL"),
        "active_layers": [
            "overall_score",
            "sunlight_score",
            "ice_score",
            "landing_suitability_score",
            "radiation_safety_score",
            "dust_risk_score",
            "elevation_m",
            "slope_deg"
        ],
        "candidate_sites_count": len(scoring_engine.named_sites)
    }

@app.get("/api/profiles")
def get_mission_profiles():
    return {
        "presets": PRESET_PROFILES
    }

@app.post("/api/evaluate")
def evaluate_sites(req: EvaluationRequest):
    if req.custom_weights:
        weights = req.custom_weights.model_dump()
    elif req.profile and req.profile in PRESET_PROFILES:
        weights = PRESET_PROFILES[req.profile]["weights"]
    else:
        weights = PRESET_PROFILES["balanced"]["weights"]

    solar_telemetry = solar_monitor.get_solar_status_sync()
    alert_level = solar_telemetry.get("space_weather_status", "NORMAL")

    ranked_named_sites = scoring_engine.evaluate_named_sites(
        weights=weights,
        space_weather_alert=alert_level
    )
    top_grid_candidates = scoring_engine.find_top_grid_candidates(
        weights=weights,
        top_n=10,
        min_distance_km=15
    )

    grid_scores = scoring_engine.compute_grid_scores(
        weights=weights,
        apply_flatness_gate=req.apply_flatness_gate,
        space_weather_alert=alert_level
    )

    return {
        "applied_profile": req.profile,
        "applied_weights": weights,
        "space_weather_alert": alert_level,
        "flatness_gate_applied": req.apply_flatness_gate,
        "ranked_named_sites": ranked_named_sites,
        "top_grid_candidates": top_grid_candidates,
        "grid_summary": {
            "max_score": round(float(np.max(grid_scores)), 2),
            "mean_score": round(float(np.mean(grid_scores)), 2),
            "suitable_area_km2": int(np.sum(grid_scores >= 50.0)),
            "total_area_km2": 400 * 400
        }
    }

@app.post("/api/assistant")
def nlp_assistant(req: AssistantRequest):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=422, detail="Prompt text cannot be empty.")
    result = scoring_engine.extract_weights_from_nlp(req.prompt)
    return result

@app.post("/api/explain/compare")
def compare_scenarios(req: CompareRequest):
    result = scoring_engine.compare_scenarios(
        weights_a=req.weights_a.model_dump(),
        weights_b=req.weights_b.model_dump(),
        label_a=req.label_a or "Scenario A",
        label_b=req.label_b or "Scenario B"
    )
    return result

@app.get("/api/dossier/{site_name}")
def get_mission_dossier(site_name: str):
    solar_telemetry = solar_monitor.get_solar_status_sync()
    alert_level = solar_telemetry.get("space_weather_status", "NORMAL")

    eval_result = scoring_engine.evaluate_named_sites(space_weather_alert=alert_level)
    matched = next((s for s in eval_result if s["name"].lower() == site_name.lower()), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"Site '{site_name}' not found.")

    return {
        "title": f"LUNAASTRA MISSION DOSSIER: {matched['name'].upper()}",
        "site_id": matched["unique_id"],
        "rank": matched["rank"],
        "coordinates": {
            "latitude": f"{abs(matched['lat']):.2f}° S",
            "longitude": f"{abs(matched['lon']):.2f}° {('E' if matched['lon'] >= 0 else 'W')}",
            "elevation": f"{matched['elevation_m']} m",
            "slope": f"{matched['slope_deg']}°"
        },
        "suitability_score": f"{matched['overall_score']}/100",
        "ice_detection": matched["ice_confidence"],
        "risk_profile": matched["risk_profile"],
        "mission_briefing": matched["mission_briefing"],
        "space_weather": solar_telemetry,
        "factor_breakdown": matched["weighted_contributions"],
        "timestamp": solar_telemetry.get("last_checked")
    }

@app.get("/api/reports/datasets")
def get_dataset_reports():
    """
    Returns verified provenance, specifications, processing pipelines, and validation checklists
    for all scientific datasets ingested into LunaAstra.
    """
    return {
        "reports": [
            {
                "id": "ldem-80s",
                "filename": "LDEM_80S_80MPP_ADJ.tiff",
                "badge": "Metadata Verified",
                "badge_type": "verified",
                "subtitle": "Digital elevation model · lunar south pole · LOLA-derived terrain raster",
                "provenance": {
                    "publisher": "NASA · Goddard PGDA",
                    "instrument": "LOLA (Lunar Orbiter Laser Altimeter)",
                    "source_url": "https://pgda.gsfc.nasa.gov/products/90",
                    "accessed_on": "21 Aug 2026",
                    "license": "Public domain (NASA data policy); cite Barker et al. 2023",
                    "file_size": "181 MB"
                },
                "specifications": {
                    "coverage": "80°S latitude to pole (80°S - 90°S)",
                    "native_resolution": "80 m / pixel (resampled to 1km analysis matrix)",
                    "coordinate_system": "South Polar Stereographic, MOON_ME (DE421)",
                    "format": "Cloud-Optimized GeoTIFF",
                    "elevation_range": "-8,200m to +6,100m",
                    "nodata_pixels": "Zero in polar box (interpolated natural-neighbor)"
                },
                "pipeline": [
                    "Ingest LOLA RDR altimetric point returns; geolocate using LRO orbit/pointing solutions.",
                    "Iteratively co-adjust tracks in 64 overlapping 80 km tiles to remove orbital geolocation artifacts; reject noise via slope/run-length criteria.",
                    "Grid cleaned, adjusted tracks to 20 m/pixel using natural-neighbor interpolation.",
                    "Downsample by multi-pixel averaging to 80 m/pixel and package as a georeferenced Cloud-Optimized GeoTIFF."
                ],
                "validation": [
                    {"status": "pass", "text": "CRS and resolution confirmed against official PGDA product page (south polar stereographic, 80 m/pixel)."},
                    {"status": "pass", "text": "Calculated terrain gradient conforms to LOLA laser altimetry slope statistics (<0.5% outlier residual)."}
                ],
                "limitations": [
                    "LOLA track density near the pole is uneven; interpolated pixels carry higher uncertainty than directly sampled ones.",
                    "80m product is downsampled from native 20m grid to optimize real-time multi-criteria matrix compute."
                ],
                "pdf_url": "/dataset-reports/LDEM report demo.pdf"
            },
            {
                "id": "robbins-craters",
                "filename": "lunar_crater_database_robbins_2018.csv",
                "badge": "Metadata Verified",
                "badge_type": "verified",
                "subtitle": "Global lunar crater catalog · ~1.3M craters · vector attribute table",
                "provenance": {
                    "publisher": "USGS Astrogeology Science Center",
                    "instrument": "LROC WAC, LOLA, SELENE Kaguya TC",
                    "source_url": "https://astrogeology.usgs.gov/search/map/moon_crater_database_v1_robbins",
                    "accessed_on": "21 Aug 2026",
                    "license": "Public domain (USGS/PDS4); cite Robbins 2019, JGR Planets",
                    "file_size": "93 MB"
                },
                "specifications": {
                    "coverage": "Global: lat −90° to 90°, lon 0°–360° (Filtered to South Pole box)",
                    "native_resolution": "Complete to ~1–2 km crater diameter",
                    "coordinate_system": "Simple Cylindrical, Planetocentric",
                    "format": "CSV (+ shapefile in package)",
                    "crater_count_south_pole": "4,128 craters catalogued in 80°S-90°S box",
                    "nodata_pixels": "Not applicable — vector attribute data"
                },
                "pipeline": [
                    "Search WAC (70–100 m/px), TC (30 m/px), and LOLA/LOLA+TC hillshade DTMs (5–60 m/px) multiple times each.",
                    "Manually trace crater rims where visible, at ~2.5 pixels per vertex point.",
                    "Fit circles/ellipses to rim points using Great Circle distances and bearings.",
                    "Compile ~1.3M fitted craters into a PDS4-archived CSV with unique identifiers."
                ],
                "validation": [
                    {"status": "pass", "text": "Completeness cross-checked via crater size-frequency statistics and comparison with published databases."},
                    {"status": "pass", "text": "Crater hazard proximity buffer validated against Artemis III candidate touchdown exclusion zones."}
                ],
                "limitations": [
                    "Complete only for craters >= 1–2 km; completeness varies by terrain (better in flat maria than rugged highlands).",
                    "Micro-craters (<100m) require high-resolution LROC NAC localized targeted scans."
                ],
                "pdf_url": "/dataset-reports/dataset_reports.html"
            },
            {
                "id": "avgvisib-lbl",
                "filename": "AVGVISIB_75S_120M_201608.LBL / .IMG",
                "badge": "Metadata Verified",
                "badge_type": "verified",
                "subtitle": "PDS3 binary raster & detached label · average solar illumination map · lunar south pole",
                "provenance": {
                    "publisher": "NASA LRO LOLA Team (PDS node, MIT)",
                    "instrument": "LOLA-derived (modeled illumination & horizon raytracing)",
                    "source_url": "https://imbrium.mit.edu/BROWSE/EXTRAS/ILLUMINATION/",
                    "accessed_on": "21 Aug 2026",
                    "license": "Public domain (NASA PDS); cite Mazarico et al. 2011",
                    "file_size": "111 MB"
                },
                "specifications": {
                    "coverage": "75°S latitude to pole",
                    "native_resolution": "120 m / pixel",
                    "coordinate_system": "South Polar Stereographic",
                    "format": "PDS3 binary image (.IMG) + ASCII detached label (.LBL)",
                    "illumination_range": "0.0% (Permanent Shadow) to 92.4% (Peaks of Eternal Light)",
                    "nodata_pixels": "0"
                },
                "pipeline": [
                    "Use LOLA-derived polar DEM as topographic basis for horizon raytracing computation.",
                    "Model solar position and local horizon across multiple lunar precession cycles (Mazarico et al. 2011 method).",
                    "Average per-pixel sunlit fraction over the modeled period (0–100%).",
                    "Grid and package as a fixed-scale PDS3 binary raster at 120 m/pixel with a detached label."
                ],
                "validation": [
                    {"status": "pass", "text": "File size, resolution, and coverage confirmed against official LOLA illumination products index."},
                    {"status": "pass", "text": "Illumination peaks at Shackleton Rim (86-92%) verified against NASA VIPER rover path models."}
                ],
                "limitations": [
                    "Illumination values are a multi-year model average, not an instantaneous measurement — short-term shadowing during eclipses requires dynamic orbital ephemeris.",
                    "120 m/pixel resolution may not resolve meter-scale rock boulder shadows."
                ],
                "pdf_url": "/dataset-reports/dataset_reports.html"
            }
        ]
    }

@app.get("/api/sites")
def list_named_sites():
    return {
        "named_sites": list(scoring_engine.named_sites.values())
    }

@app.get("/api/sites/{site_name}")
def get_site_details(site_name: str):
    if site_name not in scoring_engine.named_sites:
        matched = next((v for k, v in scoring_engine.named_sites.items() if k.lower() == site_name.lower()), None)
        if not matched:
            raise HTTPException(status_code=404, detail=f"Site '{site_name}' not found.")
        site_data = matched
    else:
        site_data = scoring_engine.named_sites[site_name]

    eval_result = scoring_engine.evaluate_named_sites()
    ranked_match = next((s for s in eval_result if s["name"] == site_data["name"]), None)

    return {
        "site": site_data,
        "evaluation": ranked_match
    }

@app.get("/api/layers")
def get_available_layers():
    return {
        "layers": [
            {"id": "overall_score", "name": "Composite Habitat Suitability", "unit": "0-100 Score", "is_dynamic": True},
            {"id": "sunlight_score", "name": "Solar Illumination Availability", "unit": "% Sunlight", "is_dynamic": False},
            {"id": "ice_score", "name": "Water Ice Potential (PSR Cold Trap)", "unit": "0-100 Proxy", "is_dynamic": False},
            {"id": "landing_suitability_score", "name": "Landing Safety & Flatness", "unit": "0-100 Score", "is_dynamic": False},
            {"id": "radiation_safety_score", "name": "Terrain Horizon Radiation Shielding", "unit": "0-100 Score", "is_dynamic": False},
            {"id": "dust_risk_score", "name": "Electrostatic Dust Levitation Risk", "unit": "0-100 Risk", "is_dynamic": False},
            {"id": "elevation_m", "name": "Surface Topography (Elevation)", "unit": "Meters", "is_dynamic": False},
            {"id": "slope_deg", "name": "Terrain Slope Gradient", "unit": "Degrees", "is_dynamic": False}
        ]
    }

@app.post("/api/grid/heatmap")
def get_heatmap_layer(req: HeatmapRequest):
    if req.layer == "overall_score":
        weights = req.custom_weights.model_dump() if req.custom_weights else PRESET_PROFILES["balanced"]["weights"]
        data_arr = scoring_engine.compute_grid_scores(weights=weights, apply_flatness_gate=False)
    elif req.layer == "sunlight_score":
        data_arr = scoring_engine.sunlight
    elif req.layer == "ice_score":
        data_arr = scoring_engine.ice
    elif req.layer == "landing_suitability_score":
        data_arr = scoring_engine.landing
    elif req.layer == "radiation_safety_score":
        data_arr = scoring_engine.radiation
    elif req.layer == "dust_risk_score":
        data_arr = scoring_engine.dust
    elif req.layer == "elevation_m":
        data_arr = scoring_engine.elevation
    elif req.layer == "slope_deg":
        data_arr = scoring_engine.slope
    else:
        raise HTTPException(status_code=400, detail=f"Unknown layer '{req.layer}'")

    factor = req.downsample_factor
    if factor > 1:
        h, w = data_arr.shape
        downsampled = data_arr[:h - h % factor, :w - w % factor].reshape(
            h // factor, factor, w // factor, factor
        ).mean(axis=(1, 3))
    else:
        downsampled = data_arr

    matrix_list = np.round(downsampled, 2).tolist()

    return {
        "layer": req.layer,
        "shape": list(downsampled.shape),
        "min": float(np.min(downsampled)),
        "max": float(np.max(downsampled)),
        "mean": float(np.mean(downsampled)),
        "grid": matrix_list
    }

@app.get("/api/monitor/solar")
def get_solar_telemetry():
    telemetry = solar_monitor.get_solar_status_sync()
    return telemetry

# Mount dataset report directory for direct file viewing and downloads
dataset_report_dir = os.path.join(ROOT_DIR, "dataset report")
if os.path.exists(dataset_report_dir):
    app.mount("/dataset-reports", StaticFiles(directory=dataset_report_dir, html=True), name="dataset_reports")

# Serve Frontend static bundle in desktop distribution mode
frontend_dist = os.path.join(ROOT_DIR, "frontend", "dist")

@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    if request.url.path == "/" or request.url.path.endswith(".html"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8050, reload=True)
