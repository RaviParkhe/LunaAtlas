"""
xai/layer1_ml_xai.py
====================
Layer 1 XAI — Explains the ML clustering decisions.

Outputs
-------
1. SHAP cluster summary plot  (shap_cluster_summary.png)
2. Cluster delta report        (cluster_delta_report.txt / .json)
3. Decision boundary plot      (decision_boundary_elev_sun.png)
4. Counterfactual explanations (counterfactuals.json / .txt)
"""

import os, sys, json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from sklearn.preprocessing import StandardScaler

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from ml.config import FEATURE_COLUMNS, OUTPUT_DIR, RANDOM_SEED

XAI_OUT = os.path.join(_HERE, "outputs")
ML_OUT  = OUTPUT_DIR
PALETTE = ["#2196F3", "#FF5722", "#4CAF50", "#9C27B0", "#FF9800"]


# ---------------------------------------------------------------------------
# 1a. SHAP cluster explanation
# ---------------------------------------------------------------------------

def run_shap_explanation(X_scaled: np.ndarray, labels: np.ndarray,
                         feature_names: list, cluster_profiles: dict,
                         save: bool = True) -> dict:
    """
    Use SHAP KernelExplainer to explain which features drive cluster membership.
    Proxy model: for each cell, predict distance to each cluster centroid.
    SHAP values show which feature pushes a cell toward its assigned cluster.
    """
    try:
        import shap
    except ImportError:
        print("[xai-L1] shap not installed. Run: pip install shap")
        return {}

    from sklearn.cluster import KMeans as _KMeans
    import joblib
    _km_orig = joblib.load(os.path.join(ML_OUT, "kmeans_model.joblib"))
    k        = _km_orig.n_clusters

    # Sample background and foreground in float64
    rng    = np.random.default_rng(RANDOM_SEED)
    bg_idx = rng.choice(len(X_scaled), 300, replace=False)
    fg_idx = rng.choice(len(X_scaled), 100, replace=False)
    X_bg   = X_scaled[bg_idx].astype(np.float64)
    X_fg   = X_scaled[fg_idx].astype(np.float64)

    # Retrain a fresh float64 KMeans from original centroids (avoids Cython dtype issue)
    km64 = _KMeans(n_clusters=k, n_init=1, max_iter=1,
                   random_state=RANDOM_SEED, init=_km_orig.cluster_centers_.astype(np.float64))
    km64.fit(X_bg)   # quick 1-iter fit to initialise internal state
    # Force centroids to match original
    km64.cluster_centers_ = _km_orig.cluster_centers_.astype(np.float64)

    def cluster_strength(X):
        X64     = np.asarray(X, dtype=np.float64)
        dists   = km64.transform(X64)
        assigned = km64.predict(X64)
        return np.array([-dists[i, assigned[i]] for i in range(len(X64))], dtype=np.float64)

    print("[xai-L1] Running SHAP KernelExplainer (this may take ~30s) ...")
    explainer   = shap.KernelExplainer(cluster_strength, X_bg)
    shap_values = explainer.shap_values(X_fg, nsamples=50, silent=True)
    shap_arr    = np.array(shap_values)   # (100, n_features)

    # Mean absolute SHAP per feature
    mean_abs = np.abs(shap_arr).mean(axis=0)
    shap_importance = {feature_names[i]: round(float(mean_abs[i]), 5)
                       for i in range(len(feature_names))}

    print("[xai-L1] SHAP feature importance:")
    for feat, val in sorted(shap_importance.items(), key=lambda x: -x[1]):
        bar = "#" * int(val / max(mean_abs) * 30)
        print(f"  {feat:<20} {bar} {val:.4f}")

    # Summary bar chart
    fig, ax = plt.subplots(figsize=(7, 4))
    feats  = list(shap_importance.keys())
    vals   = [shap_importance[f] for f in feats]
    colors = [PALETTE[i % len(PALETTE)] for i in range(len(feats))]
    ax.barh(feats, vals, color=colors, edgecolor="white")
    ax.set_xlabel("Mean |SHAP value| (contribution to cluster membership)")
    ax.set_title("SHAP Feature Importance for Cluster Assignment\n"
                 "(higher = stronger driver of cluster membership)")
    ax.axvline(0, color="black", lw=0.5)
    plt.tight_layout()

    result = {"shap_importance": shap_importance, "n_background": 300, "n_foreground": 100}

    if save:
        path = os.path.join(XAI_OUT, "shap_cluster_summary.png")
        fig.savefig(path, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"[xai-L1] SHAP plot saved -> {path}")
        with open(os.path.join(XAI_OUT, "shap_importance.json"), "w") as f:
            json.dump(result, f, indent=2)

    return result


