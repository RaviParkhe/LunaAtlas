"""
ml/data_loader.py
=================
Loads and merges the two source JSON files into a single flat DataFrame.

Each row = one spatial grid cell (160,000 rows for 400x400 grid).

Columns produced
----------------
Identifiers / spatial (NOT used as ML features):
    cell_id, row, col

Environmental features (ML feature candidates):
    elevation_m, slope_deg, roughness_m,
    sunlight_score, ice_score, dust_risk_score

Additional terrain columns (excluded from ML per feature_selection.py):
    crater_hazard_raw, is_flat, is_suitable_gate,
    landing_suitability_raw, landing_suitability_score,
    terrain_flatness_raw, terrain_flatness_score

Named sites dict also returned separately for site_assignment.py.
"""

import json
import numpy as np
import pandas as pd

from ml.config import SUNLIGHT_ICE_DUST_JSON, TERRAIN_HAZARD_JSON


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _flatten_grid(arr: np.ndarray, name: str) -> pd.Series:
    """Flatten a 400x400 array to a Series in row-major order."""
    return pd.Series(arr.flatten(), name=name)


def _load_json(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_merged_dataframe() -> tuple[pd.DataFrame, dict, dict]:
    """
    Returns
    -------
    df : pd.DataFrame
        160,000 rows x all available columns.
        Column `cell_id` is the unique integer index (row * 400 + col).
    named_sites_sid : dict
        Named-site entries from sunlight_ice_dust_final.json.
    named_sites_terrain : dict
        Named-site entries from final_terrain_hazard_output.json.
    """
    sid   = _load_json(SUNLIGHT_ICE_DUST_JSON)
    terr  = _load_json(TERRAIN_HAZARD_JSON)

    grid_shape = tuple(sid["grid_meta"]["shape"])   # (400, 400)
    n_rows, n_cols = grid_shape
    total_cells = n_rows * n_cols

    # --- Build row / col index arrays ---
    rows = np.repeat(np.arange(n_rows), n_cols)
    cols = np.tile(np.arange(n_cols), n_rows)

    df = pd.DataFrame({
        "cell_id":  np.arange(total_cells, dtype=np.int32),
        "row":      rows.astype(np.int16),
        "col":      cols.astype(np.int16),
    })

    # --- Source A: sunlight_ice_dust_final.json ---
    for key in ["sunlight_score", "ice_score", "dust_risk_score"]:
        arr = np.array(sid[key], dtype=np.float32)
        assert arr.shape == grid_shape, f"Shape mismatch for {key}: {arr.shape}"
        df[key] = arr.flatten()

    # --- Source B: final_terrain_hazard_output.json ---
    terrain_keys = [
        "elevation_m", "slope_deg", "roughness_m",
        "is_flat", "crater_hazard_raw", "is_suitable_gate",
        "landing_suitability_raw", "landing_suitability_score",
        "terrain_flatness_raw", "terrain_flatness_score",
    ]
    for key in terrain_keys:
        if key in terr:
            arr = np.array(terr[key], dtype=np.float32)
            assert arr.shape == grid_shape, f"Shape mismatch for {key}: {arr.shape}"
            df[key] = arr.flatten()
        else:
            print(f"  [data_loader] WARNING: '{key}' not found in terrain JSON -- skipping.")

    return df, sid.get("named_sites", {}), terr.get("named_sites", {})


def get_grid_meta() -> dict:
    """Return the grid_meta dict from the primary source JSON."""
    sid = _load_json(SUNLIGHT_ICE_DUST_JSON)
    return sid["grid_meta"]


if __name__ == "__main__":
    df, ns_sid, ns_terr = load_merged_dataframe()
    print(f"Merged DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"Named sites (SID): {list(ns_sid.keys())}")
    print(f"Named sites (terrain): {list(ns_terr.keys())}")
    print(df.describe().T.to_string())
