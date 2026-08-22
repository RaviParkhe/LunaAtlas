"""
ml/anomaly_detection.py
=======================
Optional Isolation Forest anomaly detection.

Purpose: identify grid cells with unusual *combinations* of environmental
features -- not necessarily "bad" or "good", just statistically unusual.

An anomaly flag means "unusual relative to the 160k-cell population."
It does NOT mean "best site" or "unsafe site."

Decision to include: Yes -- because unusual combinations (e.g. high ice +
high sunlight in the same cell) are scientifically interesting and may
warrant manual review.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from ml.config import OUTPUT_DIR, RANDOM_SEED, ANOMALY_CONTAMINATION


def run_anomaly_detection(
    X_scaled: np.ndarray,
    df: pd.DataFrame,
    labels: np.ndarray,
    feature_names: list[str],
    save: bool = True,
) -> np.ndarray:
    """
    Run Isolation Forest on the full scaled feature matrix.

    Returns
    -------
    anomaly_scores : np.ndarray (n_cells,)
        Raw anomaly score (more negative = more anomalous).
    anomaly_flags  : np.ndarray (n_cells,) bool
        True if the cell is classified as an anomaly.
    top_anomalies  : pd.DataFrame
        Top 20 most anomalous cells with their feature values.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\n[anomaly] Running Isolation Forest "
          f"(contamination={ANOMALY_CONTAMINATION}) ...")

    iso = IsolationForest(
        contamination=ANOMALY_CONTAMINATION,
        random_state=RANDOM_SEED,
        n_estimators=200,
        n_jobs=-1,
    )
    iso.fit(X_scaled)
    raw_scores    = iso.decision_function(X_scaled)   # more negative = anomalous
    pred          = iso.predict(X_scaled)              # -1 = anomaly, +1 = normal
    anomaly_flags = pred == -1

    n_anomalies = int(anomaly_flags.sum())
    pct         = round(100 * n_anomalies / len(anomaly_flags), 2)
    print(f"[anomaly] Detected {n_anomalies:,} anomalous cells ({pct}%)")

    # Build summary DataFrame for top anomalies
    df_out = df[["row", "col"] + feature_names].copy().reset_index(drop=True)
    df_out["cluster_id"]     = labels
    df_out["anomaly_score"]  = raw_scores
    df_out["is_anomaly"]     = anomaly_flags

    top_anomalies = (
        df_out[df_out["is_anomaly"]]
        .nsmallest(20, "anomaly_score")
        [["row", "col", "cluster_id", "anomaly_score"] + feature_names]
    )

    print("\n[anomaly] Top 10 most anomalous cells:")
    pd.set_option("display.float_format", "{:.2f}".format)
    print(top_anomalies.head(10).to_string(index=False))

    if save:
        # Binary flag grid
        np.save(os.path.join(OUTPUT_DIR, "anomaly_flags.npy"),  anomaly_flags)
        np.save(os.path.join(OUTPUT_DIR, "anomaly_scores.npy"), raw_scores)

        # Top anomalies JSON
        top_records = top_anomalies.to_dict(orient="records")
        with open(os.path.join(OUTPUT_DIR, "top_anomalies.json"), "w") as f:
            json.dump(top_records, f, indent=2, default=float)

        print(f"\n[anomaly] Anomaly flags saved  -> {os.path.join(OUTPUT_DIR, 'anomaly_flags.npy')}")
        print(f"[anomaly] Top anomalies saved  -> {os.path.join(OUTPUT_DIR, 'top_anomalies.json')}")

    return raw_scores, anomaly_flags, top_anomalies


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    from ml.preprocessing import run_preprocessing
    from ml.clustering import run_clustering
    df, _, _ = load_merged_dataframe()
    X_scaled, _, feat = run_preprocessing(df, save=False)
    labels, km, k, _ = run_clustering(X_scaled, df, feat, save=False)
    run_anomaly_detection(X_scaled, df, labels, feat)
