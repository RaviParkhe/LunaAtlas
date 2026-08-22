"""
ml/site_assignment.py
=====================
Assigns each named candidate site to a cluster archetype.

Workflow
--------
1. Load the cluster label grid (cluster_grid.npy)
2. Load cluster stats (cluster_stats.json)
3. For each named site, look up its (row, col) from the JSON
4. Read its cluster ID from the grid
5. Compare site's feature values against its cluster's mean
6. Flag if the site is an outlier within its own cluster (> 2σ)
7. Save named_site_archetypes.json

This module does NOT train any model -- it is purely a lookup + comparison step.
"""

import os
import json
import numpy as np
import pandas as pd

from ml.config import (
    SUNLIGHT_ICE_DUST_JSON, TERRAIN_HAZARD_JSON,
    OUTPUT_DIR, FEATURE_COLUMNS,
)


def _load_site_features(ns_sid: dict, ns_terrain: dict) -> dict:
    """
    Merge named-site data from both JSON sources into a feature dict per site.
    Prefer the best_score_within_20km value where available.
    """
    merged = {}
    all_names = set(ns_sid.keys()) | set(ns_terrain.keys())

    for name in all_names:
        sid_entry   = ns_sid.get(name, {})
        terr_entry  = ns_terrain.get(name, {})

        # Spatial
        row = sid_entry.get("center_grid_row") or terr_entry.get("row")
        col = sid_entry.get("center_grid_col") or terr_entry.get("col")
        lat = sid_entry.get("lat") or terr_entry.get("lat")
        lon = sid_entry.get("lon") or terr_entry.get("lon")

        # Sunlight/ice/dust -- prefer sid direct values
        sunlight  = sid_entry.get("sunlight_score",    sid_entry.get("best_score_within_20km_search", {}).get("sunlight_score"))
        ice       = sid_entry.get("ice_score",         sid_entry.get("best_score_within_20km_search", {}).get("ice_score"))
        dust      = sid_entry.get("dust_risk_score",   sid_entry.get("best_score_within_20km_search", {}).get("dust_risk_score"))

        # Terrain -- from terrain branch entry
        elev      = terr_entry.get("score_at_exact_coordinate") and None   # not in this schema
        # terrain JSON named sites don't expose elevation/slope directly -- use grid lookup
        tf_score  = terr_entry.get("terrain_flatness_score")
        land_score = terr_entry.get("score_at_exact_coordinate")

        merged[name] = {
            "lat":            lat,
            "lon":            lon,
            "row":            row,
            "col":            col,
            "sunlight_score": sunlight,
            "ice_score":      ice,
            "dust_risk_score": dust,
            "terrain_flatness_score": tf_score,
            "landing_suitability_score": land_score,
            "confidence":     terr_entry.get("confidence", "unknown"),
            "sampling_note":  sid_entry.get("sampling_note", ""),
        }

    return merged


def run_site_assignment(
    df: pd.DataFrame,
    labels: np.ndarray,
    cluster_profiles: dict,
    ns_sid: dict,
    ns_terrain: dict,
    anomaly_flags: np.ndarray | None = None,
    save: bool = True,
) -> dict:
    """
    Assign each named site to its cluster and compare against cluster mean.

    Returns
    -------
    site_archetypes : dict  {site_name -> archetype report}
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    site_features = _load_site_features(ns_sid, ns_terrain)

    # Also look up raw feature values from the merged df using (row, col)
    df_indexed = df.copy().reset_index(drop=True)

    results = {}
    print("\n[site_assignment] Named Candidate Site Archetype Report")
    print("=" * 70)

    for site_name, info in site_features.items():
        row = info.get("row")
        col = info.get("col")

        if row is None or col is None:
            print(f"  [!!] {site_name}: missing row/col -- skipping.")
            continue

        # Look up cell in the flat DataFrame
        cell_mask = (df_indexed["row"] == row) & (df_indexed["col"] == col)
        if not cell_mask.any():
            print(f"  [!!] {site_name}: cell ({row},{col}) not found in DataFrame.")
            continue

        cell_idx   = int(cell_mask.idxmax())
        cluster_id = int(labels[cell_idx])
        profile    = cluster_profiles.get(cluster_id, {})
        archetype  = profile.get("archetype_label", f"Cluster {cluster_id}")

        # Site's actual feature values (from merged df)
        site_vals = {
            feat: float(df_indexed.at[cell_idx, feat])
            for feat in FEATURE_COLUMNS
            if feat in df_indexed.columns
        }

        # Compare to cluster mean -- flag outliers (> 2σ within cluster)
        cluster_mean = profile.get("mean", {})
        cluster_std  = profile.get("std",  {})
        deviations   = {}
        outlier_flags = {}
        for feat in FEATURE_COLUMNS:
            if feat in site_vals and feat in cluster_mean and feat in cluster_std:
                std = cluster_std[feat] or 1e-9
                dev = (site_vals[feat] - cluster_mean[feat]) / std
                deviations[feat] = round(dev, 3)
                outlier_flags[feat] = abs(dev) > 2.0

        # Anomaly flag for this cell
        is_anomaly = bool(anomaly_flags[cell_idx]) if anomaly_flags is not None else None

        report = {
            "site":              site_name,
            "lat":               info["lat"],
            "lon":               info["lon"],
            "grid_row":          row,
            "grid_col":          col,
            "cluster_id":        cluster_id,
            "archetype_label":   archetype,
            "pct_of_region":     profile.get("pct_of_region"),
            "site_feature_values": site_vals,
            "cluster_mean":      cluster_mean,
            "z_within_cluster":  deviations,
            "outlier_flags":     outlier_flags,
            "is_anomaly":        is_anomaly,
            "confidence":        info["confidence"],
            "strengths":         profile.get("strengths", []),
            "limitations":       profile.get("limitations", []),
        }
        results[site_name] = report

        print(f"\n  Site:      {site_name}")
        print(f"  Archetype: {archetype}  (Cluster {cluster_id})")
        print(f"  Features:  "
              + "  ".join(f"{k}={v:.1f}" for k, v in site_vals.items()))
        print(f"  Outlier?   "
              + "  ".join(f"{k}={'YES[!!]' if v else 'no'}" for k, v in outlier_flags.items()))
        if is_anomaly:
            print(f"  [!!] Isolation Forest flagged this cell as an environmental anomaly.")

    print("\n" + "=" * 70)

    # Cross-site archetype comparison
    print("\n[site_assignment] Archetype comparison across all sites:")
    print(f"  {'Site':<28} {'Cluster':>8} {'Archetype'}")
    for sn, rpt in results.items():
        print(f"  {sn:<28} {rpt['cluster_id']:>8}   {rpt['archetype_label']}")

    if save:
        path = os.path.join(OUTPUT_DIR, "named_site_archetypes.json")
        with open(path, "w") as f:
            json.dump(results, f, indent=2, default=float)
        print(f"\n[site_assignment] Saved -> {path}")

    return results


if __name__ == "__main__":
    import json
    from ml.data_loader import load_merged_dataframe
    from ml.preprocessing import run_preprocessing
    from ml.clustering import run_clustering
    from ml.interpretation import interpret_clusters
    df, ns_sid, ns_terrain = load_merged_dataframe()
    X_scaled, _, feat = run_preprocessing(df, save=False)
    labels, km, k, _ = run_clustering(X_scaled, df, feat, save=False)
    profiles = interpret_clusters(df, labels, feat, save=False)
    run_site_assignment(df, labels, profiles, ns_sid, ns_terrain)
