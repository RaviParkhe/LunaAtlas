"""
xai/layer3_score_xai.py
=======================
Layer 3 XAI — Explains the AHP weighted-sum scoring decisions.

Outputs
-------
1. Per-site waterfall charts         (waterfall_[site].png x6)
2. Stacked score comparison          (score_comparison_stacked.png)
3. Rank sensitivity heatmap          (rank_sensitivity_heatmap.png)
4. Score breakdown JSON              (score_breakdown.json)
"""

import os, sys, json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

XAI_OUT = os.path.join(_HERE, "outputs")
AHP_CFG = os.path.join(_REPO, "ahp_config.json")
DATA_JSON = os.path.join(_REPO, "sunlight_ice_dust_final.json")

FACTOR_COLORS = {
    "safety":           "#E74C3C",
    "water_ice":        "#3498DB",
    "sunlight":         "#F39C12",
    "resources":        "#27AE60",
    "expansion":        "#9B59B6",
    "scientific_value": "#1ABC9C",
}


def _load_scores() -> tuple[dict, dict]:
    """Load AHP config and run scoring engine on all sites."""
    sys.path.insert(0, _REPO)
    from scoring_engine import score_sites, AHP_WEIGHTS

    with open(DATA_JSON) as f:
        data = json.load(f)
    named_sites = data["named_sites"]
    results     = score_sites(named_sites)   # AHP defaults
    with open(AHP_CFG) as f:
        cfg = json.load(f)
    return results, cfg


# ---------------------------------------------------------------------------
# 3a. Per-site waterfall charts
# ---------------------------------------------------------------------------

def plot_waterfall_charts(results: list, cfg: dict, save: bool = True) -> dict:
    """
    For each site: a waterfall chart showing how each factor contributes
    to the composite score.
    """
    factor_labels = {f["id"]: f["label"] for f in cfg["factors"]}
    breakdown_all = {}

    for rpt in results:
        name  = rpt["name"]
        score = rpt.get("composite_score")
        if score is None:
            continue

        fw    = rpt["factor_weighted"]   # {factor_id: weighted_contribution}
        fs    = rpt["factor_scores"]     # {factor_id: 0-100 raw score}
        ws    = rpt["weights_used"]      # {factor_id: normalised weight}

        factor_ids = list(fw.keys())
        contribs   = [fw[f] for f in factor_ids]
        labels     = [factor_labels.get(f, f) for f in factor_ids]
        colors_bar = [FACTOR_COLORS.get(f, "#888") for f in factor_ids]

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
        fig.suptitle(f"{name}\nComposite Score: {score:.2f} / 100", fontsize=12)

        # Left: waterfall
        running = 0
        for idx, (lbl, contrib, col) in enumerate(zip(labels, contribs, colors_bar)):
            ax1.bar(idx, contrib, bottom=running, color=col, edgecolor="white", width=0.6)
            ax1.text(idx, running + contrib / 2, f"{contrib:.1f}",
                     ha="center", va="center", fontsize=8, color="white", fontweight="bold")
            running += contrib

        ax1.axhline(score, color="black", lw=1.5, linestyle="--", label=f"Total: {score:.2f}")
        ax1.set_xticks(range(len(labels)))
        ax1.set_xticklabels(labels, rotation=25, ha="right", fontsize=8)
        ax1.set_ylabel("Score contribution (points)")
        ax1.set_title("Factor-by-Factor Contribution (waterfall)")
        ax1.legend(fontsize=8)
        ax1.set_ylim(0, 100)

        # Right: factor detail table
        rows = [[factor_labels.get(f, f),
                 f"{ws[f]*100:.1f}%",
                 f"{fs[f]:.1f}",
                 f"{fw[f]:.2f}"] for f in factor_ids]
        col_headers = ["Factor", "Weight", "Raw Score (0-100)", "Contribution (pts)"]
        tbl = ax2.table(cellText=rows, colLabels=col_headers,
                        cellLoc="center", loc="center")
        tbl.auto_set_font_size(False)
        tbl.set_fontsize(9)
        tbl.scale(1, 1.6)
        ax2.axis("off")
        ax2.set_title("Detailed Breakdown")

        # Colour factor rows
        for row_idx, f_id in enumerate(factor_ids):
            for col_idx in range(len(col_headers)):
                tbl[(row_idx + 1, col_idx)].set_facecolor(
                    FACTOR_COLORS.get(f_id, "#EEE") + "44")  # translucent

        plt.tight_layout(rect=[0, 0, 1, 0.93])

        if save:
            safe_name = name.replace(" ", "_").replace("/", "-")
            path = os.path.join(XAI_OUT, f"waterfall_{safe_name}.png")
            fig.savefig(path, dpi=150, bbox_inches="tight")
            plt.close(fig)
            print(f"[xai-L3] Waterfall saved -> {path}")

        breakdown_all[name] = {
            "composite_score":   score,
            "rank":              rpt.get("rank"),
            "factor_weights":    {f: round(ws[f], 4) for f in factor_ids},
            "factor_raw_scores": {f: round(fs[f], 2) for f in factor_ids},
            "factor_contributions": {f: round(fw[f], 3) for f in factor_ids},
        }

    if save:
        with open(os.path.join(XAI_OUT, "score_breakdown.json"), "w") as f:
            json.dump(breakdown_all, f, indent=2)
        print(f"[xai-L3] Score breakdown JSON saved -> {os.path.join(XAI_OUT, 'score_breakdown.json')}")

    return breakdown_all


