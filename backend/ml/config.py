"""
ml/config.py
============
Central configuration for the ML Pattern Discovery layer.
Edit FEATURE_COLUMNS to add radiation features when they are validated.
All other modules import from here.
"""

import os

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ML_DIR   = os.path.dirname(os.path.abspath(__file__))
_REPO_DIR = os.path.dirname(_ML_DIR)

SUNLIGHT_ICE_DUST_JSON   = os.path.join(_REPO_DIR, "sunlight_ice_dust_final.json")
TERRAIN_HAZARD_JSON      = os.path.join(_REPO_DIR, "final_terrain_hazard_output.json")
OUTPUT_DIR               = os.path.join(_ML_DIR, "outputs")

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# ML Feature columns
# ---------------------------------------------------------------------------
# These are the ONLY columns fed into the clustering model.
# Spatial coordinates (row, col, x_m, y_m, lat, lon) are excluded
# to avoid geographic bias -- they are retained for mapping only.
#
# Feature correlation findings (from Phase 3 inspection):
#   sunlight_score <-> ice_score:  r = -0.999  (near-perfect anti-correlation)
#   slope_deg      <-> roughness_m: r = +0.989  (near-perfect collinearity)
#
# Decision: keep sunlight_score (drop ice_score) -- sunlight is a direct
#   physical measurement; ice is derived from it (permanent shadow proxy).
# Decision: keep slope_deg (drop roughness_m) -- slope is more physically
#   interpretable; roughness is essentially the same signal at r=0.989.
#
# This leaves 3 independent features spanning:
#   terrain (elevation, slope) + illumination (sunlight)
#
# To add radiation features when validated:
#   1. Ensure column exists in merged DataFrame from data_loader.py
#   2. Append the column name below
#   3. Re-run pipeline.py  (scaler + model rebuilt automatically)
FEATURE_COLUMNS = [
    "elevation_m",     # Raw measurement -- DEM-derived, meters
    "slope_deg",       # Derived physical -- terrain gradient
    "sunlight_score",  # Normalized score -- % illumination time
    # roughness_m DROPPED: r=0.989 with slope_deg -- redundant
    # ice_score   DROPPED: r=-0.999 with sunlight_score -- perfect anti-correlation
    # --- Future radiation features (do NOT uncomment until validated) ---
    # "radiation_dose_msv_day",
    # "shielding_depth_gcm2",
]

# Spatial/identifier columns retained for mapping and site lookup only
SPATIAL_COLUMNS = ["cell_id", "row", "col", "x_m", "y_m", "lat", "lon"]

# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------
# roughness_m excluded due to r=0.989 with slope_deg, but kept here
# in case someone re-adds it -- log1p would still be needed.
LOG_TRANSFORM_COLUMNS = []  # roughness_m dropped from feature set

# ---------------------------------------------------------------------------
# Clustering
# ---------------------------------------------------------------------------
K_RANGE       = range(2, 11)   # k values to evaluate
K_FINAL       = None           # Set automatically by evaluation; override here if needed
GMM_COMPARE   = True           # Compare K-Means vs GMM at chosen k
DBSCAN_RUN    = False          # Skip DBSCAN -- not appropriate for full-coverage grid

# ---------------------------------------------------------------------------
# Anomaly detection
# ---------------------------------------------------------------------------
ANOMALY_CONTAMINATION = 0.02   # Isolation Forest: expect ~2% anomalies

# ---------------------------------------------------------------------------
# Visualization
# ---------------------------------------------------------------------------
GRID_SHAPE    = (400, 400)
DPI           = 150
COLORMAP_CLUSTERS = "tab10"
