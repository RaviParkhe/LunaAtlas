"""
ml/evaluation.py
================
Clustering quality metrics and sensitivity tests.

Metrics used
------------
- Silhouette Score        (maximize, -1 to +1)
- Davies-Bouldin Index    (minimize, lower is better)
- Calinski-Harabasz Index (maximize, higher is better)
- Cluster size statistics (reject degenerate micro-clusters)
"""

import os
import json
import numpy as np
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
)

from ml.config import OUTPUT_DIR, RANDOM_SEED, FEATURE_COLUMNS


# ---------------------------------------------------------------------------
# Core metric computation
# ---------------------------------------------------------------------------

def compute_metrics(X: np.ndarray, labels: np.ndarray, k: int) -> dict:
    """
    Compute all clustering quality metrics for a given label assignment.

    Uses a sample of 10,000 cells for silhouette (full 160k is slow).
    """
    n = len(labels)
    sample_size = min(10_000, n)

    rng = np.random.default_rng(RANDOM_SEED)
    idx = rng.choice(n, size=sample_size, replace=False)
    X_s, labels_s = X[idx], labels[idx]

    unique, counts = np.unique(labels, return_counts=True)

    # Guard: silhouette requires at least 2 non-empty clusters
    if len(unique) < 2:
        sil = -1.0
    else:
        sil = float(silhouette_score(X_s, labels_s, random_state=RANDOM_SEED))

    db  = float(davies_bouldin_score(X, labels))
    ch  = float(calinski_harabasz_score(X, labels))

    return {
        "k":                  k,
        "silhouette":         round(sil, 6),
        "davies_bouldin":     round(db, 6),
        "calinski_harabasz":  round(ch, 2),
        "cluster_sizes":      {int(u): int(c) for u, c in zip(unique, counts)},
        "min_cluster_size":   int(counts.min()),
        "max_cluster_size":   int(counts.max()),
        "n_cells":            n,
    }


# ---------------------------------------------------------------------------
# Sensitivity tests
# ---------------------------------------------------------------------------

def run_sensitivity_tests(df: "pd.DataFrame", save: bool = True) -> dict:
    """
    Compare cluster structure under different feature sets.

    Tests
    -----
    Model A : full feature set (terrain + sunlight + ice)
    Model B : terrain only (elevation + slope + roughness)
    Model C : raw features without normalized scores
              (elevation + slope + roughness + sunlight + ice -- same as A for this data)

    Also tests k=best, k=best-1, k=best+1 for stability.
    """
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    import numpy as np

    print("\n[evaluation] Running sensitivity tests ...")

    results = {}

    feature_sets = {
        "ModelA_full":        ["elevation_m", "slope_deg", "roughness_m", "sunlight_score", "ice_score"],
        "ModelB_terrain_only": ["elevation_m", "slope_deg", "roughness_m"],
        "ModelC_no_ice":      ["elevation_m", "slope_deg", "roughness_m", "sunlight_score"],
    }

    # Use the best k from the full pipeline if available
    cluster_summary_path = os.path.join(OUTPUT_DIR, "clustering_summary.json")
    if os.path.exists(cluster_summary_path):
        with open(cluster_summary_path) as f:
            cs = json.load(f)
        best_k = cs.get("best_k", 5)
    else:
        best_k = 5

    k_variants = [max(2, best_k - 1), best_k, min(10, best_k + 1)]

    for model_name, feat_cols in feature_sets.items():
        available = [c for c in feat_cols if c in df.columns]
        if len(available) < 2:
            print(f"  [sensitivity] Skipping {model_name} -- insufficient columns.")
            continue

        X = df[available].copy()
        # log1p roughness if present
        if "roughness_m" in X.columns:
            X["roughness_m"] = np.log1p(X["roughness_m"])
        X_sc = StandardScaler().fit_transform(X.values)

        model_results = {}
        for k in k_variants:
            km = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10, max_iter=300)
            lbl = km.fit_predict(X_sc)
            m = compute_metrics(X_sc, lbl, k)
            model_results[k] = m
            print(f"  {model_name:30s}  k={k}  sil={m['silhouette']:.4f}  "
                  f"DB={m['davies_bouldin']:.4f}  CH={m['calinski_harabasz']:.1f}")

        results[model_name] = model_results

    if save:
        path = os.path.join(OUTPUT_DIR, "sensitivity_tests.json")
        with open(path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n[evaluation] Sensitivity results saved -> {path}")

    return results


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    from ml.preprocessing import run_preprocessing
    df, _, _ = load_merged_dataframe()
    X_scaled, _, feat = run_preprocessing(df, save=False)
    from sklearn.cluster import KMeans
    km = KMeans(n_clusters=5, random_state=RANDOM_SEED, n_init=10).fit(X_scaled)
    m = compute_metrics(X_scaled, km.labels_, 5)
    print("Metrics at k=5:", m)
    run_sensitivity_tests(df)
