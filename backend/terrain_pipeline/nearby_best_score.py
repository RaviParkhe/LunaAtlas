#nearby_best_score.py
import json
import numpy as np

# --- Load the final output you already saved ---
path = r"D:\lunar-terrain-track\final_terrain_hazard_output.json"
with open(path, encoding="utf-8") as f:
    data = json.load(f)

final_score = np.array(data["landing_suitability_score"])
is_flat = np.array(data["is_flat"], dtype=bool)
named_sites = data["named_sites"]

shape = final_score.shape  # (400, 400)
RADIUS_KM = 5  # search a 5km box around each site's center cell (grid is 1km/cell)

print("--- Exact coordinate score vs. best nearby score (5km search radius) ---\n")

for name, site in named_sites.items():
    if "row" not in site:
        print(f"{name}: skipped, no valid grid position")
        continue

    r, c = site["row"], site["col"]

    r_lo, r_hi = max(0, r - RADIUS_KM), min(shape[0], r + RADIUS_KM + 1)
    c_lo, c_hi = max(0, c - RADIUS_KM), min(shape[1], c + RADIUS_KM + 1)

    window_score = final_score[r_lo:r_hi, c_lo:c_hi]
    window_flat = is_flat[r_lo:r_hi, c_lo:c_hi]

    if window_flat.any():
        # only consider cells that pass the flatness gate
        masked = np.where(window_flat, window_score, -1)
        best_idx_flat = np.unravel_index(np.argmax(masked), masked.shape)
        best_score = round(float(masked[best_idx_flat]), 1)
        best_row_offset = (best_idx_flat[0] + r_lo) - r
        best_col_offset = (best_idx_flat[1] + c_lo) - c

        site["best_score_within_5km"] = best_score
        site["best_offset_km_from_exact_coordinate"] = [int(best_row_offset), int(best_col_offset)]

        print(f"{name}:")
        print(f"  score at exact coordinate = {site['score_at_exact_coordinate']:.1f} (is_flat={site['is_flat']})")
        print(f"  best nearby               = {best_score:.1f}  (offset {best_row_offset}km row, {best_col_offset}km col from exact coordinate)")
    else:
        site["best_score_within_5km"] = None
        print(f"{name}: NO flat cells found within {RADIUS_KM}km — this site's whole neighborhood is steep. Flag this in your writeup, don't just drop it.")
    print()

# --- Save back into the same final file ---
data["named_sites"] = named_sites
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f)

print(f"Updated {path} with best_score_within_5km for each site.")