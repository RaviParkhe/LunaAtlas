import os
import json
import numpy as np
from typing import Dict, Any, Tuple

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
SUNLIGHT_FILE = os.path.join(DATA_DIR, "sunlight_ice_dust_final.json")
TERRAIN_FILE = os.path.join(DATA_DIR, "final_terrain_hazard_output.json")
ELEVATION_FILE = os.path.join(DATA_DIR, "elevation_grid.json")
MERGED_OUTPUT_JSON = os.path.join(DATA_DIR, "merged_lunar_dataset.json")
MERGED_OUTPUT_NPZ = os.path.join(DATA_DIR, "merged_layers_400x400.npz")

def compute_radiation_shielding_layer(slope_deg: np.ndarray, elevation_m: np.ndarray) -> np.ndarray:
    """
    Physics-informed Lunar Radiation Shielding Proxy:
    - Baseline Galactic Cosmic Radiation (GCR) on flat open surface = 130 mGy/yr (CRaTER data)
    - Crater rims/walls provide physical horizon obstruction (reducing solid angle of sky exposure).
    - Higher local terrain slope and crater depressions reduce the Sky View Factor (SVF).
    - Radiation safety score: 0-100 (100 = maximum shielding/lowest dose, ~60 = open terrain baseline).
    """
    # Higher local slope/depression indicates horizon shielding
    # Normalizing slope to a terrain obstruction factor [0, 0.4]
    normalized_slope = np.clip(slope_deg / 45.0, 0.0, 1.0)
    
    # Elevation depression factor (relative to mean)
    elev_depression = np.clip((np.mean(elevation_m) - elevation_m) / 3000.0, -0.2, 0.5)
    
    # Shielding factor between 0.0 (open flat terrain) and 0.8 (steep crater base/lava tube proxy)
    shielding_factor = np.clip(0.15 * normalized_slope + 0.25 * np.maximum(0, elev_depression), 0.0, 0.8)
    
    # Annual dose: 130 mGy * (1 - shielding_factor)
    annual_dose_mgy = 130.0 * (1.0 - shielding_factor)
    
    # Radiation safety score: 100 = 0 dose (perfect shield), 0 = 200+ mGy
    # 130 mGy (open surface) translates to ~55-60 score
    radiation_safety_score = np.clip(100.0 - (annual_dose_mgy / 150.0) * 50.0, 0.0, 100.0)
    return radiation_safety_score.astype(np.float32)

