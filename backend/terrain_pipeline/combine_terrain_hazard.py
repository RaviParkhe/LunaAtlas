import json
import numpy as np

with open(r"D:\lunar-terrain-track\elevation_grid.json", encoding="utf-8") as f:
    data = json.load(f)

slope = np.array(data["slope_deg"])
roughness = np.array(data["roughness_m"])
is_flat = np.array(data["is_flat"], dtype=bool)
hazard_raw = np.array(data["crater_hazard_raw"], dtype=float)

print("slope_deg range:", slope.min(), "to", slope.max())
print("roughness_m range:", roughness.min(), "to", roughness.max())
print("is_flat: True =", is_flat.sum(), "/ False =", (~is_flat).sum())
print("crater_hazard_raw range:", hazard_raw.min(), "to", hazard_raw.max())

# Normalize each factor 0-1, using stats from gated (flat) cells only
def normalize_gated(arr, gate):
    gated_vals = arr[gate]
    lo, hi = gated_vals.min(), gated_vals.max()
    if hi == lo:  # guard against divide-by-zero if a factor has no variation
        return np.zeros_like(arr, dtype=float)
    return (arr - lo) / (hi - lo)

slope_norm = normalize_gated(slope, is_flat)
roughness_norm = normalize_gated(roughness, is_flat)
hazard_norm = normalize_gated(hazard_raw, is_flat)

# Combine — equal weighting for now, flagged as a placeholder for dashboard reweighting later
WEIGHT_SLOPE = 1/3
WEIGHT_ROUGHNESS = 1/3
WEIGHT_HAZARD = 1/3

suitability_raw = 1 - (WEIGHT_SLOPE * slope_norm
                       + WEIGHT_ROUGHNESS * roughness_norm
                       + WEIGHT_HAZARD * hazard_norm)
suitability_raw[~is_flat] = 0.0

data["is_suitable_gate"] = is_flat.tolist()
data["landing_suitability_raw"] = suitability_raw.tolist()

with open(r"D:\lunar-terrain-track\elevation_grid.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

print("\nDone. landing_suitability_raw range (gated cells only):",
      suitability_raw[is_flat].min(), "to", suitability_raw[is_flat].max())