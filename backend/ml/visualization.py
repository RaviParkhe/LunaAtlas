"""
ml/visualization.py
===================
Generates all visualizations for the ML pattern discovery layer.

Plots produced
--------------
1. cluster_spatial_map.png       -- 400x400 colour-coded cluster grid
2. cluster_pca_2d.png            -- PCA projection of scaled features, coloured by cluster
3. cluster_feature_profiles.png  -- Radar / bar chart of cluster centroids
4. named_sites_overlay.png       -- Cluster map with named sites marked
5. k_selection_metrics.png       -- Silhouette / DB / CH vs k (elbow-style)
6. anomaly_spatial_map.png       -- Spatial map of anomaly flags (optional)
7. site_archetype_comparison.png -- Side-by-side feature bars for all 6 sites
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import ListedColormap
from sklearn.decomposition import PCA

from ml.config import OUTPUT_DIR, GRID_SHAPE, DPI, COLORMAP_CLUSTERS, FEATURE_COLUMNS


# Colour palette -- distinct, colourblind-friendly
_PALETTE = [
    "#2196F3", "#FF5722", "#4CAF50", "#9C27B0",
    "#FF9800", "#00BCD4", "#E91E63", "#8BC34A",
    "#795548", "#607D8B",
]


def _get_colors(n: int) -> list:
    return _PALETTE[:n]


# ---------------------------------------------------------------------------
# 1. Spatial cluster map
# ---------------------------------------------------------------------------

def plot_spatial_cluster_map(labels: np.ndarray, cluster_profiles: dict, save: bool = True):
    k = len(cluster_profiles)
    colors = _get_colors(k)
    cmap   = ListedColormap(colors)

    grid = labels.reshape(GRID_SHAPE)
    fig, ax = plt.subplots(figsize=(9, 9))
    im = ax.imshow(grid, cmap=cmap, vmin=0, vmax=k - 1, origin="upper")

    legend_patches = [
        mpatches.Patch(color=colors[cid], label=f"C{cid}: {prof['archetype_label'][:30]}")
        for cid, prof in sorted(cluster_profiles.items())
        if cid < len(colors)
    ]
    ax.legend(handles=legend_patches, loc="lower left", fontsize=7,
              framealpha=0.85, title="Archetypes")
    ax.set_title("Lunar South Pole -- Environmental Cluster Map\n(400x400 km region, 1 km/cell)",
                 fontsize=11)
    ax.set_xlabel("East <--> West  (grid column)")
    ax.set_ylabel("North <--> South Pole  (grid row)")
    plt.colorbar(im, ax=ax, ticks=range(k), shrink=0.6,
                 label="Cluster ID")
    plt.tight_layout()

    if save:
        path = os.path.join(OUTPUT_DIR, "cluster_spatial_map.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] Spatial cluster map saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 2. Named sites overlay
# ---------------------------------------------------------------------------

def plot_named_sites_overlay(
    labels: np.ndarray,
    cluster_profiles: dict,
    site_archetypes: dict,
    save: bool = True,
):
    k = len(cluster_profiles)
    colors = _get_colors(k)
    cmap   = ListedColormap(colors)

    grid = labels.reshape(GRID_SHAPE)
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(grid, cmap=cmap, vmin=0, vmax=k - 1, origin="upper", alpha=0.8)

    site_colors = plt.cm.get_cmap("tab10")
    for i, (site_name, rpt) in enumerate(site_archetypes.items()):
        row = rpt.get("grid_row")
        col = rpt.get("grid_col")
        if row is None or col is None:
            continue
        ax.plot(col, row, "o", markersize=12, markeredgecolor="white",
                markeredgewidth=1.5, color=site_colors(i / 6), zorder=10)
        ax.annotate(
            site_name.replace(" ", "\n"),
            xy=(col, row), xytext=(col + 8, row - 8),
            fontsize=6.5, color="white",
            bbox=dict(boxstyle="round,pad=0.2", fc="black", alpha=0.55),
            arrowprops=dict(arrowstyle="-", color="white", lw=0.8),
        )

    legend_patches = [
        mpatches.Patch(color=colors[cid], label=f"C{cid}: {prof['archetype_label'][:28]}")
        for cid, prof in sorted(cluster_profiles.items())
        if cid < len(colors)
    ]
    ax.legend(handles=legend_patches, loc="lower left", fontsize=7,
              framealpha=0.85, title="Environmental Archetypes")
    ax.set_title("Named Candidate Sites on Environmental Cluster Map", fontsize=11)
    ax.set_xlabel("East <--> West  (grid column)")
    ax.set_ylabel("North <--> South Pole  (grid row)")
    plt.tight_layout()

    if save:
        path = os.path.join(OUTPUT_DIR, "named_sites_overlay.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] Named sites overlay saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 3. PCA 2D scatter
# ---------------------------------------------------------------------------

def plot_pca_2d(X_scaled: np.ndarray, labels: np.ndarray, cluster_profiles: dict, save: bool = True):
    print("[viz] Computing PCA (2 components) ...")
    pca    = PCA(n_components=2, random_state=42)
    X_pca  = pca.fit_transform(X_scaled)

    k = len(cluster_profiles)
    colors = _get_colors(k)
    fig, ax = plt.subplots(figsize=(9, 7))

    for cid in range(k):
        mask = labels == cid
        label_str = cluster_profiles.get(cid, {}).get("archetype_label", f"C{cid}")[:25]
        ax.scatter(
            X_pca[mask, 0], X_pca[mask, 1],
            c=colors[cid], s=0.5, alpha=0.4,
            label=f"C{cid}: {label_str}",
            rasterized=True,
        )

    ax.set_xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.1f}% variance)")
    ax.set_ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.1f}% variance)")
    ax.set_title("PCA 2D Projection -- Environmental Clusters")
    ax.legend(fontsize=7, markerscale=10)
    plt.tight_layout()

    if save:
        path = os.path.join(OUTPUT_DIR, "cluster_pca_2d.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] PCA scatter saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 4. Cluster feature profiles (grouped bar chart)
# ---------------------------------------------------------------------------

def plot_cluster_feature_profiles(cluster_profiles: dict, save: bool = True):
    feat_cols = FEATURE_COLUMNS
    k = len(cluster_profiles)
    colors = _get_colors(k)

    fig, axes = plt.subplots(1, len(feat_cols), figsize=(4 * len(feat_cols), 5), sharey=False)
    if len(feat_cols) == 1:
        axes = [axes]

    for ax_idx, feat in enumerate(feat_cols):
        ax = axes[ax_idx]
        vals = [cluster_profiles[cid]["mean"].get(feat, 0) for cid in range(k)]
        stds = [cluster_profiles[cid]["std"].get(feat, 0) for cid in range(k)]
        bar_positions = range(k)
        bars = ax.bar(bar_positions, vals, yerr=stds, capsize=3,
                      color=colors, edgecolor="white", linewidth=0.5)
        ax.set_title(feat.replace("_", "\n"), fontsize=8)
        ax.set_xticks(range(k))
        ax.set_xticklabels([f"C{i}" for i in range(k)], fontsize=7)
        ax.tick_params(axis="y", labelsize=7)

    fig.suptitle("Cluster Feature Profiles -- Mean ± Std", fontsize=11)
    plt.tight_layout(rect=[0, 0, 1, 0.95])

    if save:
        path = os.path.join(OUTPUT_DIR, "cluster_feature_profiles.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] Feature profiles saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 5. K-selection metrics plot
# ---------------------------------------------------------------------------

def plot_k_selection_metrics(all_metrics: dict, best_k: int, save: bool = True):
    if not all_metrics:
        print("[viz] No k-metrics to plot -- skipping.")
        return None

    ks  = sorted(all_metrics.keys())
    sil = [all_metrics[k]["silhouette"]        for k in ks]
    db  = [all_metrics[k]["davies_bouldin"]    for k in ks]
    ch  = [all_metrics[k]["calinski_harabasz"] for k in ks]

    fig, axes = plt.subplots(1, 3, figsize=(14, 4))

    for ax, vals, title, better in zip(
        axes,
        [sil, db, ch],
        ["Silhouette Score ↑", "Davies-Bouldin Index ↓", "Calinski-Harabasz ↑"],
        ["max", "min", "max"],
    ):
        ax.plot(ks, vals, "o-", lw=2, color="#2196F3")
        ax.axvline(best_k, color="#FF5722", linestyle="--", lw=1.5, label=f"chosen k={best_k}")
        ax.set_title(title, fontsize=10)
        ax.set_xlabel("Number of clusters (k)")
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)

    fig.suptitle("K-Means Cluster Count Selection Metrics", fontsize=12)
    plt.tight_layout()

    if save:
        path = os.path.join(OUTPUT_DIR, "k_selection_metrics.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] K-selection metrics saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 6. Anomaly spatial map
# ---------------------------------------------------------------------------

def plot_anomaly_map(anomaly_flags: np.ndarray, save: bool = True):
    grid = anomaly_flags.reshape(GRID_SHAPE).astype(float)
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.imshow(grid, cmap="hot", origin="upper", vmin=0, vmax=1)
    ax.set_title("Isolation Forest Anomaly Map\n(white = anomalous cells)", fontsize=11)
    ax.set_xlabel("Grid column")
    ax.set_ylabel("Grid row")
    plt.tight_layout()

    if save:
        path = os.path.join(OUTPUT_DIR, "anomaly_spatial_map.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] Anomaly map saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 7. Site archetype comparison
# ---------------------------------------------------------------------------

def plot_site_archetype_comparison(site_archetypes: dict, save: bool = True):
    feat_cols = FEATURE_COLUMNS
    site_names = list(site_archetypes.keys())
    n_sites    = len(site_names)
    n_feats    = len(feat_cols)

    vals = np.array([
        [site_archetypes[s]["site_feature_values"].get(f, 0) for f in feat_cols]
        for s in site_names
    ])

    x = np.arange(n_feats)
    width = 0.8 / n_sites
    site_pal = plt.cm.get_cmap("tab10")

    fig, ax = plt.subplots(figsize=(12, 5))
    for i, site in enumerate(site_names):
        offset = (i - n_sites / 2 + 0.5) * width
        ax.bar(x + offset, vals[i], width * 0.9,
               label=site[:22], color=site_pal(i / n_sites), alpha=0.85)

    ax.set_xticks(x)
    ax.set_xticklabels([f.replace("_", "\n") for f in feat_cols], fontsize=8)
    ax.set_title("Named Candidate Site Feature Comparison")
    ax.set_ylabel("Feature Value (original scale)")
    ax.legend(fontsize=7, loc="upper right")
    ax.grid(True, axis="y", alpha=0.3)
    plt.tight_layout()

    if save:
        path = os.path.join(OUTPUT_DIR, "site_archetype_comparison.png")
        fig.savefig(path, dpi=DPI, bbox_inches="tight")
        plt.close(fig)
        print(f"[viz] Site comparison chart saved -> {path}")
    return fig