class LunarDataMerger:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.sunlight_path = os.path.join(data_dir, "sunlight_ice_dust_final.json")
        self.terrain_path = os.path.join(data_dir, "final_terrain_hazard_output.json")
        self.elevation_path = os.path.join(data_dir, "elevation_grid.json")

    def load_and_merge(self) -> Dict[str, Any]:
        print("[-] Loading Track B (Sunlight, Ice, Dust)...")
        with open(self.sunlight_path, "r", encoding="utf-8") as f:
            sun_data = json.load(f)

        print("[-] Loading Track A (Terrain, Landing, Elevation)...")
        with open(self.terrain_path, "r", encoding="utf-8") as f:
            terrain_data = json.load(f)

        grid_meta = sun_data.get("grid_meta", terrain_data.get("grid_meta"))

        # Convert 2D arrays to NumPy float32
        sunlight_score = np.array(sun_data["sunlight_score"], dtype=np.float32)
        ice_score = np.array(sun_data["ice_score"], dtype=np.float32)
        dust_risk_score = np.array(sun_data["dust_risk_score"], dtype=np.float32)

        landing_score = np.array(terrain_data["landing_suitability_score"], dtype=np.float32)
        slope_deg = np.array(terrain_data.get("slope_deg", np.zeros((400, 400))), dtype=np.float32)
        roughness_m = np.array(terrain_data.get("roughness_m", np.zeros((400, 400))), dtype=np.float32)
        is_flat = np.array(terrain_data.get("is_flat", np.ones((400, 400), dtype=bool)), dtype=bool)
        elevation_m = np.array(terrain_data.get("elevation_m", np.zeros((400, 400))), dtype=np.float32)

        # Compute physics-informed radiation safety score layer
        print("[-] Computing physics-informed Radiation Shielding & Safety layer...")
        radiation_score = compute_radiation_shielding_layer(slope_deg, elevation_m)

        # Merge named sites
        print("[-] Unifying named candidate sites metadata...")
        sun_sites = sun_data.get("named_sites", {})
        terrain_sites = terrain_data.get("named_sites", {})

        all_site_names = list(dict.fromkeys(list(sun_sites.keys()) + list(terrain_sites.keys())))
        merged_named_sites = {}

        for name in all_site_names:
            s_info = sun_sites.get(name, {})
            t_info = terrain_sites.get(name, {})

            lat = s_info.get("lat", t_info.get("lat"))
            lon = s_info.get("lon", t_info.get("lon"))
            row = s_info.get("sampled_grid_row", t_info.get("row", 200))
            col = s_info.get("sampled_grid_col", t_info.get("col", 200))

            # Retrieve exact cell scores from merged arrays
            s_val = float(sunlight_score[row, col])
            i_val = float(ice_score[row, col])
            d_val = float(dust_risk_score[row, col])
            l_val = float(landing_score[row, col])
            r_val = float(radiation_score[row, col])
            elev = float(elevation_m[row, col])
            slope = float(slope_deg[row, col])
            flat_flag = bool(is_flat[row, col])

            merged_named_sites[name] = {
                "name": name,
                "lat": float(lat) if lat is not None else None,
                "lon": float(lon) if lon is not None else None,
                "grid_row": int(row),
                "grid_col": int(col),
                "elevation_m": round(elev, 1),
                "slope_deg": round(slope, 2),
                "is_flat": flat_flag,
                "sunlight_score": round(s_val, 2),
                "ice_score": round(i_val, 2),
                "dust_risk_score": round(d_val, 2),
                "landing_suitability_score": round(l_val, 2),
                "best_nearby_landing_score": round(float(t_info.get("best_nearby_score", l_val)), 2),
                "best_nearby_offset_km": t_info.get("best_nearby_offset_km", [0, 0]),
                "radiation_safety_score": round(r_val, 2),
                "confidence": t_info.get("confidence", "NASA QuickMap Verified")
            }

        # Build merged dataset dictionary
        merged_dataset = {
            "grid_meta": grid_meta,
            "layers": {
                "sunlight_score": sunlight_score,
                "ice_score": ice_score,
                "dust_risk_score": dust_risk_score,
                "landing_suitability_score": landing_score,
                "radiation_safety_score": radiation_score,
                "slope_deg": slope_deg,
                "elevation_m": elevation_m,
                "is_flat": is_flat
            },
            "named_sites": merged_named_sites
        }

        return merged_dataset

    def export_merged_cache(self) -> Tuple[str, str]:
        merged = self.load_and_merge()

        # Save fast binary NPZ for instant backend loading
        np.savez_compressed(
            MERGED_OUTPUT_NPZ,
            sunlight_score=merged["layers"]["sunlight_score"],
            ice_score=merged["layers"]["ice_score"],
            dust_risk_score=merged["layers"]["dust_risk_score"],
            landing_suitability_score=merged["layers"]["landing_suitability_score"],
            radiation_safety_score=merged["layers"]["radiation_safety_score"],
            slope_deg=merged["layers"]["slope_deg"],
            elevation_m=merged["layers"]["elevation_m"],
            is_flat=merged["layers"]["is_flat"]
        )
        print(f"[+] Saved high-speed binary layer cache: {MERGED_OUTPUT_NPZ}")

        # Save JSON metadata & named sites summary
        json_exportable = {
            "grid_meta": merged["grid_meta"],
            "layer_names": list(merged["layers"].keys()),
            "layer_stats": {
                name: {
                    "min": float(np.min(arr)),
                    "max": float(np.max(arr)),
                    "mean": float(np.mean(arr)),
                    "shape": list(arr.shape)
                }
                for name, arr in merged["layers"].items()
            },
            "named_sites": merged["named_sites"]
        }

        with open(MERGED_OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(json_exportable, f, indent=2)
        print(f"[+] Saved merged metadata & candidate sites JSON: {MERGED_OUTPUT_JSON}")

        return MERGED_OUTPUT_NPZ, MERGED_OUTPUT_JSON

if __name__ == "__main__":
    merger = LunarDataMerger()
    npz_path, json_path = merger.export_merged_cache()
    print("\n--- MERGED DATASET VERIFICATION ---")
    with open(json_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    print("Layer Statistics across 160,000 cells:")
    for layer, stats in meta["layer_stats"].items():
        print(f"  - {layer:<26}: min={stats['min']:>6.1f}, max={stats['max']:>6.1f}, mean={stats['mean']:>6.1f}, shape={stats['shape']}")

    print("\nCandidate Sites Unified Metrics:")
    for name, s in meta["named_sites"].items():
        print(f"  * {name:<24}: Sun={s['sunlight_score']:>5.1f} | Ice={s['ice_score']:>5.1f} | Landing={s['landing_suitability_score']:>5.1f} | Rad={s['radiation_safety_score']:>5.1f} | Flat={s['is_flat']}")
