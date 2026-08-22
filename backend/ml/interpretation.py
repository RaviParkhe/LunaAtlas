"""
ml/interpretation.py
====================
Derives interpretable archetype names and statistics for each cluster.

Naming is done AFTER the model runs -- based entirely on cluster centroid
statistics, not on pre-defined assumptions.

Algorithm
---------
1. Compute mean of each feature per cluster (in original unscaled space)
2. Compare each cluster mean against the global mean (z-score in cluster space)
3. Identify the 1–2 most distinctive features (highest absolute deviation)
4. Assign a name based on those dominant characteristics
"""

import os
import json
import numpy as np
import pandas as pd

from ml.config import OUTPUT_DIR, FEATURE_COLUMNS


# ---------------------------------------------------------------------------
# Feature descriptor vocabulary
# (used to build archetype names from data -- not pre-defined labels)
# ---------------------------------------------------------------------------

_FEATURE_HIGH = {
    "elevation_m":    "High-Elevation",
    "slope_deg":      "High-Slope",
    "roughness_m":    "Rough-Terrain",
    "sunlight_score": "Solar-Exposed",
    "ice_score":      "Ice-Rich",
}

_FEATURE_LOW = {
    "elevation_m":    "Low-Elevation",
    "slope_deg":      "Low-Slope",
    "roughness_m":    "Smooth-Terrain",
    "sunlight_score": "Shadow-Dominated",
    "ice_score":      "Ice-Sparse",
}

_FEATURE_MEANING = {
    "elevation_m":    "terrain elevation",
    "slope_deg":      "terrain slope",
    "roughness_m":    "surface roughness",
    "sunlight_score": "solar illumination",
    "ice_score":      "ice potential (shadow proxy)",
}


def _archetype_name_from_zscores(z: dict[str, float]) -> str:
    """
    Build an archetype name from the 1–2 most distinctive feature z-scores.
    z > +1.0 -> 'HIGH', z < -1.0 -> 'LOW', otherwise 'moderate'.
    """
    sorted_feats = sorted(z.items(), key=lambda x: abs(x[1]), reverse=True)
    parts = []
    for feat, zval in sorted_feats[:2]:
        if abs(zval) < 0.6:
            continue
        if zval > 0:
            parts.append(_FEATURE_HIGH.get(feat, f"High-{feat}"))
        else:
            parts.append(_FEATURE_LOW.get(feat, f"Low-{feat}"))
    if not parts:
        return "Undifferentiated Environment"
    return " / ".join(parts) + " Environment"


# ---------------------------------------------------------------------------
# Core interpretation
# ---------------------------------------------------------------------------

def interpret_clusters(
    df: pd.DataFrame,
    labels: np.ndarray,
    feature_names: list[str],
    save: bool = True,
) -> dict:
    """
    Parameters
    ----------
    df           : merged DataFrame (unscaled -- original feature values)
    labels       : cluster ID per cell (160000,)
    feature_names: list of feature column names

    Returns
    -------
    cluster_profiles : dict  {cluster_id (int) -> profile dict}
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    df_feat = df[feature_names].copy().reset_index(drop=True)

    # Reverse log1p for roughness_m to get original-scale stats
    # (df already has raw values, so no action needed)

    global_means = df_feat.mean()
    global_stds  = df_feat.std()

    cluster_profiles = {}
    n_total = len(labels)
    unique_clusters = sorted(np.unique(labels))

    print("\n[interpretation] Cluster profiles (original feature space):\n")
    print(f"{'Cluster':<10} {'N cells':>8} {'%':>6}  "
          + "  ".join(f"{f[:10]:>10}" for f in feature_names))
    print("-" * (10 + 8 + 6 + 14 * len(feature_names)))

    for cid in unique_clusters:
        mask = labels == cid
        n    = int(mask.sum())
        pct  = round(100 * n / n_total, 2)

        subset = df_feat[mask]
        means  = subset.mean()
        medians = subset.median()
        stds   = subset.std()
        mins   = subset.min()
        maxs   = subset.max()

        # z-score of this cluster's mean relative to global distribution
        z = ((means - global_means) / (global_stds + 1e-9)).to_dict()

        # Build name from dominant z-scores
        archetype = _archetype_name_from_zscores(z)

        print(f"  C{cid:<8} {n:>8} {pct:>5.1f}%  "
              + "  ".join(f"{means[f]:>10.2f}" for f in feature_names))

        # Strengths and limitations
        strengths = []
        limitations = []
        for feat, zval in z.items():
            meaning = _FEATURE_MEANING.get(feat, feat)
            if feat == "sunlight_score" and zval > 0.5:
                strengths.append(f"Comparatively high {meaning} ({means[feat]:.1f})")
            if feat == "sunlight_score" and zval < -0.5:
                limitations.append(f"Comparatively low {meaning} ({means[feat]:.1f})")
            if feat == "ice_score" and zval > 0.5:
                strengths.append(f"Elevated ice potential ({means[feat]:.1f})")
            if feat == "ice_score" and zval < -0.5:
                limitations.append(f"Lower ice potential ({means[feat]:.1f})")
            if feat == "slope_deg" and zval < -0.5:
                strengths.append(f"Comparatively gentle slope ({means[feat]:.1f}deg)")
            if feat == "slope_deg" and zval > 0.5:
                limitations.append(f"Elevated slope ({means[feat]:.1f}deg) may affect construction")
            if feat == "roughness_m" and zval < -0.5:
                strengths.append(f"Smoother surface ({means[feat]:.0f} m roughness)")
            if feat == "roughness_m" and zval > 0.5:
                limitations.append(f"Higher surface roughness ({means[feat]:.0f} m)")
            if feat == "elevation_m" and zval > 0.5:
                strengths.append(f"Higher elevation may improve comms/sightlines ({means[feat]:.0f} m)")
            if feat == "elevation_m" and zval < -0.5:
                limitations.append(f"Below-average elevation ({means[feat]:.0f} m)")

        profile = {
            "cluster_id":       int(cid),
            "archetype_label":  archetype,
            "n_cells":          n,
            "pct_of_region":    pct,
            "mean":             {f: round(float(means[f]), 3) for f in feature_names},
            "median":           {f: round(float(medians[f]), 3) for f in feature_names},
            "std":              {f: round(float(stds[f]), 3) for f in feature_names},
            "min":              {f: round(float(mins[f]), 3) for f in feature_names},
            "max":              {f: round(float(maxs[f]), 3) for f in feature_names},
            "z_vs_global_mean": {f: round(float(v), 3) for f, v in z.items()},
            "strengths":        strengths,
            "limitations":      limitations,
            "dominant_features": sorted(z.items(), key=lambda x: abs(x[1]), reverse=True)[:2],
        }
        cluster_profiles[int(cid)] = profile

    # Print archetype names
    print("\n[interpretation] Discovered Archetypes:")
    for cid, prof in cluster_profiles.items():
        print(f"  Cluster {cid}: {prof['archetype_label']}  "
              f"({prof['n_cells']:,} cells, {prof['pct_of_region']}%)")

    if save:
        path = os.path.join(OUTPUT_DIR, "cluster_stats.json")
        with open(path, "w") as f:
            json.dump(cluster_profiles, f, indent=2)
        print(f"\n[interpretation] Cluster stats saved -> {path}")

    return cluster_profiles


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    from ml.preprocessing import run_preprocessing
    from ml.clustering import run_clustering
    df, _, _ = load_merged_dataframe()
    X_scaled, _, feat = run_preprocessing(df, save=False)
    labels, km, k, _ = run_clustering(X_scaled, df, feat, save=False)
    interpret_clusters(df, labels, feat)
