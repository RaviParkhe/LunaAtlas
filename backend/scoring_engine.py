import os
import json
import re
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

FACTOR_DISPLAY_NAMES = {
    "sunlight": "Solar Illumination Availability",
    "landing_safety": "Landing Flatness & Touchdown Safety",
    "water_ice": "Water Ice Potential (PSR Cold Traps)",
    "radiation_safety": "Terrain Horizon Radiation Shielding",
    "dust_penalty": "Electrostatic Dust Levitation Risk"
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

        # Load Radiation Model V1 data if available
        self.radiation_v1_data = {}
        rad_v1_path = os.path.join(DATA_DIR, "radiation", "radiation_v1_output.json")
        if not os.path.exists(rad_v1_path):
            rad_v1_path = os.path.join(os.path.dirname(__file__), "radiation", "radiation_v1_output.json")
        if os.path.exists(rad_v1_path):
            try:
                with open(rad_v1_path, "r", encoding="utf-8") as rf:
                    self.radiation_v1_data = json.load(rf).get("named_sites", {})
            except Exception:
                self.radiation_v1_data = {}
        self.half_extent_m = self.grid_meta["bounds"]["right"]

    def compute_grid_scores(
        self,
        weights: Optional[Dict[str, float]] = None,
        apply_flatness_gate: bool = True,
        space_weather_alert: str = "NORMAL"
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

        # Dynamic space weather penalty modifier
        rad_layer = self.radiation.copy()
        if space_weather_alert == "HIGH":
            rad_layer = np.clip(rad_layer * 0.70, 0.0, 100.0)
        elif space_weather_alert == "ELEVATED":
            rad_layer = np.clip(rad_layer * 0.85, 0.0, 100.0)

        # Base multi-criteria score
        overall = (
            w_sun * self.sunlight +
            w_lnd * self.landing +
            w_ice * self.ice +
            w_rad * rad_layer
        )

        # Apply dust penalty
        dust_penalty_factor = (self.dust / 100.0) * (w_dst * 100.0)
        overall = np.clip(overall - dust_penalty_factor, 0.0, 100.0)

        # Apply flatness gate if enabled (reduces unbuildable cliff walls to 0 for habitat placement)
        if apply_flatness_gate:
            overall = np.where(self.is_flat, overall, overall * 0.15)

        return overall.astype(np.float32)

    def evaluate_named_sites(
        self,
        weights: Optional[Dict[str, float]] = None,
        space_weather_alert: str = "NORMAL"
    ) -> List[Dict[str, Any]]:
        """
        Rank the 6 named candidate sites under the given mission weights with full XAI.
        """
        if weights is None:
            weights = PRESET_PROFILES["balanced"]["weights"]

        grid_scores = self.compute_grid_scores(
            weights=weights,
            apply_flatness_gate=False,
            space_weather_alert=space_weather_alert
        )
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

            # Calculate XAI Factor-Level Risk Profile
            risk_profile = self.calculate_risk_profile(site, space_weather_alert)

            # Calculate Ice Detection Confidence
            ice_confidence = self.compute_ice_confidence(site)

            # Generate natural language physics mission briefing
            briefing = self.generate_mission_briefing(name, site, score, weights, ice_confidence, space_weather_alert)

            # Derive formatted unique location ID (e.g. LUN-8942-2731)
            lat_val = site["lat"]
            lon_val = site["lon"]
            unique_id = f"LUN-{abs(round(lat_val * 100)):04d}-{abs(round(lon_val * 100)):04d}"

            ranked_sites.append({
                "name": name,
                "unique_id": unique_id,
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
                "risk_profile": risk_profile,
                "ice_confidence": ice_confidence,
                "radiation_v1": self.radiation_v1_data.get(name, {
                    "svf": 0.95,
                    "radiation_dose_mSv_per_year": 270.0,
                    "radiation_score": round(site["radiation_safety_score"], 1),
                    "extrapolation_flag": False
                }),
                "mission_briefing": briefing,
                "explanation": briefing
            })

        # Sort descending by overall score
        ranked_sites.sort(key=lambda x: x["overall_score"], reverse=True)
        for i, s in enumerate(ranked_sites, 1):
            s["rank"] = i

        return ranked_sites

    def calculate_risk_profile(self, site: Dict[str, Any], space_weather_alert: str = "NORMAL") -> Dict[str, Any]:
        """
        Evaluate 5-factor risk classification (LOW / MEDIUM / HIGH) with dynamic solar overrides.
        """
        profile = {}

        # 1. Terrain / Slope Risk
        slope = site.get("slope_deg", 5.0)
        if slope <= 3.0:
            slope_risk = "LOW"
        elif slope <= 7.0:
            slope_risk = "MEDIUM"
        else:
            slope_risk = "HIGH"
        profile["slope"] = {"level": slope_risk, "value": f"{slope}°", "label": "Terrain Gradient"}

        # 2. Solar Illumination Risk
        sun = site.get("sunlight_score", 40.0)
        if sun >= 45.0:
            sun_risk = "LOW"
        elif sun >= 20.0:
            sun_risk = "MEDIUM"
        else:
            sun_risk = "HIGH"
        profile["illumination"] = {"level": sun_risk, "value": f"{sun:.1f}%", "label": "Illumination Availability"}

        # 3. Water Ice Access Risk
        ice = site.get("ice_score", 30.0)
        if ice >= 40.0:
            ice_risk = "LOW"
        elif ice >= 15.0:
            ice_risk = "MEDIUM"
        else:
            ice_risk = "HIGH"
        profile["water_ice"] = {"level": ice_risk, "value": f"{ice:.1f}/100", "label": "Water Ice Access"}

        # 4. Radiation Hazard Risk
        rad = site.get("radiation_safety_score", 60.0)
        if space_weather_alert == "HIGH":
            rad_risk = "HIGH"
            note = "Active Solar Storm Alert"
        elif space_weather_alert == "ELEVATED":
            rad_risk = "MEDIUM"
            note = "Elevated Solar Flux"
        else:
            rad_risk = "LOW" if rad >= 55.0 else ("MEDIUM" if rad >= 35.0 else "HIGH")
            note = "Quiet Solar Activity"
        profile["radiation"] = {"level": rad_risk, "value": f"{rad:.1f}/100", "label": "Radiation Exposure", "note": note}

        # 5. Dust Levitation Risk
        dust = site.get("dust_risk_score", 45.0)
        dust_risk = "LOW" if dust <= 40.0 else ("MEDIUM" if dust <= 65.0 else "HIGH")
        profile["dust"] = {"level": dust_risk, "value": f"{dust:.1f}/100", "label": "Electrostatic Dust"}

        return profile

    def compute_ice_confidence(self, site: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule-based ice detection confidence index (0-100%) combining LEND neutron flux + cold trap proxy.
        """
        ice_score = site.get("ice_score", 25.0)
        sun_score = site.get("sunlight_score", 45.0)
        shadow_proxy = max(0.0, 100.0 - sun_score)

        # 60% weight on neutron spectrometer proxy, 40% on permanent shadow thermal model
        confidence_raw = (0.60 * ice_score) + (0.40 * shadow_proxy)
        confidence_pct = round(float(confidence_raw), 1)

        if confidence_pct >= 60.0:
            label = "High PSR Deposit Probability"
        elif confidence_pct >= 35.0:
            label = "Moderate Volatile Signatures"
        else:
            label = "Low Volatile Concentration"

        return {
            "confidence_pct": confidence_pct,
            "label": label,
            "lend_neutron_proxy": round(float(ice_score), 1),
            "psr_shadow_proxy": round(float(shadow_proxy), 1)
        }

    def generate_mission_briefing(
        self,
        name: str,
        site: Dict[str, Any],
        score: float,
        weights: Dict[str, float],
        ice_conf: Dict[str, Any],
        space_weather_alert: str = "NORMAL"
    ) -> str:
        """
        Generates 3-sentence actionable executive mission briefing.
        """
        sun = site.get("sunlight_score", 45.0)
        ice = site.get("ice_score", 30.0)
        slope = site.get("slope_deg", 2.0)
        lat = site.get("lat", -89.0)
        lon = site.get("lon", 0.0)

        # Sentence 1: Ranking & Location Overview
        s1 = f"{name} ({abs(lat):.2f}°S, {abs(lon):.2f}°E) achieves an overall suitability score of {score:.1f}/100."

        # Sentence 2: Key Operational Advantage
        if sun >= 45.0:
            s2 = f"Primary advantage is exceptional solar illumination ({sun:.1f}%), providing continuous photovoltaic power generation."
        elif ice >= 40.0:
            s2 = f"Primary advantage is direct proximity to cryogenic PSR cold traps with {ice_conf['confidence_pct']}% water ice detection confidence."
        else:
            s2 = f"Primary advantage is optimal touchdown safety with gentle slopes ({slope}° gradient) facilitating base construction."

        # Sentence 3: Risk / Mitigation Caveat
        if space_weather_alert != "NORMAL":
            s3 = f"Operational Caveat: Active solar storm conditions ({space_weather_alert}) require habitat regolith berm shielding deployment."
        elif slope > 5.0:
            s3 = f"Operational Caveat: Local terrain gradient is steep ({slope}°), necessitating a separate landing zone offset for heavy landers."
        else:
            s3 = f"Operational Caveat: Electrostatic dust accumulation requires active seal maintenance and automated brush cleaning cycles."

        return f"{s1} {s2} {s3}"

    def extract_weights_from_nlp(self, prompt_text: str) -> Dict[str, Any]:
        """
        Deterministic NLP Parser: extracts 5-factor normalized weights from freeform text statements.
        """
        lower = prompt_text.lower()
        weights = {"sunlight": 0.25, "landing_safety": 0.25, "water_ice": 0.25, "radiation_safety": 0.25}

        keywords = {
            "water_ice": ["water", "ice", "h2o", "isru", "hydrogen", "cabeus", "shackleton", "volatile", "mining"],
            "sunlight": ["sun", "solar", "sunlight", "illumination", "power", "energy", "photovoltaic", "light"],
            "radiation_safety": ["radiation", "shielding", "cosmic", "dose", "storm", "crater floor", "hazard", "safety"],
            "landing_safety": ["slope", "flat", "flatness", "terrain", "construction", "roughness", "gradient", "landing", "pad"],
        }

        boost_words = ["prioritize", "priority", "important", "critical", "focus", "need", "essential", "primary", "above all", "maximize", "high"]
        reduce_words = ["secondary", "ignore", "less", "minor", "minimal", "don't care", "dont care", "low"]

        for factor, words in keywords.items():
            if any(w in lower for w in words):
                if any(bw in lower for bw in boost_words):
                    weights[factor] += 0.35
                else:
                    weights[factor] += 0.15

            if any(rw in lower and any(w in lower for w in words) for rw in reduce_words):
                weights[factor] = max(0.05, weights[factor] - 0.15)

        total = sum(weights.values())
        normalized_weights = {k: round(v / total, 4) for k, v in weights.items()}
        normalized_weights["dust_penalty"] = 0.05

        return {
            "input_text": prompt_text,
            "weights": normalized_weights,
            "weights_percent": {
                "flatness": round(normalized_weights["landing_safety"] * 100),
                "sunlight": round(normalized_weights["sunlight"] * 100),
                "waterIce": round(normalized_weights["water_ice"] * 100),
                "radiation": round(normalized_weights["radiation_safety"] * 100)
            }
        }

    def compare_scenarios(
        self,
        weights_a: Dict[str, float],
        weights_b: Dict[str, float],
        label_a: str = "Scenario A",
        label_b: str = "Scenario B"
    ) -> Dict[str, Any]:
        """
        What-If scenario delta comparison between two distinct parameter configurations.
        """
        eval_a = self.evaluate_named_sites(weights=weights_a)
        eval_b = self.evaluate_named_sites(weights=weights_b)

        top_a = eval_a[0]
        top_b = eval_b[0]

        site_comparisons = []
        for sa in eval_a:
            sb = next((s for s in eval_b if s["name"] == sa["name"]), None)
            if sb:
                score_delta = round(sb["overall_score"] - sa["overall_score"], 2)
                rank_delta = sa["rank"] - sb["rank"] # positive = rank improved
                site_comparisons.append({
                    "name": sa["name"],
                    "score_a": sa["overall_score"],
                    "score_b": sb["overall_score"],
                    "delta": score_delta,
                    "rank_a": sa["rank"],
                    "rank_b": sb["rank"],
                    "rank_shift": rank_delta
                })

        # Generate comparison narration
        if top_a["name"] == top_b["name"]:
            narration = (
                f"Under both '{label_a}' and '{label_b}', {top_a['name']} remains the top candidate site "
                f"(score changed by {top_b['overall_score'] - top_a['overall_score']:+.1f} points)."
            )
        else:
            narration = (
                f"Shifting priority from '{label_a}' to '{label_b}' causes top ranking to switch from "
                f"{top_a['name']} (#{top_a['rank']}) to {top_b['name']} (#{top_b['rank']}), reflecting the adjusted factor trade-offs."
            )

        return {
            "scenario_a": {"label": label_a, "weights": weights_a, "top_site": top_a["name"]},
            "scenario_b": {"label": label_b, "weights": weights_b, "top_site": top_b["name"]},
            "narration": narration,
            "site_comparisons": site_comparisons
        }

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
        flat_indices = np.argsort(grid_scores.ravel())[::-1]
        selected_candidates = []
        min_dist_cells = min_distance_km

        for idx in flat_indices:
            if len(selected_candidates) >= top_n:
                break

            r, c = divmod(idx, self.grid_size)
            score = float(grid_scores[r, c])
            if score <= 10.0:
                break

            too_close = False
            for cand in selected_candidates:
                dist = np.sqrt((r - cand["grid_row"])**2 + (c - cand["grid_col"])**2)
                if dist < min_dist_cells:
                    too_close = True
                    break

            if not too_close:
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
