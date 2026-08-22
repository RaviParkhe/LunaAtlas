"""
ml/feature_selection.py
========================
Investigates correlations, variance, and redundancy across all candidate
features. Produces a report confirming the USE/EXCLUDE decisions in schema.py.

Does NOT modify the feature set -- config.py is the single source of truth.
This module provides evidence for the decisions already documented in the plan.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from ml.config import FEATURE_COLUMNS, OUTPUT_DIR


# All numeric features available (before selection)
ALL_CANDIDATE_FEATURES = [
    "elevation_m", "slope_deg", "roughness_m",
    "sunlight_score", "ice_score", "dust_risk_score",
    "crater_hazard_raw", "landing_suitability_raw",
    "terrain_flatness_raw",
]


def run_feature_selection_report(df: pd.DataFrame, save: bool = True) -> dict:
    """
    Analyse all candidate features and produce a selection report.

    Returns
    -------
    dict with variance, correlation, and decision summary
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    available = [c for c in ALL_CANDIDATE_FEATURES if c in df.columns]
    X = df[available].copy()

    print("=" * 60)
    print("  FEATURE SELECTION REPORT")
    print("=" * 60)

    # --- 1. Variance check ---
    print("\n[1] Variance (low variance -> less informative):")
    variances = X.var().sort_values()
    for col, var in variances.items():
        flag = " <- NEAR-ZERO" if var < 20 else ""
        print(f"  {col:<35} var={var:.4f}{flag}")

    # --- 2. Correlation matrix ---
    print("\n[2] Pearson correlation (|r| > 0.85 = highly collinear):")
    corr = X.corr()
    high_corr_pairs = []
    cols = corr.columns.tolist()
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            r = corr.iloc[i, j]
            if abs(r) > 0.70:
                flag = "*** HIGH ***" if abs(r) > 0.85 else "  moderate"
                print(f"  {cols[i]:<30} vs {cols[j]:<30}: r={r:.3f}  {flag}")
                high_corr_pairs.append((cols[i], cols[j], round(r, 3)))

    # --- 3. Skewness ---
    print("\n[3] Skewness (|skew| > 1.5 -> log transform recommended):")
    skew = X.skew().sort_values(ascending=False)
    for col, sk in skew.items():
        flag = " <- log1p applied" if col in ["roughness_m"] and abs(sk) > 1.5 else ""
        flag2 = " <- HIGH SKEW" if abs(sk) > 1.5 and col not in ["roughness_m"] else ""
        print(f"  {col:<35} skew={sk:.3f}{flag}{flag2}")

    # --- 4. Final selection confirmation ---
    print("\n[4] Final selected features:")
    for col in FEATURE_COLUMNS:
        print(f"  [v] {col}")

    print("\n[4] Excluded features:")
    excluded = [c for c in available if c not in FEATURE_COLUMNS]
    for col in excluded:
        print(f"  [X] {col}")

    # --- 5. Correlation heatmap ---
    fig, ax = plt.subplots(figsize=(10, 8))
    mask = np.triu(np.ones_like(corr, dtype=bool))
    sns.heatmap(
        corr, mask=mask, annot=True, fmt=".2f", cmap="coolwarm",
        vmin=-1, vmax=1, ax=ax, linewidths=0.5,
        annot_kws={"size": 8}
    )
    ax.set_title("Feature Correlation Matrix (all candidates)", fontsize=12, pad=12)
    plt.tight_layout()
    plot_path = os.path.join(OUTPUT_DIR, "feature_correlation_heatmap.png")
    fig.savefig(plot_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"\n[feature_selection] Correlation heatmap saved -> {plot_path}")

    # --- 6. Variance bar chart ---
    fig2, ax2 = plt.subplots(figsize=(10, 4))
    variances.plot(kind="barh", ax=ax2, color=[
        "#2ecc71" if c in FEATURE_COLUMNS else "#e74c3c" for c in variances.index
    ])
    ax2.set_xlabel("Variance")
    ax2.set_title("Feature Variance (green=selected, red=excluded)")
    ax2.axvline(20, color="gray", linestyle="--", alpha=0.5, label="low-variance threshold")
    ax2.legend()
    plt.tight_layout()
    var_path = os.path.join(OUTPUT_DIR, "feature_variance.png")
    fig2.savefig(var_path, dpi=150, bbox_inches="tight")
    plt.close(fig2)
    print(f"[feature_selection] Variance plot saved     -> {var_path}")

    report = {
        "selected_features":  FEATURE_COLUMNS,
        "excluded_features":  excluded,
        "high_correlation_pairs": high_corr_pairs,
        "variances":          {c: round(float(v), 4) for c, v in variances.items()},
        "skewness":           {c: round(float(v), 4) for c, v in skew.items()},
    }

    if save:
        report_path = os.path.join(OUTPUT_DIR, "feature_selection_report.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"[feature_selection] Report saved            -> {report_path}")

    return report


if __name__ == "__main__":
    from ml.data_loader import load_merged_dataframe
    df, _, _ = load_merged_dataframe()
    run_feature_selection_report(df)
