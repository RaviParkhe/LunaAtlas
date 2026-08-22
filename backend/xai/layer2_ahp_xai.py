"""
xai/layer2_ahp_xai.py
=====================
Layer 2 XAI — Explains AHP weight derivation.

Outputs
-------
1. Pairwise judgment narrative  (ahp_pairwise_narrative.json + .txt)
2. Weight sensitivity chart     (ahp_weight_sensitivity.png)
3. Weight bar chart             (ahp_weights_chart.png)
"""

import os, sys, json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

XAI_OUT = os.path.join(_HERE, "outputs")
AHP_CFG = os.path.join(_REPO, "ahp_config.json")

SAATY_LABELS = {
    1: "equally important",
    2: "slightly more important",
    3: "moderately more important",
    4: "moderately to strongly more important",
    5: "strongly more important",
    6: "strongly to very strongly more important",
    7: "very strongly more important",
    8: "very strongly to extremely more important",
    9: "extremely more important",
}


# ---------------------------------------------------------------------------
# 2a. Pairwise judgment narratives
# ---------------------------------------------------------------------------

def build_pairwise_narratives(save: bool = True) -> dict:
    with open(AHP_CFG) as f:
        cfg = json.load(f)

    factors = cfg["pairwise_matrix"]["order"]
    matrix  = cfg["pairwise_matrix"]["values"]
    n       = len(factors)

    narratives = []
    txt_lines  = ["AHP PAIRWISE JUDGMENT NARRATIVES", "=" * 60, "",
                  "Scale: Saaty 1-9 (1=equal, 3=moderate, 5=strong, 7=very strong, 9=extreme)", ""]

    for i in range(n):
        for j in range(i + 1, n):
            raw_val = matrix[i][j]
            # Find nearest integer for label
            val_int = int(round(raw_val)) if raw_val >= 1 else int(round(1 / raw_val))
            label   = SAATY_LABELS.get(val_int, f"scale={raw_val:.2f}")

            if raw_val >= 1:
                more_imp   = factors[i]
                less_imp   = factors[j]
                scale_val  = raw_val
            else:
                more_imp   = factors[j]
                less_imp   = factors[i]
                scale_val  = 1 / raw_val

            sentence = (
                f"'{more_imp}' is {label} than '{less_imp}' "
                f"(Saaty value: {scale_val:.2f})."
            )
            entry = {
                "factor_a":   factors[i],
                "factor_b":   factors[j],
                "raw_value":  raw_val,
                "more_important": more_imp,
                "less_important": less_imp,
                "saaty_label": label,
                "sentence":   sentence,
            }
            narratives.append(entry)
            txt_lines.append(f"  {factors[i]} vs {factors[j]}:")
            txt_lines.append(f"    {sentence}")
            txt_lines.append("")

    full_text = "\n".join(txt_lines)
    print(full_text)

    result = {
        "factors":    factors,
        "narratives": narratives,
        "cr":         cfg["ahp_consistency"]["consistency_ratio"],
        "cr_note":    (
            f"Consistency Ratio (CR) = {cfg['ahp_consistency']['consistency_ratio']:.4f} "
            f"— well below the 0.10 threshold. "
            f"This means the 15 pairwise judgments are internally consistent "
            f"(no contradictions like 'A > B > C > A')."
        ),
    }

    if save:
        json_path = os.path.join(XAI_OUT, "ahp_pairwise_narrative.json")
        txt_path  = os.path.join(XAI_OUT, "ahp_pairwise_narrative.txt")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"[xai-L2] Pairwise narrative saved -> {json_path}")

    return result


# ---------------------------------------------------------------------------
# 2b. Weight sensitivity (+/- 1 Saaty point per judgment)
# ---------------------------------------------------------------------------

def _recompute_weights_from_matrix(matrix_vals: list) -> list:
    """Standard AHP: normalize columns, average rows."""
    n   = len(matrix_vals)
    M   = np.array(matrix_vals, dtype=float)
    col_sums = M.sum(axis=0)
    norm = M / col_sums
    return norm.mean(axis=1).tolist()


