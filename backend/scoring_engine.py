import os
import json
import numpy as np
from typing import Dict, Any, List, Optional
from pyproj import Transformer

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
NPZ_CACHE = os.path.join(DATA_DIR, "merged_layers_400x400.npz")
META_JSON = os.path.join(DATA_DIR, "merged_lunar_dataset.json")

# Standard Preset Mission Profiles
PRESET_PROFILES = {
    "balanced": {
        "name": "Balanced Artemis Mission",
        "description": "Standard multi-objective balance across power, resources, landing safety, and radiation protection.",
        "weights": {
            "sunlight": 0.30,
            "landing_safety": 0.25,
            "water_ice": 0.25,
            "radiation_safety": 0.15,
            "dust_penalty": 0.05
        }
    },
    "power_first": {
        "name": "Solar Power Maximization",
        "description": "Prioritizes peaks of near-continuous illumination on crater rims for solar array efficiency.",
        "weights": {
            "sunlight": 0.50,
            "landing_safety": 0.25,
            "water_ice": 0.10,
            "radiation_safety": 0.10,
            "dust_penalty": 0.05
        }
    },
    "isru_mining": {
        "name": "ISRU & Water Ice Extraction",
        "description": "Focuses on immediate access to cryogenic Permanently Shadowed Regions (PSRs) for water/fuel harvesting.",
        "weights": {
            "sunlight": 0.15,
            "landing_safety": 0.25,
            "water_ice": 0.45,
            "radiation_safety": 0.10,
            "dust_penalty": 0.05
        }
    },
    "max_safety": {
        "name": "Maximum Structural & Radiation Safety",
        "description": "Emphasizes extremely flat terrain and high natural radiation shielding for long-duration crew habitats.",
        "weights": {
            "sunlight": 0.15,
            "landing_safety": 0.45,
            "water_ice": 0.10,
            "radiation_safety": 0.25,
            "dust_penalty": 0.05
        }
    }
}