# ---------------------------------------------------------------------------
# 1b. Cluster delta narrative
# ---------------------------------------------------------------------------

def build_cluster_delta_report(site_archetypes: dict, cluster_profiles: dict,
                                feature_names: list, save: bool = True) -> dict:
    """
    Generate a natural-language sentence per feature per site explaining
    how the site compares to its cluster mean.
    """
    report = {}
    lines  = ["CLUSTER DELTA REPORT — Lunar Habitat Site Selector", "=" * 60, ""]

    for site_name, rpt in site_archetypes.items():
        site_lines = [f"Site: {site_name}",
                      f"Archetype: {rpt['archetype_label']}  (Cluster {rpt['cluster_id']})", ""]
        sentences  = []

        sv = rpt.get("site_feature_values", {})
        cm = rpt.get("cluster_mean", {})
        zz = rpt.get("z_within_cluster", {})
        of = rpt.get("outlier_flags", {})

        for feat in feature_names:
            if feat not in sv:
                continue
            site_val  = sv[feat]
            clus_mean = cm.get(feat, 0)
            z         = zz.get(feat, 0)
            is_out    = of.get(feat, False)

            direction = "above" if z > 0 else "below"
            magnitude = "slightly" if abs(z) < 0.5 else \
                        "moderately" if abs(z) < 1.0 else \
                        "notably" if abs(z) < 2.0 else "significantly (outlier)"

            unit_map = {"elevation_m": "m", "slope_deg": "deg", "sunlight_score": "%"}
            unit = unit_map.get(feat, "")

            sentence = (
                f"{feat.replace('_', ' ').title()}: "
                f"{site_val:.1f}{unit} vs cluster mean {clus_mean:.1f}{unit} "
                f"(z={z:+.2f}) — {magnitude} {direction} cluster average."
            )
            if is_out:
                sentence += " [OUTLIER > 2 standard deviations]"
            sentences.append(sentence)
            site_lines.append(f"  {sentence}")

        site_lines.append("")
        lines.extend(site_lines)
        report[site_name] = {
            "archetype":   rpt["archetype_label"],
            "cluster_id":  rpt["cluster_id"],
            "narratives":  sentences,
        }

    full_text = "\n".join(lines)
    print(full_text)

    if save:
        txt_path  = os.path.join(XAI_OUT, "cluster_delta_report.txt")
        json_path = os.path.join(XAI_OUT, "cluster_delta_report.json")
        with open(txt_path,  "w", encoding="utf-8") as f:
            f.write(full_text)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"[xai-L1] Delta report saved -> {txt_path}")

    return report


# ---------------------------------------------------------------------------
# 1c. Decision boundary visualisation
# ---------------------------------------------------------------------------

