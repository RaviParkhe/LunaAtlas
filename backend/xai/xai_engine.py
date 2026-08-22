"""
xai/xai_engine.py
=================
Orchestrator — runs all 3 XAI layers then builds the HTML report.

Run:
    cd d:\\LunaAstraT\\LunarHabitatAI
    python -m xai.xai_engine
"""

import os, sys, time, json
import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from ml.config      import OUTPUT_DIR, FEATURE_COLUMNS
from xai.layer2_ahp_xai  import run_layer2
from xai.layer3_score_xai import run_layer3
from xai.html_report      import save_html_report

XAI_OUT = os.path.join(_HERE, "outputs")


def run_xai_pipeline():
    t0 = time.time()
    os.makedirs(XAI_OUT, exist_ok=True)

    banner = lambda msg: print(f"\n{'='*65}\n  {msg}\n{'='*65}")

    # --- Load ML outputs (needed by Layer 1) ---
    banner("Loading ML outputs")
    import joblib, pandas as pd
    from ml.data_loader    import load_merged_dataframe
    from ml.preprocessing  import run_preprocessing
    from ml.interpretation import interpret_clusters

    df, ns_sid, ns_terrain = load_merged_dataframe()
    X_scaled, scaler, feature_names = run_preprocessing(df, save=False)

    km_path = os.path.join(OUTPUT_DIR, "kmeans_model.joblib")
    km      = joblib.load(km_path)
    labels  = km.predict(X_scaled)

    with open(os.path.join(OUTPUT_DIR, "cluster_stats.json")) as f:
        cluster_profiles = {int(k): v for k, v in json.load(f).items()}

    with open(os.path.join(OUTPUT_DIR, "named_site_archetypes.json")) as f:
        site_archetypes = json.load(f)

    anomaly_flags = np.load(os.path.join(OUTPUT_DIR, "anomaly_flags.npy"))

    # --- LAYER 1: ML XAI ---
    banner("LAYER 1 -- ML Cluster Explainability")
    from xai.layer1_ml_xai import run_layer1
    l1 = run_layer1(df, X_scaled, labels, feature_names,
                    site_archetypes, cluster_profiles, save=True)

    # --- LAYER 2: AHP XAI ---
    banner("LAYER 2 -- AHP Weight Explainability")
    l2 = run_layer2(save=True)

    # --- LAYER 3: Score XAI ---
    banner("LAYER 3 -- Site Score Explainability")
    l3 = run_layer3(save=True)

    # --- HTML Report ---
    banner("Assembling HTML Report")
    report_path = save_html_report(l1, l2, l3)

    elapsed = round(time.time() - t0, 1)

    banner("XAI PIPELINE COMPLETE")
    print(f"  Total time      : {elapsed}s")
    print(f"  HTML report     : {report_path}")
    print(f"  All XAI outputs : {XAI_OUT}")
    print()
    print("  Open in browser:")
    print(f"  start {report_path}")
    print()

    return report_path


if __name__ == "__main__":
    run_xai_pipeline()
