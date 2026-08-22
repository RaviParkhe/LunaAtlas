"""
ml/clustering.py
================
Runs K-Means clustering over the full 400x400 grid.
Optionally compares with Gaussian Mixture Model at the chosen k.

Primary output
--------------
labels : np.ndarray shape (160000,)  -- integer cluster IDs per cell
model  : fitted KMeans (or GMM)
k      : chosen number of clusters
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture

from ml.config import (
    K_RANGE, K_FINAL, GMM_COMPARE,
    OUTPUT_DIR, RANDOM_SEED,
)
from ml.evaluation import compute_metrics


# ---------------------------------------------------------------------------
# K selection
# ---------------------------------------------------------------------------

def select_k(X_scaled: np.ndarray, feature_names: list[str]) -> tuple[int, dict]:
    """
    Evaluate K-Means for each k in K_RANGE.

    Returns
    -------
    best_k      : int
    all_metrics : dict  {k -> metric dict}
    """
    print("\n[clustering] Evaluating K-Means for k = "
          f"{list(K_RANGE)[0]} to {list(K_RANGE)[-1]} ...")

    all_metrics = {}
    for k in K_RANGE:
        km = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10, max_iter=500)
        labels = km.fit_predict(X_scaled)
        metrics = compute_metrics(X_scaled, labels, k)
        all_metrics[k] = metrics
        print(
            f"  k={k:2d}  Silhouette={metrics['silhouette']:.4f}  "
            f"DB={metrics['davies_bouldin']:.4f}  "
            f"CH={metrics['calinski_harabasz']:.1f}  "
            f"min_cluster={metrics['min_cluster_size']}"
        )

    # --- Selection logic: balance silhouette + DB + min cluster size ---
    valid_ks = {
        k: m for k, m in all_metrics.items()
        if m["min_cluster_size"] >= 500  # reject degenerate micro-clusters
    }
    if not valid_ks:
        valid_ks = all_metrics  # fall back if all have small clusters

    # Score = silhouette − 0.2 * normalised_DB (both range 0-1 approx)
    db_vals = [m["davies_bouldin"] for m in valid_ks.values()]
    db_max  = max(db_vals) if db_vals else 1.0
    scored  = {
        k: m["silhouette"] - 0.2 * (m["davies_bouldin"] / db_max)
        for k, m in valid_ks.items()
    }
    best_k = max(scored, key=scored.get)

    print(f"\n[clustering] Best k selected: {best_k}  "
          f"(silhouette={all_metrics[best_k]['silhouette']:.4f})")

    return best_k, all_metrics


# ---------------------------------------------------------------------------
# K-Means fit
# ---------------------------------------------------------------------------

def fit_kmeans(X_scaled: np.ndarray, k: int) -> tuple[np.ndarray, KMeans]:
    """Fit K-Means with the chosen k. Returns labels and fitted model."""
    print(f"\n[clustering] Fitting K-Means k={k} ...")
    km = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=20, max_iter=1000)
    labels = km.fit_predict(X_scaled)
    sizes  = {int(c): int((labels == c).sum()) for c in np.unique(labels)}
    print(f"[clustering] Cluster sizes: {sizes}")
    return labels, km


# ---------------------------------------------------------------------------
# GMM comparison
# ---------------------------------------------------------------------------

def fit_gmm(X_scaled: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray, GaussianMixture]:
    """
    Fit Gaussian Mixture Model at the same k.

    Uses covariance_type='diag' + reg_covar for numerical stability.
    The sunlight_score / ice_score pair has r=-0.999 (near-singular with 'full').
    float64 cast also required per sklearn recommendation.

    Returns
    -------
    hard_labels : np.ndarray  (argmax of probabilities)
    proba       : np.ndarray  (n_cells, k) -- soft assignment probabilities
    gmm         : fitted GaussianMixture
    """
    print(f"\n[clustering] Fitting GMM k={k} for comparison ...")
    # Cast to float64 -- sklearn GMM is sensitive to float32 precision
    X64 = X_scaled.astype(np.float64)
    try:
        gmm = GaussianMixture(
            n_components=k, random_state=RANDOM_SEED,
            covariance_type="diag",   # robust to near-collinear features
            reg_covar=1e-3,            # regularise covariance
            n_init=5, max_iter=500,
        )
        gmm.fit(X64)
    except ValueError as e:
        print(f"[clustering] GMM fit failed: {e}")
        print("[clustering] Skipping GMM comparison -- K-Means result stands.")
        return _kmeans_labels_cache.copy(), None, None

    proba       = gmm.predict_proba(X64)
    hard_labels = np.argmax(proba, axis=1)
    agreement   = np.mean(hard_labels == _kmeans_labels_cache)
    print(f"[clustering] K-Means / GMM label agreement: {100*agreement:.1f}%")
    return hard_labels, proba, gmm


_kmeans_labels_cache = None  # filled after K-Means fit, used by GMM comparison


# ---------------------------------------------------------------------------
# Geographic bias check
# ---------------------------------------------------------------------------

def geographic_bias_check(
    X_scaled: np.ndarray,
    df_spatial: "pd.DataFrame",
    k: int,
    feature_names: list[str],
) -> dict:
    """
    Compare Model A (env only) vs Model B (env + spatial).
    Returns agreement rate and metrics for both.
    """
    import pandas as pd
    from sklearn.preprocessing import StandardScaler

    # Model A labels (already computed)
    labels_A, _ = fit_kmeans(X_scaled, k)

    # Model B: add normalised row/col
    row_scaled = StandardScaler().fit_transform(
        df_spatial[["row", "col"]].values.astype(float)
    )
    X_B = np.hstack([X_scaled, row_scaled])
    labels_B, _ = fit_kmeans(X_B, k)

    # Agreement (modulo label permutation -- use overlap heuristic)
    from scipy.stats import mode as sp_mode
    # remap B labels to best-matching A labels
    mapping = {}
    for b_lbl in np.unique(labels_B):
        mask   = labels_B == b_lbl
        result = sp_mode(labels_A[mask])
        # scipy >= 1.9 returns ModeResult with .mode as scalar or array
        mode_val = result.mode
        if hasattr(mode_val, '__len__'):
            mode_val = mode_val[0]
        mapping[b_lbl] = int(mode_val)
    labels_B_remapped = np.array([mapping[l] for l in labels_B])
    agreement = float(np.mean(labels_A == labels_B_remapped))

    print(f"\n[geo_bias] Model A vs B label agreement (after remapping): {100*agreement:.1f}%")
    if agreement > 0.80:
        print("[geo_bias] [v] High agreement -- spatial coords do NOT dominate cluster structure.")
    else:
        print("[geo_bias] [!!] Lower agreement -- spatial proximity has some influence.")

    return {"model_A_env_only_agreement_with_B": round(agreement, 4)}


# ---------------------------------------------------------------------------
# Main run function
# ---------------------------------------------------------------------------

def run_clustering(
    X_scaled: np.ndarray,
    df: "pd.DataFrame",
    feature_names: list[str],
    save: bool = True,
) -> tuple[np.ndarray, KMeans, int, dict]:
    """
    Full clustering run: k-selection -> K-Means fit -> optional GMM -> geo-bias check.

    Returns
    -------
    labels       : np.ndarray (160000,)
    km_model     : fitted KMeans
    best_k       : int
    all_metrics  : dict {k -> metrics}
    """
    global _kmeans_labels_cache
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Override k if set in config
    if K_FINAL is not None:
        best_k    = K_FINAL
        all_metrics = {}
        print(f"[clustering] Using manually set K_FINAL={best_k}")
    else:
        best_k, all_metrics = select_k(X_scaled, feature_names)

    labels, km_model = fit_kmeans(X_scaled, best_k)
    _kmeans_labels_cache = labels.copy()

    # GMM comparison
    gmm_agreement = None
    if GMM_COMPARE:
        gmm_labels, gmm_proba, gmm_model = fit_gmm(X_scaled, best_k)
        if gmm_labels is not None:
            gmm_agreement = float(np.mean(labels == gmm_labels))
            print(f"[clustering] K-Means/GMM direct agreement: {100*gmm_agreement:.1f}%")
            if save and gmm_model is not None:
                joblib.dump(gmm_model, os.path.join(OUTPUT_DIR, "gmm_model.joblib"))
        else:
            print("[clustering] GMM skipped -- K-Means result is the primary model.")

    # Geographic bias check
    geo = geographic_bias_check(X_scaled, df, best_k, feature_names)

    if save:
        # K-Means model
        km_path = os.path.join(OUTPUT_DIR, "kmeans_model.joblib")
        joblib.dump(km_model, km_path)
        print(f"\n[clustering] K-Means model saved -> {km_path}")

        # Cluster labels grid
        np.save(os.path.join(OUTPUT_DIR, "cluster_grid.npy"), labels)

        # Metrics summary
        summary = {
            "best_k":            best_k,
            "gmm_agreement":     gmm_agreement,
            "geographic_bias":   geo,
            "k_metrics":         {str(k): v for k, v in all_metrics.items()},
        }
        with open(os.path.join(OUTPUT_DIR, "clustering_summary.json"), "w") as f:
            json.dump(summary, f, indent=2)

    return labels, km_model, best_k, all_metrics


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    from ml.preprocessing import run_preprocessing
    df, _, _ = load_merged_dataframe()
    X_scaled, scaler, feat_names = run_preprocessing(df)
    labels, km, k, metrics = run_clustering(X_scaled, df, feat_names)
    print(f"\nFinal k={k}, unique labels: {np.unique(labels)}")