def run_weight_sensitivity(save: bool = True) -> dict:
    with open(AHP_CFG) as f:
        cfg = json.load(f)

    factors   = cfg["pairwise_matrix"]["order"]
    base_mat  = [row[:] for row in cfg["pairwise_matrix"]["values"]]
    n         = len(factors)
    base_w    = _recompute_weights_from_matrix(base_mat)

    results   = []
    print("\n[xai-L2] Weight sensitivity (each judgment +/-1 Saaty point):")
    print(f"  {'Judgment':<45}  {'Base':>6}  {'Up+1':>6}  {'Down-1':>6}  {'Max delta':>10}")
    print(f"  {'-'*45}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*10}")

    for i in range(n):
        for j in range(i + 1, n):
            base_val = base_mat[i][j]
            deltas_per_factor = {}

            for direction, label in [(+1, "up"), (-1, "down")]:
                new_mat = [row[:] for row in base_mat]
                new_val = base_val + direction
                # Clamp to Saaty scale [1/9 ... 9]
                new_val = max(1/9, min(9, new_val))
                new_mat[i][j] = new_val
                new_mat[j][i] = 1.0 / new_val
                new_w = _recompute_weights_from_matrix(new_mat)
                delta = {factors[k]: round(new_w[k] - base_w[k], 4) for k in range(n)}
                deltas_per_factor[label] = {"weights": new_w, "delta": delta}

            max_delta = max(
                abs(v)
                for d in deltas_per_factor.values()
                for v in d["delta"].values()
            )

            judgment_name = f"{factors[i]} vs {factors[j]}"
            result = {
                "judgment":   judgment_name,
                "factor_a":   factors[i],
                "factor_b":   factors[j],
                "base_value": base_val,
                "sensitivity": deltas_per_factor,
                "max_weight_delta": round(max_delta, 4),
            }
            results.append(result)

            up_max   = max(abs(v) for v in deltas_per_factor["up"]["delta"].values())
            down_max = max(abs(v) for v in deltas_per_factor["down"]["delta"].values()) if "down" in deltas_per_factor else 0
            print(f"  {judgment_name:<45}  {base_val:>6.2f}  {base_val+1:>6.2f}  "
                  f"{max(1/9,base_val-1):>6.2f}  {max_delta:>10.4f}")

    # Sort by sensitivity (most sensitive first)
    results.sort(key=lambda x: -x["max_weight_delta"])

    # --- Sensitivity heatmap ---
    pair_labels = [f"{r['factor_a'][:6]} vs {r['factor_b'][:6]}" for r in results]
    max_deltas  = [r["max_weight_delta"] for r in results]

    fig, ax = plt.subplots(figsize=(9, 6))
    bars = ax.barh(pair_labels, max_deltas,
                   color=["#E74C3C" if d > 0.02 else "#3498DB" for d in max_deltas])
    ax.axvline(0.02, color="gray", linestyle="--", lw=1.2, label="2% threshold")
    ax.set_xlabel("Max weight change from +/-1 Saaty point (proportion)")
    ax.set_title("AHP Weight Sensitivity\n(how much does each judgment affect the final weights?)")
    ax.legend(fontsize=8)
    plt.tight_layout()

    # --- Base weight bar chart ---
    fig2, ax2 = plt.subplots(figsize=(8, 4))
    factor_labels = [f["label"] for f in cfg["factors"]]
    weights_pct   = [f["ahp_weight_pct"] for f in cfg["factors"]]
    bar_colors    = ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#FF5722", "#00BCD4"]
    bars2 = ax2.bar(factor_labels, weights_pct, color=bar_colors, edgecolor="white")
    for bar, val in zip(bars2, weights_pct):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
                 f"{val:.1f}%", ha="center", va="bottom", fontsize=9, fontweight="bold")
    ax2.set_ylabel("AHP Weight (%)")
    ax2.set_title(f"AHP Derived Weights — Consistency Ratio: {cfg['ahp_consistency']['consistency_ratio']:.4f} (< 0.10 threshold)")
    ax2.set_ylim(0, max(weights_pct) * 1.2)
    plt.tight_layout()

    output = {
        "base_weights":  {factors[i]: round(base_w[i], 4) for i in range(n)},
        "sensitivity":   results,
        "cr":            cfg["ahp_consistency"]["consistency_ratio"],
    }

    if save:
        sens_path   = os.path.join(XAI_OUT, "ahp_weight_sensitivity.png")
        weight_path = os.path.join(XAI_OUT, "ahp_weights_chart.png")
        json_path   = os.path.join(XAI_OUT, "ahp_weight_sensitivity.json")

        fig.savefig(sens_path,   dpi=150, bbox_inches="tight"); plt.close(fig)
        fig2.savefig(weight_path, dpi=150, bbox_inches="tight"); plt.close(fig2)
        with open(json_path, "w") as f:
            json.dump(output, f, indent=2)
        print(f"[xai-L2] Sensitivity chart saved -> {sens_path}")
        print(f"[xai-L2] Weights chart saved     -> {weight_path}")

    return output


def run_layer2(save: bool = True) -> dict:
    os.makedirs(XAI_OUT, exist_ok=True)
    print("\n[xai-L2] === LAYER 2: AHP WEIGHT EXPLAINABILITY ===")
    narratives  = build_pairwise_narratives(save)
    sensitivity = run_weight_sensitivity(save)
    return {"narratives": narratives, "sensitivity": sensitivity}