# ---------------------------------------------------------------------------
# 3b. Stacked score comparison (all sites)
# ---------------------------------------------------------------------------

def plot_score_comparison(results: list, cfg: dict, save: bool = True):
    factor_ids    = [f["id"] for f in cfg["factors"]]
    factor_labels = [f["label"] for f in cfg["factors"]]
    site_names    = [r["name"] for r in results if r.get("composite_score") is not None]
    valid_results = [r for r in results if r.get("composite_score") is not None]

    # Matrix: sites x factors (weighted contributions)
    contrib_matrix = np.array([
        [r["factor_weighted"].get(f, 0) for f in factor_ids]
        for r in valid_results
    ])

    fig, ax = plt.subplots(figsize=(12, 6))
    bottom  = np.zeros(len(site_names))

    for j, (fid, flabel) in enumerate(zip(factor_ids, factor_labels)):
        vals = contrib_matrix[:, j]
        bars = ax.bar(site_names, vals, bottom=bottom,
                      label=flabel, color=FACTOR_COLORS.get(fid, "#888"),
                      edgecolor="white", linewidth=0.5)
        bottom += vals

    # Total score labels
    for i, r in enumerate(valid_results):
        ax.text(i, r["composite_score"] + 0.8,
                f"{r['composite_score']:.1f}\n(#{r.get('rank','-')})",
                ha="center", va="bottom", fontsize=7.5, fontweight="bold")

    ax.set_ylabel("Composite Score (0-100)")
    ax.set_title("AHP Site Scores — Factor-by-Factor Stacked Breakdown\n"
                 "(height of each colour = that factor's contribution)")
    ax.legend(fontsize=8, loc="upper right", bbox_to_anchor=(1.15, 1))
    ax.set_ylim(0, 110)
    plt.xticks(rotation=15, ha="right", fontsize=8)
    plt.tight_layout()

    if save:
        path = os.path.join(XAI_OUT, "score_comparison_stacked.png")
        fig.savefig(path, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"[xai-L3] Stacked comparison saved -> {path}")
    return fig


# ---------------------------------------------------------------------------
# 3c. Rank sensitivity — sweep each weight 0-100%
# ---------------------------------------------------------------------------

