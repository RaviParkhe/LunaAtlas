#terrain_features.py
import numpy as np
import json

with open(r"D:\lunar-terrain-track\elevation_grid.json", encoding="utf-8") as f:
    data = json.load(f)

elevation = np.array(data["elevation_m"])
pixel_size = 1000.0

# --- SLOPE ---
dz_dy, dz_dx = np.gradient(elevation, pixel_size)
slope_rad = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
slope_deg = np.degrees(slope_rad)

print("Slope - min:", np.nanmin(slope_deg), "max:", np.nanmax(slope_deg), "mean:", np.nanmean(slope_deg))

# --- ROUGHNESS ---
from scipy.ndimage import generic_filter

def local_std(values):
    return np.std(values)

roughness = generic_filter(elevation, local_std, size=3)

print("Roughness - min:", np.nanmin(roughness), "max:", np.nanmax(roughness), "mean:", np.nanmean(roughness))

# --- FLAT-AREA % ---
FLAT_THRESHOLD_DEG = 10
is_flat = slope_deg < FLAT_THRESHOLD_DEG
flat_percent_overall = 100 * np.sum(is_flat) / is_flat.size

print(f"Overall flat area (<{FLAT_THRESHOLD_DEG} deg): {flat_percent_overall:.1f}%")

# --- NEW: TERRAIN-ONLY SCORE (slope + roughness only, no crater/boulder hazard) ---
# Slope component: 0 deg -> 1.0 (best), 90 deg -> 0.0 (worst)
slope_component = np.clip(1.0 - (slope_deg / 90.0), 0.0, 1.0)

# Roughness component: fixed reference cap, NOT a bare min-max rescale off this dataset's
# own min/max (that approach is already flagged as a weakness elsewhere in this project —
# it shifts every time you add a site). ROUGHNESS_CAP_M is a placeholder assumption:
# terrain rougher than this is treated as equally "worst." Needs a real sourced value later.
ROUGHNESS_CAP_M = 5.0
roughness_component = np.clip(1.0 - (roughness / ROUGHNESS_CAP_M), 0.0, 1.0)

terrain_flatness_raw = (slope_component + roughness_component) / 2.0

print("Terrain flatness raw - min:", np.nanmin(terrain_flatness_raw),
      "max:", np.nanmax(terrain_flatness_raw),
      "mean:", np.nanmean(terrain_flatness_raw))

# --- SAVE (once, at the end, with everything included) ---
data["slope_deg"] = slope_deg.tolist()
data["roughness_m"] = roughness.tolist()
data["is_flat"] = is_flat.astype(int).tolist()
data["terrain_flatness_raw"] = terrain_flatness_raw.tolist()

with open(r"D:\lunar-terrain-track\elevation_grid.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

print("Saved slope, roughness, flatness, and terrain_flatness_raw into elevation_grid.json")