def plot_decision_boundary(X_scaled: np.ndarray, labels: np.ndarray,
                           df: pd.DataFrame, feature_names: list,
                           site_archetypes: dict, save: bool = True):
    """
    2D decision boundary: elevation_m vs sunlight_score.
    Background = colour-coded cluster regions, foreground = named sites.
    """
    import joblib
    km = joblib.load(os.path.join(ML_OUT, "kmeans_model.joblib"))
    k  = km.n_clusters

    # Use original (unscaled) values for axes
    feat_a = "elevation_m"
    feat_b = "sunlight_score"
    if feat_a not in feature_names or feat_b not in df.columns:
        print("[xai-L1] Required features not available for boundary plot.")
        return

    # Build meshgrid in unscaled space, scale for prediction
    # Load scaler
    from ml.preprocessing import load_pipeline
    pipe   = load_pipeline()
    scaler = pipe["scaler"]

    a_min, a_max = df[feat_a].min(), df[feat_a].max()
    b_min, b_max = df[feat_b].min(), df[feat_b].max()

    xx, yy = np.meshgrid(
        np.linspace(a_min, a_max, 200),
        np.linspace(b_min, b_max, 200),
    )

    # For 3-feature model: fix slope_deg at its mean
    n_feats = len(feature_names)
    slope_idx  = feature_names.index("slope_deg") if "slope_deg" in feature_names else None
    elev_idx   = feature_names.index(feat_a)
    sun_idx    = feature_names.index(feat_b)

    grid_raw = np.full((xx.ravel().shape[0], n_feats), df[feature_names].mean().values)
    grid_raw[:, elev_idx] = xx.ravel()
    grid_raw[:, sun_idx]  = yy.ravel()
    grid_sc  = scaler.transform(grid_raw)
    zz       = km.predict(grid_sc).reshape(xx.shape)

    colors = ["#AED6F1", "#FADBD8", "#A9DFBF"][:k]
    from matplotlib.colors import ListedColormap
    cmap = ListedColormap(colors)

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.contourf(xx, yy, zz, alpha=0.45, cmap=cmap, levels=k - 1)
    ax.contour(xx, yy, zz, colors="white", linewidths=0.8, alpha=0.6)

    # Scatter all grid cells (sampled)
    rng      = np.random.default_rng(RANDOM_SEED)
    sample   = rng.choice(len(df), 3000, replace=False)
    site_pal = PALETTE[:k]
    for cid in range(k):
        mask = labels[sample] == cid
        ax.scatter(
            df[feat_a].values[sample][mask],
            df[feat_b].values[sample][mask],
            c=site_pal[cid], s=1, alpha=0.3, rasterized=True,
        )

    # Named sites
    sc_pal = plt.cm.get_cmap("tab10")
    for i, (name, rpt) in enumerate(site_archetypes.items()):
        row = rpt.get("grid_row")
        col = rpt.get("grid_col")
        if row is None:
            continue
        cell_mask = (df["row"] == row) & (df["col"] == col)
        if not cell_mask.any():
            continue
        idx = int(cell_mask.idxmax())
        ax.scatter(df.at[idx, feat_a], df.at[idx, feat_b],
                   s=160, zorder=10, edgecolors="white", linewidths=1.5,
                   color=sc_pal(i / 6), marker="*")
        ax.annotate(name.split()[0], xy=(df.at[idx, feat_a], df.at[idx, feat_b]),
                    xytext=(8, 4), textcoords="offset points",
                    fontsize=7.5, color="white",
                    bbox=dict(boxstyle="round,pad=0.2", fc="black", alpha=0.5))

    legend_patches = [
        mpatches.Patch(color=colors[c],
                       label=f"C{c}: {cluster_profiles.get(c, {}).get('archetype_label','')[:25]}")
        for c in range(k)
    ]
    ax.legend(handles=legend_patches, fontsize=8, loc="upper right")
    ax.set_xlabel(f"Elevation (m)")
    ax.set_ylabel(f"Sunlight Score (%)")
    ax.set_title("Cluster Decision Boundary — Elevation vs Sunlight\n"
                 "(background shading = cluster region; stars = named sites)")
    plt.tight_layout()

    if save:
        path = os.path.join(XAI_OUT, "decision_boundary_elev_sun.png")
        fig.savefig(path, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"[xai-L1] Decision boundary saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 1d. Counterfactual explanations
# ---------------------------------------------------------------------------

def build_counterfactuals(df: pd.DataFrame, X_scaled: np.ndarray, labels: np.ndarray,
                          feature_names: list, site_archetypes: dict,
                          save: bool = True) -> dict:
    """
    For each named site: find the minimum feature change that moves it
    to a different cluster.
    Uses perturbation steps of 5%, 10%, 20%, 50%, 100% of feature range.
    """
    import joblib
    from ml.preprocessing import load_pipeline
    from sklearn.cluster import KMeans as _KMeans

    _km_orig = joblib.load(os.path.join(ML_OUT, "kmeans_model.joblib"))
    km64     = _KMeans(n_clusters=_km_orig.n_clusters, n_init=1, max_iter=1,
                       random_state=RANDOM_SEED,
                       init=_km_orig.cluster_centers_.astype(np.float64))
    # Fit with a tiny float64 sample to initialise, then override centroids
    rng_cf   = np.random.default_rng(RANDOM_SEED)
    _tiny    = X_scaled[rng_cf.choice(len(X_scaled), 50)].astype(np.float64)
    km64.fit(_tiny)
    km64.cluster_centers_ = _km_orig.cluster_centers_.astype(np.float64)

    pipe   = load_pipeline()
    scaler = pipe["scaler"]

    feat_ranges = {f: (df[f].min(), df[f].max()) for f in feature_names if f in df.columns}
    perturbations = [0.05, 0.10, 0.20, 0.50, 1.00]

    results  = {}
    txt_lines = ["COUNTERFACTUAL EXPLANATIONS", "=" * 60, ""]

    for site_name, rpt in site_archetypes.items():
        row = rpt.get("grid_row")
        col = rpt.get("grid_col")
        if row is None:
            results[site_name] = {"error": "no grid location"}
            continue

        cell_mask = (df["row"] == row) & (df["col"] == col)
        if not cell_mask.any():
            continue
        idx        = int(cell_mask.idxmax())
        orig_vals  = {f: float(df.at[idx, f]) for f in feature_names if f in df.columns}
        orig_clust = int(labels[idx])
        orig_arch  = rpt["archetype_label"]

        cfs   = []
        found = {}

        for feat in feature_names:
            if feat not in feat_ranges:
                continue
            f_min, f_max = feat_ranges[feat]
            f_range      = f_max - f_min

            for pct in perturbations:
                for direction in [+1, -1]:
                    delta      = direction * pct * f_range
                    new_vals   = orig_vals.copy()
                    new_vals[feat] = np.clip(orig_vals[feat] + delta,
                                             f_min, f_max)
                    X_new  = np.array([[new_vals[f] for f in feature_names]], dtype=np.float64)
                    X_sc   = scaler.transform(X_new).astype(np.float64)
                    new_cl = int(km64.predict(X_sc)[0])

                    if new_cl != orig_clust:
                        new_arch = "Unknown"
                        try:
                            with open(os.path.join(ML_OUT, "cluster_stats.json")) as f:
                                cs = json.load(f)
                            new_arch = cs.get(str(new_cl), {}).get("archetype_label", f"Cluster {new_cl}")
                        except Exception:
                            pass

                        dir_str = "increased" if direction > 0 else "decreased"
                        unit_map = {"elevation_m": "m", "slope_deg": "deg", "sunlight_score": "%"}
                        unit = unit_map.get(feat, "")
                        cf = {
                            "feature":        feat,
                            "direction":      dir_str,
                            "change_pct":     pct * 100,
                            "original_value": round(orig_vals[feat], 2),
                            "new_value":      round(new_vals[feat], 2),
                            "unit":           unit,
                            "from_cluster":   orig_clust,
                            "to_cluster":     new_cl,
                            "from_archetype": orig_arch,
                            "to_archetype":   new_arch,
                            "sentence": (
                                f"If {feat.replace('_',' ')} were {dir_str} by {pct*100:.0f}% "
                                f"({orig_vals[feat]:.1f}{unit} -> {new_vals[feat]:.1f}{unit}), "
                                f"{site_name} would move from '{orig_arch}' "
                                f"to '{new_arch}'."
                            ),
                        }
                        cfs.append(cf)
                        if feat not in found:
                            found[feat] = cf
                        break
                if feat in found:
                    break

        results[site_name] = {
            "original_cluster":   orig_clust,
            "original_archetype": orig_arch,
            "counterfactuals":    found,
        }

        txt_lines.append(f"Site: {site_name}  [{orig_arch}]")
        if found:
            for feat, cf in found.items():
                txt_lines.append(f"  * {cf['sentence']}")
        else:
            txt_lines.append("  * No single-feature perturbation up to 100% range changes cluster.")
        txt_lines.append("")

    full_text = "\n".join(txt_lines)
    print(full_text)

    if save:
        json_path = os.path.join(XAI_OUT, "counterfactuals.json")
        txt_path  = os.path.join(XAI_OUT, "counterfactuals_report.txt")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, default=float)
        with open(txt_path,  "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"[xai-L1] Counterfactuals saved -> {json_path}")

    return results


# Hold cluster_profiles for use in counterfactuals
cluster_profiles = {}


def run_layer1(df, X_scaled, labels, feature_names, site_archetypes, _cluster_profiles, save=True):
    global cluster_profiles
    cluster_profiles = _cluster_profiles
    os.makedirs(XAI_OUT, exist_ok=True)
    print("\n[xai-L1] === LAYER 1: ML CLUSTER EXPLAINABILITY ===")

    shap_result = run_shap_explanation(X_scaled, labels, feature_names, _cluster_profiles, save)
    delta_report = build_cluster_delta_report(site_archetypes, _cluster_profiles, feature_names, save)
    plot_decision_boundary(X_scaled, labels, df, feature_names, site_archetypes, save)
    cfs = build_counterfactuals(df, X_scaled, labels, feature_names, site_archetypes, save)

    return {"shap": shap_result, "delta_report": delta_report, "counterfactuals": cfs}
