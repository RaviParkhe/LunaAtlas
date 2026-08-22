"""
ml/pipeline.py
==============
Orchestrator -- runs all ML phases end-to-end in order.

Run:
    python -m ml.pipeline

Or from repo root:
    python ml/pipeline.py
"""

import os
import sys
import json
import time
import numpy as np

# Allow running as a script from repo root
_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from ml.config import OUTPUT_DIR
from ml.data_loader       import load_merged_dataframe
from ml.schema            import build_data_dictionary
from ml.preprocessing     import run_preprocessing
from ml.feature_selection import run_feature_selection_report
from ml.clustering        import run_clustering
from ml.evaluation        import compute_metrics, run_sensitivity_tests
from ml.interpretation    import interpret_clusters
from ml.anomaly_detection import run_anomaly_detection
from ml.site_assignment   import run_site_assignment
from ml.visualization     import (
    plot_spatial_cluster_map,
    plot_named_sites_overlay,
    plot_pca_2d,
    plot_cluster_feature_profiles,
    plot_k_selection_metrics,
    plot_anomaly_map,
    plot_site_archetype_comparison,
)


def run_pipeline(verbose: bool = True):
    t0 = time.time()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    banner = lambda msg: print(f"\n{'='*65}\n  {msg}\n{'='*65}")

    # ── Phase 1: Load data ───────────────────────────────────────────
    banner("PHASE 1 -- Loading & Merging Data")
    df, ns_sid, ns_terrain = load_merged_dataframe()
    print(f"  DataFrame: {df.shape[0]:,} cells x {df.shape[1]} columns")

    # ── Phase 2: Data dictionary ─────────────────────────────────────
    banner("PHASE 2 -- Data Dictionary")
    dd = build_data_dictionary(df)
    dd.to_csv(os.path.join(OUTPUT_DIR, "data_dictionary.csv"), index=False)
    print(f"  Data dictionary saved -> {os.path.join(OUTPUT_DIR, 'data_dictionary.csv')}")
    use_count     = (dd["ml_decision"] == "USE").sum()
    exclude_count = (dd["ml_decision"] == "EXCLUDE").sum()
    print(f"  Features selected: {use_count}  |  Excluded: {exclude_count}")

    # ── Phase 3: Feature selection report ────────────────────────────
    banner("PHASE 3 -- Feature Selection Analysis")
    feat_report = run_feature_selection_report(df)

    # ── Phase 4: Preprocessing ───────────────────────────────────────
    banner("PHASE 4 -- Preprocessing")
    X_scaled, scaler, feature_names = run_preprocessing(df, save=True)

    # ── Phase 5: Clustering ──────────────────────────────────────────
    banner("PHASE 5 -- Clustering (K-Means + GMM comparison)")
    labels, km_model, best_k, all_metrics = run_clustering(
        X_scaled, df, feature_names, save=True
    )

    # ── Phase 6: Evaluation metrics ──────────────────────────────────
    banner("PHASE 6 -- Evaluation Metrics")
    final_metrics = compute_metrics(X_scaled, labels, best_k)
    print(f"\n  Final model (k={best_k}) metrics:")
    print(f"    Silhouette Score:       {final_metrics['silhouette']:.4f}")
    print(f"    Davies-Bouldin Index:   {final_metrics['davies_bouldin']:.4f}")
    print(f"    Calinski-Harabasz:      {final_metrics['calinski_harabasz']:.1f}")
    print(f"    Min cluster size:       {final_metrics['min_cluster_size']:,}")
    print(f"    Max cluster size:       {final_metrics['max_cluster_size']:,}")

    with open(os.path.join(OUTPUT_DIR, "evaluation_metrics.json"), "w") as f:
        json.dump(final_metrics, f, indent=2)

    # ── Phase 7: Interpretation ───────────────────────────────────────
    banner("PHASE 7 -- Cluster Interpretation & Archetype Naming")
    cluster_profiles = interpret_clusters(df, labels, feature_names, save=True)

    # ── Phase 8: Anomaly detection ────────────────────────────────────
    banner("PHASE 8 -- Anomaly Detection (Isolation Forest)")
    anomaly_scores, anomaly_flags, top_anomalies = run_anomaly_detection(
        X_scaled, df, labels, feature_names, save=True
    )

    # ── Phase 9: Named site assignment ────────────────────────────────
    banner("PHASE 9 -- Named Candidate Site Archetype Assignment")
    site_archetypes = run_site_assignment(
        df, labels, cluster_profiles,
        ns_sid, ns_terrain,
        anomaly_flags=anomaly_flags,
        save=True,
    )

    # ── Phase 10: Sensitivity tests ───────────────────────────────────
    banner("PHASE 10 -- Sensitivity Tests")
    run_sensitivity_tests(df, save=True)

    # ── Phase 11: Cluster grid JSON (full output) ─────────────────────
    banner("PHASE 11 -- Saving Full Cluster Grid JSON")
    print("  Building cell-level cluster grid JSON (160,000 cells) ...")
    grid_records = []
    for i in range(len(labels)):
        cid  = int(labels[i])
        prof = cluster_profiles.get(cid, {})
        grid_records.append({
            "cell_id":       i,
            "row":           int(df.at[i, "row"]),
            "col":           int(df.at[i, "col"]),
            "cluster_id":    cid,
            "cluster_label": prof.get("archetype_label", f"Cluster {cid}"),
            "is_anomaly":    bool(anomaly_flags[i]),
        })
    grid_path = os.path.join(OUTPUT_DIR, "cluster_grid.json")
    with open(grid_path, "w") as f:
        json.dump(grid_records, f)
    print(f"  Cluster grid JSON saved -> {grid_path}")

    # ── Phase 12: Visualizations ──────────────────────────────────────
    banner("PHASE 12 -- Generating Visualizations")
    plot_spatial_cluster_map(labels, cluster_profiles)
    plot_named_sites_overlay(labels, cluster_profiles, site_archetypes)
    plot_pca_2d(X_scaled, labels, cluster_profiles)
    plot_cluster_feature_profiles(cluster_profiles)
    plot_k_selection_metrics(all_metrics, best_k)
    plot_anomaly_map(anomaly_flags)
    if site_archetypes:
        plot_site_archetype_comparison(site_archetypes)

    # ── Summary ───────────────────────────────────────────────────────
    elapsed = round(time.time() - t0, 1)
    banner("PIPELINE COMPLETE")
    print(f"  Total time: {elapsed}s")
    print(f"  Clusters discovered: {best_k}")
    print(f"  Silhouette: {final_metrics['silhouette']:.4f}")
    print(f"  Outputs -> {OUTPUT_DIR}")
    print()

    return {
        "best_k":          best_k,
        "metrics":         final_metrics,
        "cluster_profiles": cluster_profiles,
        "site_archetypes": site_archetypes,
        "labels":          labels,
    }


if __name__ == "__main__":
    run_pipeline()
