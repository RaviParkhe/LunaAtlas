import os
import sys
import json
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
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
    description="Backend Decision Support Engine for Lunar South Pole Habitat Site Selection (NSIC Track SW02)",
    version="1.0.0"
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
    downsample_factor: int = Field(2, ge=1, le=4)  # 2 means 200x200 for fast transfer

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "system": "LunaAstra Lunar Habitat Decision Support Workstation",
        "version": "1.0.0",
        "grid_meta": scoring_engine.grid_meta,
        "total_cells": scoring_engine.grid_size * scoring_engine.grid_size,
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
    # Determine weights
    if req.custom_weights:
        weights = req.custom_weights.model_dump()
    elif req.profile and req.profile in PRESET_PROFILES:
        weights = PRESET_PROFILES[req.profile]["weights"]
    else:
        weights = PRESET_PROFILES["balanced"]["weights"]

    ranked_named_sites = scoring_engine.evaluate_named_sites(weights=weights)
    top_grid_candidates = scoring_engine.find_top_grid_candidates(
        weights=weights,
        top_n=10,
        min_distance_km=15
    )

    # Compute high level summary stats
    grid_scores = scoring_engine.compute_grid_scores(
        weights=weights,
        apply_flatness_gate=req.apply_flatness_gate
    )

    return {
        "applied_profile": req.profile,
        "applied_weights": weights,
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
    # Select layer array
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
