"""
ml/preprocessing.py
===================
Reproducible preprocessing pipeline.

Steps
-----
1. Select FEATURE_COLUMNS from merged DataFrame
2. Verify no missing values
3. Apply log1p transform to right-skewed columns (roughness_m)
4. StandardScaler -- zero mean, unit variance
5. Save scaler + feature list to disk for future re-use / radiation addition

Output
------
X_scaled : np.ndarray  shape (160000, n_features)
scaler   : fitted StandardScaler
pipeline saved to OUTPUT_DIR/preprocessing_pipeline.joblib
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler

from ml.config import (
    FEATURE_COLUMNS, LOG_TRANSFORM_COLUMNS,
    OUTPUT_DIR, RANDOM_SEED,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_preprocessing(df: pd.DataFrame, save: bool = True) -> tuple[np.ndarray, StandardScaler, list[str]]:
    """
    Parameters
    ----------
    df   : merged DataFrame from data_loader
    save : if True, serialise the pipeline to OUTPUT_DIR

    Returns
    -------
    X_scaled       : np.ndarray (n_cells, n_features) -- scaled feature matrix
    scaler         : fitted StandardScaler
    feature_names  : list of column names in X_scaled order
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # --- 1. Select features ---
    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Feature columns not in DataFrame: {missing_cols}")

    X = df[FEATURE_COLUMNS].copy()
    feature_names = list(FEATURE_COLUMNS)

    print(f"[preprocessing] Selected {len(feature_names)} features: {feature_names}")

    # --- 2. Missing value check ---
    n_missing = X.isna().sum()
    if n_missing.any():
        print(f"[preprocessing] WARNING -- missing values found:\n{n_missing[n_missing > 0]}")
        print("[preprocessing] Filling with column medians.")
        for col in X.columns:
            if X[col].isna().any():
                X[col] = X[col].fillna(X[col].median())
    else:
        print("[preprocessing] No missing values -- all clear.")

    # --- 3. Log1p transform for right-skewed columns ---
    log_cols_applied = []
    for col in LOG_TRANSFORM_COLUMNS:
        if col in X.columns:
            min_val = X[col].min()
            if min_val < 0:
                print(f"[preprocessing] WARNING: {col} has negative values -- skipping log1p.")
            else:
                X[col] = np.log1p(X[col])
                log_cols_applied.append(col)
                print(f"[preprocessing] Applied log1p to '{col}' (original max was very right-skewed).")

    # --- 4. Distribution summary before scaling ---
    print("\n[preprocessing] Feature stats before scaling (after log transforms):")
    print(X.describe().T[["mean", "std", "min", "max"]].round(3).to_string())

    # --- 5. Standard scaling ---
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X.values)
    print(f"\n[preprocessing] Scaled matrix shape: {X_scaled.shape}")
    print(f"[preprocessing] Scaled means (should be ~0): {X_scaled.mean(axis=0).round(6)}")
    print(f"[preprocessing] Scaled stds  (should be ~1): {X_scaled.std(axis=0).round(6)}")

    # --- 6. Save pipeline ---
    if save:
        pipeline_meta = {
            "feature_columns":      feature_names,
            "log_transform_columns": log_cols_applied,
            "scaler_mean":          scaler.mean_.tolist(),
            "scaler_scale":         scaler.scale_.tolist(),
            "n_samples_fit":        int(X_scaled.shape[0]),
            "n_features":           int(X_scaled.shape[1]),
            "note": (
                "Add radiation feature column names to ml/config.py FEATURE_COLUMNS, "
                "then re-run pipeline.py to rebuild scaler and model."
            ),
        }
        scaler_path = os.path.join(OUTPUT_DIR, "preprocessing_pipeline.joblib")
        meta_path   = os.path.join(OUTPUT_DIR, "preprocessing_meta.json")

        joblib.dump({"scaler": scaler, "feature_names": feature_names,
                     "log_transform_columns": log_cols_applied}, scaler_path)
        with open(meta_path, "w") as f:
            json.dump(pipeline_meta, f, indent=2)

        print(f"\n[preprocessing] Pipeline saved -> {scaler_path}")
        print(f"[preprocessing] Metadata saved  -> {meta_path}")

    return X_scaled, scaler, feature_names


def load_pipeline(path: str | None = None) -> dict:
    """Load a previously saved preprocessing pipeline."""
    if path is None:
        path = os.path.join(OUTPUT_DIR, "preprocessing_pipeline.joblib")
    return joblib.load(path)


def transform_new_data(df_new: pd.DataFrame, pipeline: dict) -> np.ndarray:
    """
    Apply the saved preprocessing to new data (e.g. after adding radiation features).

    Parameters
    ----------
    df_new   : DataFrame containing at least pipeline['feature_names'] columns
    pipeline : loaded pipeline dict from load_pipeline()
    """
    feature_names = pipeline["feature_names"]
    log_cols      = pipeline.get("log_transform_columns", [])
    scaler        = pipeline["scaler"]

    X = df_new[feature_names].copy()
    for col in log_cols:
        X[col] = np.log1p(X[col])

    return scaler.transform(X.values)


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    df, _, _ = load_merged_dataframe()
    X_scaled, scaler, feat_names = run_preprocessing(df)
    print(f"\nDone. X_scaled shape: {X_scaled.shape}")
