#normalize_export.py
import json
import numpy as np
from pyproj import Transformer

# --- Load ---
with open(r"D:\lunar-terrain-track\elevation_grid.json", encoding="utf-8") as f:
    data = json.load(f)

meta = data["grid_meta"]
shape = meta["shape"]          # [400, 400]
bounds = meta["bounds"]        # left/right/top/bottom in meters
pixel_size = (bounds["right"] - bounds["left"]) / shape[1]  # should be 1000 m

suitability_raw = np.array(data["landing_suitability_raw"])
is_flat = np.array(data["is_flat"], dtype=bool)

# --- Step 1: final 0-100 score (no extra rescaling — raw is already 0-1 bounded) ---
final_score = np.round(suitability_raw * 100.0, 1)
data["landing_suitability_score"] = final_score.tolist()   # grid-wide array — name unchanged, not ambiguous

# --- Step 1b: NEW — standalone terrain-only score (slope + roughness, no hazard) ---
terrain_flatness_raw = np.array(data["terrain_flatness_raw"])
terrain_flatness_score = np.round(terrain_flatness_raw * 100.0, 1)
data["terrain_flatness_score"] = terrain_flatness_score.tolist()

# --- Step 2: project named sites (lat/lon -> grid row/col) ---
# Source: Moon geographic sphere. Target: Moon South Polar Stereographic (matches grid_meta).
transformer = Transformer.from_crs(
    "+proj=longlat +R=1737400 +no_defs",
    "+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +R=1737400 +units=m +no_defs",
    always_xy=True
)

named_sites = {
    "Shackleton Crater Rim": {"lat": -89.66, "lon": 129.88, "confidence": "high"},
    "de Gerlache Rim":       {"lat": -88.5,  "lon": -87.1,  "confidence": "medium (crater center used as rim proxy)"},
    "Malapert Massif": {"lat": -85.964, "lon": -2.319, "confidence": "high (NASA Artemis III-specified landing site, per NASA 2023a/2023b; not a crater-center proxy)"},
    "Faustini Rim":          {"lat": -87.3,  "lon": 77.0,   "confidence": "medium (two published coordinate sets disagree by ~7° lon)"},
    "Nobile Rim":            {"lat": -85.28, "lon": 53.27,  "confidence": "medium (crater center used as rim proxy)"},
    "Haworth Crater":        {"lat": -86.9,  "lon": -4.0,   "confidence": "high"},
}

for name, site in named_sites.items():
    x, y = transformer.transform(site["lon"], site["lat"])
    col = int((x - bounds["left"]) / pixel_size)
    row = int((bounds["top"] - y) / pixel_size)

    if 0 <= row < shape[0] and 0 <= col < shape[1]:
        site["x_m"] = x
        site["y_m"] = y
        site["row"] = row
        site["col"] = col
        site["score_at_exact_coordinate"] = round(float(final_score[row, col]), 1)
        site["terrain_flatness_score"] = round(float(terrain_flatness_score[row, col]), 1)   # NEW
        site["is_flat"] = bool(is_flat[row, col])
    else:
        site["error"] = "falls outside the 400x400 grid bounds"
        print(f"WARNING: {name} projects outside the grid — check its coordinates.")

data["named_sites"] = named_sites

# --- Save final file ---
out_path = r"D:\lunar-terrain-track\final_terrain_hazard_output.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f)

print("\n--- Named site scores ---")
for name, site in named_sites.items():
    if "score_at_exact_coordinate" in site:
        print(f"{name}: landing={site['score_at_exact_coordinate']:.1f}, terrain={site['terrain_flatness_score']:.1f}, is_flat={site['is_flat']}, confidence={site['confidence']}")
    else:
        print(f"{name}: {site.get('error')}")

print(f"\nSaved final output to {out_path}")

# --- Step 3: NEW — summary printout for visual confirmation ---
print("\n=== LAYER SUMMARY (min / max / mean) ===")
layers_to_summarize = {
    "landing_suitability_score": final_score,
    "terrain_flatness_score": terrain_flatness_score,
    "slope_deg": np.array(data["slope_deg"]),
    "roughness_m": np.array(data["roughness_m"]),
}
for layer_name, arr in layers_to_summarize.items():
    print(f"{layer_name:28s} min={np.nanmin(arr):8.2f}  max={np.nanmax(arr):8.2f}  mean={np.nanmean(arr):8.2f}")

print("\n=== Malapert Massif — corrected entry ===")
malapert = named_sites["Malapert Massif"]
for k, v in malapert.items():
    print(f"  {k}: {v}")