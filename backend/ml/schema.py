"""
ml/schema.py
============
Programmatic data dictionary.

Classifies every available column as one of:
    RAW_MEASUREMENT       -- direct sensor / DEM output
    DERIVED_PHYSICAL      -- computed from raw (e.g. gradient, texture)
    DERIVED_SCORE         -- combined formula product
    PROXY                 -- indirect indicator of a quantity
    NORMALIZED_SCORE      -- derived score rescaled to 0-100
    DERIVED_BINARY        -- boolean gate derived from other features
    IDENTIFIER            -- unique cell/site ID
    SPATIAL_COORDINATE    -- lat/lon/x/y/row/col
    METADATA              -- provenance, notes, version strings

Prints a full data dictionary with statistics when run directly.
"""

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Schema definition
# ---------------------------------------------------------------------------

FIELD_CLASS = {
    # Identifiers
    "cell_id":                    "IDENTIFIER",
    "row":                        "SPATIAL_COORDINATE",
    "col":                        "SPATIAL_COORDINATE",

    # Raw / derived physical -- use in ML
    "elevation_m":                "RAW_MEASUREMENT",
    "slope_deg":                  "DERIVED_PHYSICAL",
    "roughness_m":                "DERIVED_PHYSICAL",

    # Proxy scores -- use in ML (best available for their quantity)
    "sunlight_score":             "NORMALIZED_SCORE",   # % illumination time
    "ice_score":                  "NORMALIZED_SCORE",   # permanent shadow proxy

    # Derived scores -- EXCLUDED from ML
    "dust_risk_score":            "NORMALIZED_SCORE",   # derived from illumination -> double-counts sunlight
    "crater_hazard_raw":          "DERIVED_PHYSICAL",   # near-zero mean, extreme outliers -> excluded
    "is_flat":                    "DERIVED_BINARY",     # gate = f(slope, roughness) -> redundant
    "is_suitable_gate":           "DERIVED_BINARY",     # identical to is_flat -> exact duplicate
    "landing_suitability_raw":    "DERIVED_SCORE",      # composite of slope+roughness+crater -> redundant
    "landing_suitability_score":  "NORMALIZED_SCORE",   # landing_suitability_raw x 100 -> exact linear transform
    "terrain_flatness_raw":       "DERIVED_SCORE",      # std=0.039, near-constant -> near-zero variance
    "terrain_flatness_score":     "NORMALIZED_SCORE",   # terrain_flatness_raw x 100, std=3.86 -> near-constant
}

ML_DECISION = {
    "elevation_m":                ("USE",     "Raw physical measurement -- unique signal"),
    "slope_deg":                  ("USE",     "Physically meaningful terrain descriptor"),
    "roughness_m":                ("USE",     "Independent terrain texture, not collinear with slope"),
    "sunlight_score":             ("USE",     "Best available sunlight proxy; no raw illumination grid"),
    "ice_score":                  ("USE",     "Best available ice proxy (permanent shadow persistence)"),
    "dust_risk_score":            ("EXCLUDE", "Derived from sunlight -- double-counts sunlight_score"),
    "crater_hazard_raw":          ("EXCLUDE", "Mean=0.12, max=103.7 -- extreme outlier, mostly zeros"),
    "is_flat":                    ("EXCLUDE", "Binary gate: f(slope, roughness) -- redundant with both"),
    "is_suitable_gate":           ("EXCLUDE", "Identical array to is_flat -- exact duplicate"),
    "landing_suitability_raw":    ("EXCLUDE", "Composite of slope+roughness+craters already included"),
    "landing_suitability_score":  ("EXCLUDE", "landing_suitability_raw x 100 -- adds no information"),
    "terrain_flatness_raw":       ("EXCLUDE", "std=0.039 -- near-zero variance, useless for clustering"),
    "terrain_flatness_score":     ("EXCLUDE", "terrain_flatness_raw x 100, std=3.86 -- near-constant"),
    "cell_id":                    ("EXCLUDE", "Identifier -- no environmental meaning"),
    "row":                        ("EXCLUDE", "Spatial coordinate -- geographic bias risk"),
    "col":                        ("EXCLUDE", "Spatial coordinate -- geographic bias risk"),
}

FIELD_UNITS = {
    "elevation_m":               "metres",
    "slope_deg":                 "degrees",
    "roughness_m":               "metres (elevation variability within cell)",
    "sunlight_score":            "% of time illuminated (0–53.3% max in dataset)",
    "ice_score":                 "0–100 (100 = permanent shadow = highest ice potential)",
    "dust_risk_score":           "0–100 (higher = more dust risk)",
    "crater_hazard_raw":         "density-weighted hazard (unitless)",
    "is_flat":                   "boolean (0/1)",
    "is_suitable_gate":          "boolean (0/1)",
    "landing_suitability_raw":   "0–1",
    "landing_suitability_score": "0–99.9",
    "terrain_flatness_raw":      "0.314–0.907 (unitless)",
    "terrain_flatness_score":    "31.4–90.7 (unitless)",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_data_dictionary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build a data dictionary DataFrame from actual data.

    Parameters
    ----------
    df : pd.DataFrame
        The merged DataFrame from data_loader.load_merged_dataframe()

    Returns
    -------
    pd.DataFrame with one row per column.
    """
    records = []
    for col in df.columns:
        series = df[col]
        n_missing = int(series.isna().sum())
        pct_missing = round(100 * n_missing / len(series), 2)
        n_unique = int(series.nunique())

        if pd.api.types.is_numeric_dtype(series):
            s_min  = round(float(series.min()), 4)
            s_max  = round(float(series.max()), 4)
            s_mean = round(float(series.mean()), 4)
            s_std  = round(float(series.std()), 4)
        else:
            s_min = s_max = s_mean = s_std = "N/A"

        decision, reason = ML_DECISION.get(col, ("UNCLASSIFIED", "Not in schema -- flag for review"))

        records.append({
            "field":           col,
            "dtype":           str(series.dtype),
            "classification":  FIELD_CLASS.get(col, "UNCLASSIFIED"),
            "ml_decision":     decision,
            "ml_reason":       reason,
            "units":           FIELD_UNITS.get(col, ""),
            "missing_count":   n_missing,
            "missing_pct":     pct_missing,
            "unique_values":   n_unique,
            "min":             s_min,
            "max":             s_max,
            "mean":            s_mean,
            "std":             s_std,
        })

    return pd.DataFrame(records)


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    df, _, _ = load_merged_dataframe()
    dd = build_data_dictionary(df)
    pd.set_option("display.max_columns", None)
    pd.set_option("display.max_colwidth", 60)
    pd.set_option("display.width", 200)
    print("\n=== DATA DICTIONARY ===\n")
    print(dd.to_string(index=False))
    print(f"\nUSE:     {(dd.ml_decision=='USE').sum()} features")
    print(f"EXCLUDE: {(dd.ml_decision=='EXCLUDE').sum()} features")