def plot_rank_sensitivity(cfg: dict, save: bool = True) -> dict:
    from scoring_engine import score_sites, AHP_WEIGHTS

    with open(DATA_JSON) as f:
        named_sites = json.load(f)["named_sites"]

    factor_ids    = [f["id"] for f in cfg["factors"]]
    site_names_base = [r["name"] for r in score_sites(named_sites)
                       if r.get("composite_score") is not None]

    n_sweep = 21  # 0%, 5%, 10%, ... 100%
    sweep_vals = np.linspace(0, 1, n_sweep)

    # rank_matrix[factor_idx][sweep_step][site_name] = rank
    sensitivity_report = {}
    rank_flip_messages = []

    # Base ranks
    base_results = score_sites(named_sites)
    base_ranks   = {r["name"]: r.get("rank") for r in base_results if r.get("rank")}

    for fid in factor_ids:
        site_ranks_over_sweep = {sn: [] for sn in site_names_base}

        for sweep_w in sweep_vals:
            # Construct override: set fid=sweep_w, scale others proportionally
            remaining = 1.0 - sweep_w
            others    = {f: AHP_WEIGHTS[f] for f in factor_ids if f != fid}
            others_sum = sum(others.values())
            if others_sum > 0:
                scaled_others = {f: (v / others_sum) * remaining for f, v in others.items()}
            else:
                scaled_others = {f: 0.0 for f in others}
            override = {fid: sweep_w, **scaled_others}

            results = score_sites(named_sites, weights=override)
            for r in results:
                if r.get("rank") and r["name"] in site_ranks_over_sweep:
                    site_ranks_over_sweep[r["name"]].append(r["rank"])

        sensitivity_report[fid] = site_ranks_over_sweep

        # Detect rank flips
        for sn, ranks in site_ranks_over_sweep.items():
            if ranks and min(ranks) != max(ranks):
                base_r = base_ranks.get(sn, "?")
                rank_flip_messages.append(
                    f"When '{fid}' weight sweeps 0->100%: "
                    f"'{sn}' rank changes from {base_r} to "
                    f"between #{min(ranks)} and #{max(ranks)}."
                )

    # Plot rank sensitivity heatmap (for top factors)
    fig, axes = plt.subplots(2, 3, figsize=(15, 8))
    axes = axes.flatten()

    site_pal = plt.cm.get_cmap("tab10")

    for ax_idx, fid in enumerate(factor_ids):
        ax = axes[ax_idx]
        for s_idx, sn in enumerate(site_names_base):
            ranks = sensitivity_report[fid].get(sn, [])
            if len(ranks) == n_sweep:
                ax.plot(sweep_vals * 100, ranks,
                        color=site_pal(s_idx / len(site_names_base)),
                        lw=2, label=sn[:15])
        base_w = AHP_WEIGHTS.get(fid, 0)
        ax.axvline(base_w * 100, color="gray", linestyle="--", lw=1, label="AHP default")
        ax.set_xlabel(f"{fid} weight (%)")
        ax.set_ylabel("Rank (lower=better)")
        ax.set_title(f"Rank as {fid[:10]} weight changes")
        ax.invert_yaxis()
        ax.set_yticks(range(1, len(site_names_base) + 1))
        ax.legend(fontsize=5.5, loc="lower right")
        ax.grid(True, alpha=0.3)

    fig.suptitle("Rank Sensitivity — How site rankings change as each weight is swept 0-100%",
                 fontsize=11)
    plt.tight_layout(rect=[0, 0, 1, 0.95])

    output = {
        "rank_flip_messages": rank_flip_messages,
        "base_ranks":         base_ranks,
    }

    if save:
        path      = os.path.join(XAI_OUT, "rank_sensitivity_heatmap.png")
        json_path = os.path.join(XAI_OUT, "rank_sensitivity.json")
        fig.savefig(path, dpi=150, bbox_inches="tight")
        plt.close(fig)
        with open(json_path, "w") as f:
            json.dump(output, f, indent=2)
        print(f"[xai-L3] Rank sensitivity saved -> {path}")
        for msg in rank_flip_messages:
            print(f"  [rank-flip] {msg}")

    return output


def run_layer3(save: bool = True) -> dict:
    os.makedirs(XAI_OUT, exist_ok=True)
    print("\n[xai-L3] === LAYER 3: SCORE EXPLAINABILITY ===")
    results, cfg = _load_scores()
    breakdown    = plot_waterfall_charts(results, cfg, save)
    plot_score_comparison(results, cfg, save)
    sensitivity  = plot_rank_sensitivity(cfg, save)
    return {"breakdown": breakdown, "sensitivity": sensitivity}