class LunarScoringEngine:
    def __init__(self, npz_path: str = NPZ_CACHE, meta_path: str = META_JSON):
        self.npz_path = npz_path
        self.meta_path = meta_path
        self._load_data()
        
        # Transformer for row/col to Lat/Lon conversion
        # South Polar Stereographic -> Lunar Lat/Lon
        self.transformer_inv = Transformer.from_crs(
            "+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +R=1737400 +units=m +no_defs",
            "+proj=longlat +R=1737400 +no_defs",
            always_xy=True
        )

    def _load_data(self):
        if not os.path.exists(self.npz_path) or not os.path.exists(self.meta_path):
            raise FileNotFoundError("Merged dataset not found. Please run backend/data_merger.py first.")

        npz = np.load(self.npz_path)
        self.sunlight = npz["sunlight_score"]
        self.ice = npz["ice_score"]
        self.dust = npz["dust_risk_score"]
        self.landing = npz["landing_suitability_score"]
        self.radiation = npz["radiation_safety_score"]
        self.slope = npz["slope_deg"]
        self.elevation = npz["elevation_m"]
        self.is_flat = npz["is_flat"]

        with open(self.meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.grid_meta = meta["grid_meta"]
        self.named_sites = meta["named_sites"]
        self.grid_size = self.grid_meta["shape"][0]
        self.half_extent_m = self.grid_meta["bounds"]["right"]

    def compute_grid_scores(
        self,
        weights: Optional[Dict[str, float]] = None,
        apply_flatness_gate: bool = True
    ) -> np.ndarray:
        """
        Vectorized Weighted MCDA Scoring across all 160,000 cells.
        Runs in ~2ms.
        """
        if weights is None:
            weights = PRESET_PROFILES["balanced"]["weights"]

        w_sun = weights.get("sunlight", 0.30)
        w_lnd = weights.get("landing_safety", 0.25)
        w_ice = weights.get("water_ice", 0.25)
        w_rad = weights.get("radiation_safety", 0.15)
        w_dst = weights.get("dust_penalty", 0.05)

        # Normalize weights so sum of positive factors is 1.0
        total_w = w_sun + w_lnd + w_ice + w_rad
        if total_w > 0:
            w_sun /= total_w
            w_lnd /= total_w
            w_ice /= total_w
            w_rad /= total_w

        # Base multi-criteria score
        overall = (
            w_sun * self.sunlight +
            w_lnd * self.landing +
            w_ice * self.ice +
            w_rad * self.radiation
        )

        # Apply dust penalty (reduces score by up to 10 points for extreme dust boundary risk)
        dust_penalty_factor = (self.dust / 100.0) * (w_dst * 100.0)
        overall = np.clip(overall - dust_penalty_factor, 0.0, 100.0)

        # Apply flatness gate if enabled (reduces unbuildable cliff walls to 0 for habitat placement)
        if apply_flatness_gate:
            # If not flat, scale down score
            overall = np.where(self.is_flat, overall, overall * 0.15)

        return overall.astype(np.float32)

    def evaluate_named_sites(self, weights: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
        """
        Rank the 6 named real candidate sites under the given mission weights.
        """
        if weights is None:
            weights = PRESET_PROFILES["balanced"]["weights"]

        grid_scores = self.compute_grid_scores(weights=weights, apply_flatness_gate=False)
        ranked_sites = []

        w_sun = weights.get("sunlight", 0.30)
        w_lnd = weights.get("landing_safety", 0.25)
        w_ice = weights.get("water_ice", 0.25)
        w_rad = weights.get("radiation_safety", 0.15)
        w_dst = weights.get("dust_penalty", 0.05)

        for name, site in self.named_sites.items():
            r = site["grid_row"]
            c = site["grid_col"]
            score = float(grid_scores[r, c])

            # Calculate individual factor weighted contributions
            sun_contrib = float(site["sunlight_score"] * w_sun)
            lnd_contrib = float(site["landing_suitability_score"] * w_lnd)
            ice_contrib = float(site["ice_score"] * w_ice)
            rad_contrib = float(site["radiation_safety_score"] * w_rad)
            dst_penalty = float((site["dust_risk_score"] / 100.0) * (w_dst * 100.0))

            # Generate natural language physics explanation
            explanation = self._generate_explanation(name, site, score, weights)

            ranked_sites.append({
                "name": name,
                "overall_score": round(score, 2),
                "lat": site["lat"],
                "lon": site["lon"],
                "grid_row": r,
                "grid_col": c,
                "elevation_m": site["elevation_m"],
                "slope_deg": site["slope_deg"],
                "is_flat": site["is_flat"],
                "raw_metrics": {
                    "sunlight_score": site["sunlight_score"],
                    "landing_suitability_score": site["landing_suitability_score"],
                    "water_ice_score": site["ice_score"],
                    "radiation_safety_score": site["radiation_safety_score"],
                    "dust_risk_score": site["dust_risk_score"],
                    "best_nearby_landing_score": site["best_nearby_landing_score"]
                },
                "weighted_contributions": {
                    "sunlight": round(sun_contrib, 2),
                    "landing_safety": round(lnd_contrib, 2),
                    "water_ice": round(ice_contrib, 2),
                    "radiation_safety": round(rad_contrib, 2),
                    "dust_penalty": round(dst_penalty, 2)
                },
                "explanation": explanation
            })

        # Sort descending by overall score
        ranked_sites.sort(key=lambda x: x["overall_score"], reverse=True)
        for i, s in enumerate(ranked_sites, 1):
            s["rank"] = i

        return ranked_sites

    def find_top_grid_candidates(
        self,
        weights: Optional[Dict[str, float]] = None,
        top_n: int = 10,
        min_distance_km: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Discovers the absolute best habitat coordinates across the entire 400x400 grid
        using spatial non-maximum suppression to ensure geographic diversity.
        """
        grid_scores = self.compute_grid_scores(weights=weights, apply_flatness_gate=True)
        
        # Flatten and sort indices
        flat_indices = np.argsort(grid_scores.ravel())[::-1]
        
        selected_candidates = []
        min_dist_cells = min_distance_km  # 1 cell ~ 1 km

        for idx in flat_indices:
            if len(selected_candidates) >= top_n:
                break

            r, c = divmod(idx, self.grid_size)
            score = float(grid_scores[r, c])
            if score <= 10.0:
                break

            # Check distance from already selected peaks
            too_close = False
            for cand in selected_candidates:
                dist = np.sqrt((r - cand["grid_row"])**2 + (c - cand["grid_col"])**2)
                if dist < min_dist_cells:
                    too_close = True
                    break

            if not too_close:
                # Convert row/col to Polar Stereographic meters -> Lat/Lon
                x_m = (c / self.grid_size) * (2 * self.half_extent_m) - self.half_extent_m
                y_m = self.half_extent_m - (r / self.grid_size) * (2 * self.half_extent_m)
                lon, lat = self.transformer_inv.transform(x_m, y_m)

                selected_candidates.append({
                    "id": f"SITE-OPT-{len(selected_candidates)+1:02d}",
                    "rank": len(selected_candidates) + 1,
                    "overall_score": round(score, 2),
                    "lat": round(float(lat), 3),
                    "lon": round(float(lon), 3),
                    "grid_row": int(r),
                    "grid_col": int(c),
                    "elevation_m": round(float(self.elevation[r, c]), 1),
                    "slope_deg": round(float(self.slope[r, c]), 2),
                    "is_flat": bool(self.is_flat[r, c]),
                    "sunlight_score": round(float(self.sunlight[r, c]), 2),
                    "ice_score": round(float(self.ice[r, c]), 2),
                    "landing_score": round(float(self.landing[r, c]), 2),
                    "radiation_score": round(float(self.radiation[r, c]), 2),
                    "dust_risk_score": round(float(self.dust[r, c]), 2)
                })

        return selected_candidates

    def _generate_explanation(self, name: str, site: Dict[str, Any], score: float, weights: Dict[str, float]) -> str:
        """
        Physics-grounded natural language explanation of site trade-offs.
        """
        reasons = []
        if site["sunlight_score"] > 45:
            reasons.append(f"High solar illumination ({site['sunlight_score']:.1f}%) provides reliable photovoltaic energy.")
        elif site["sunlight_score"] < 15:
            reasons.append(f"Low solar illumination ({site['sunlight_score']:.1f}%) requires nuclear/fission power support.")

        if site["ice_score"] > 50:
            reasons.append(f"Direct access to cryogenic cold traps ({site['ice_score']:.1f}% ice potential) enables in-situ water extraction.")
        elif site["ice_score"] < 10:
            reasons.append("Low local ice concentration; water resources must be transported from adjacent PSR crater floors.")

        if site["landing_suitability_score"] > 70:
            reasons.append(f"Safe terrain flatness with high landing suitability ({site['landing_suitability_score']:.1f}/100).")
        else:
            reasons.append(f"Local slope is steep ({site['slope_deg']}°); optimal landing pad requires a {site.get('best_nearby_offset_km')} km offset.")

        return " ".join(reasons)

if __name__ == "__main__":
    engine = LunarScoringEngine()
    
    print("=" * 75)
    print("      LUNAR HABITAT SCORING ENGINE — MISSION PROFILES EVALUATION")
    print("=" * 75)

    for profile_key, profile in PRESET_PROFILES.items():
        print(f"\n--- PROFILE: {profile['name'].upper()} ---")
        ranked = engine.evaluate_named_sites(weights=profile["weights"])
        print(f"{'Rank':<5} | {'Site Name':<25} | {'Overall Score':<14} | {'Sun':<6} | {'Ice':<6} | {'Landing':<8}")
        print("-" * 75)
        for s in ranked:
            print(f"#{s['rank']:<4} | {s['name']:<25} | {s['overall_score']:>7.2f} / 100   | {s['raw_metrics']['sunlight_score']:>5.1f} | {s['raw_metrics']['water_ice_score']:>5.1f} | {s['raw_metrics']['landing_suitability_score']:>7.1f}")

    print("\n" + "=" * 75)
    print(" TOP 5 GLOBALLY OPTIMIZED GRID SITES ACROSS SOUTH POLE (Balanced Profile):")
    print("=" * 75)
    top_grid = engine.find_top_grid_candidates(top_n=5)
    for c in top_grid:
        print(f"#{c['rank']} {c['id']} @ (Lat: {c['lat']}°, Lon: {c['lon']}°) -> Score: {c['overall_score']:.2f} | Sun: {c['sunlight_score']} | Landing: {c['landing_score']} | Ice: {c['ice_score']}")
