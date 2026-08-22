"""
xai/gemini/counterfactual.py
============================
Mission-priority counterfactual engine.

Answers the question: "What happens to the site ranking if we slightly
change the mission priorities (AHP weights)?"

CRITICAL DESIGN PRINCIPLES:
  - ALL numerical calculations are done here in Python.
  - Gemini NEVER performs AHP recalculation.
  - Gemini NEVER determines winners.
  - Gemini NEVER classifies scenarios.
  - This module is independently testable with no LLM dependency.

Perturbation strategy
---------------------
For each AHP factor f_i:
  1. Increase f_i's weight by DELTA_PCT percentage points.
  2. Reduce all other weights proportionally so SUM(weights) = 1.0.
  3. Call score_sites() with the perturbed weights.
  4. Compare baseline winner vs. perturbed winner.
  5. Classify the scenario.

Normalization rule (proportional compensation):
    new_f_i   = baseline_f_i + delta
    new_f_j   = baseline_f_j * (1 - new_f_i) / (1 - baseline_f_i)   for j != i
    SUM(all)  = 1.0  (guaranteed by construction)

Classification rules:
    ROBUST              : winner unchanged
    SENSITIVE           : winner changed
    CAPABILITY_LIMITATION: winner unchanged BUT selected site's score
                           for the changed factor is < CAPABILITY_THRESHOLD

Note: CAPABILITY_LIMITATION is reported only when ROBUST would otherwise apply —
it signals a hidden fragility even though the ranking held.
"""

from __future__ import annotations
import sys
import os
import json
import logging

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(os.path.dirname(_HERE))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from xai.gemini.payloads import (
    CounterfactualResult,
    CounterfactualExplanationInput,
    WeightSnapshot,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DELTA_PCT            = 5.0    # percentage-point increase per perturbation
CAPABILITY_THRESHOLD = 40.0   # below this raw score → CAPABILITY_LIMITATION

_DATA_JSON = os.path.join(_REPO, "sunlight_ice_dust_final.json")


# ---------------------------------------------------------------------------
# Weight perturbation
# ---------------------------------------------------------------------------

def perturb_weights(
    baseline_weights: dict[str, float],
    target_factor: str,
    delta_pct: float = DELTA_PCT,
) -> dict[str, float]:
    """
    Increase target_factor weight by delta_pct percentage points,
    compensate all other factors proportionally.

    Parameters
    ----------
    baseline_weights : dict
        {factor_id: weight (0–1)} — must already be normalised.
    target_factor : str
        Factor id to perturb.
    delta_pct : float
        Perturbation size in percentage points (default 5pp).

    Returns
    -------
    dict
        Perturbed weights {factor_id: weight} — guaranteed to sum to 1.0.

    Raises
    ------
    ValueError
        If target_factor is not in baseline_weights or delta makes weight > 1.
    """
    if target_factor not in baseline_weights:
        raise ValueError(f"Factor '{target_factor}' not found in weights.")

    delta_fraction = delta_pct / 100.0
    baseline_val   = baseline_weights[target_factor]
    new_val        = min(1.0, baseline_val + delta_fraction)  # clamp to 1.0

    remaining = 1.0 - new_val

    others      = {f: v for f, v in baseline_weights.items() if f != target_factor}
    others_sum  = sum(others.values())

    if others_sum > 1e-12:
        scaled_others = {f: (v / others_sum) * remaining for f, v in others.items()}
    else:
        # All weight was on target_factor — others get zero
        scaled_others = {f: 0.0 for f in others}

    perturbed = {target_factor: new_val, **scaled_others}

    # Numerical safety check
    total = sum(perturbed.values())
    if abs(total - 1.0) > 1e-9:
        # Correct rounding drift
        diff = 1.0 - total
        last_key = list(scaled_others.keys())[-1] if scaled_others else target_factor
        perturbed[last_key] += diff

    return perturbed


def _weights_to_pct_snapshot(weights: dict[str, float], factor_labels: dict) -> WeightSnapshot:
    """Convert a {factor_id: weight} dict to a WeightSnapshot (pct, labelled)."""
    pct_dict = {
        factor_labels.get(fid, fid): round(w * 100, 2)
        for fid, w in weights.items()
    }
    # Correct floating-point rounding drift so total is exactly 100.0
    total = sum(pct_dict.values())
    diff  = round(100.0 - total, 10)
    if abs(diff) > 0:
        # Apply correction to the key with the largest pct (most stable)
        largest_key = max(pct_dict, key=pct_dict.get)
        pct_dict[largest_key] = round(pct_dict[largest_key] + diff, 2)
    return WeightSnapshot(weights_pct=pct_dict)


# ---------------------------------------------------------------------------
# Scenario classification
# ---------------------------------------------------------------------------

def classify_scenario(
    winner_changed: bool,
    selected_site_factor_score: float,
) -> str:
    """
    Classify a counterfactual scenario.

    Parameters
    ----------
    winner_changed : bool
    selected_site_factor_score : float
        The raw (0–100) score of the currently-selected site for the changed factor.

    Returns
    -------
    str
        One of: "ROBUST" | "SENSITIVE" | "CAPABILITY_LIMITATION"
    """
    if winner_changed:
        return "SENSITIVE"
    if selected_site_factor_score < CAPABILITY_THRESHOLD:
        return "CAPABILITY_LIMITATION"
    return "ROBUST"


# ---------------------------------------------------------------------------
# Single scenario runner
# ---------------------------------------------------------------------------

def run_scenario(
    named_sites: dict,
    baseline_results: list[dict],
    baseline_weights: dict[str, float],
    selected_site_name: str,
    target_factor: str,
    factor_labels: dict,
    delta_pct: float = DELTA_PCT,
) -> CounterfactualResult:
    """
    Run a single perturbation scenario and return a CounterfactualResult.

    Parameters
    ----------
    named_sites : dict
        The named_sites dict from sunlight_ice_dust_final.json.
    baseline_results : list[dict]
        Output of score_sites() with baseline weights.
    baseline_weights : dict
        {factor_id: weight (0–1)} — normalised baseline.
    selected_site_name : str
        The site that is #1 in the baseline.
    target_factor : str
        Factor id to perturb.
    factor_labels : dict
        {factor_id: label}
    delta_pct : float
        Perturbation size in percentage points.

    Returns
    -------
    CounterfactualResult
    """
    from scoring_engine import score_sites

    perturbed_weights = perturb_weights(baseline_weights, target_factor, delta_pct)

    # Recalculate AHP with perturbed weights
    perturbed_results = score_sites(named_sites, weights=perturbed_weights)

    # Find winner in perturbed scenario
    valid_perturbed = [r for r in perturbed_results if r.get("composite_score") is not None]
    scenario_winner = valid_perturbed[0]["name"] if valid_perturbed else selected_site_name

    # Find runner-up in perturbed scenario
    runner_up       = valid_perturbed[1] if len(valid_perturbed) > 1 else None

    # Selected site's score for the changed factor
    selected_result = next(
        (r for r in baseline_results if r["name"] == selected_site_name), None
    )
    selected_factor_score = (
        selected_result["factor_scores"].get(target_factor, 0.0)
        if selected_result else 0.0
    )

    winner_changed = scenario_winner != selected_site_name

    classification = classify_scenario(winner_changed, selected_factor_score)

    baseline_w_pct = baseline_weights[target_factor] * 100
    perturbed_w_pct = perturbed_weights[target_factor] * 100

    return CounterfactualResult(
        changed_factor_id=target_factor,
        changed_factor_label=factor_labels.get(target_factor, target_factor),
        baseline_weight_pct=round(baseline_w_pct, 2),
        perturbed_weight_pct=round(perturbed_w_pct, 2),
        delta_pct=round(perturbed_w_pct - baseline_w_pct, 2),
        baseline_winner=selected_site_name,
        scenario_winner=scenario_winner,
        winner_changed=winner_changed,
        selected_site_factor_score=round(selected_factor_score, 2),
        runner_up_name=runner_up["name"] if runner_up else None,
        runner_up_score=round(runner_up["composite_score"], 2) if runner_up else None,
        classification=classification,
        baseline_weights=_weights_to_pct_snapshot(baseline_weights, factor_labels),
        perturbed_weights=_weights_to_pct_snapshot(perturbed_weights, factor_labels),
    )


# ---------------------------------------------------------------------------
# Full counterfactual run (all factors)
# ---------------------------------------------------------------------------

def run_all_scenarios(
    selected_site_name: str,
    baseline_results: list[dict],
    factor_labels: dict,
    factor_order: list[str],
    delta_pct: float = DELTA_PCT,
) -> CounterfactualExplanationInput:
    """
    Run one perturbation scenario per AHP factor and aggregate results.

    Parameters
    ----------
    selected_site_name : str
        The top-ranked site name (from baseline_results[0]['name']).
    baseline_results : list[dict]
        Full output of score_sites() with AHP default weights.
    factor_labels : dict
        {factor_id: label} from scoring_engine.FACTOR_LABELS
    factor_order : list[str]
        Ordered factor ids from scoring_engine.FACTOR_ORDER
    delta_pct : float
        Perturbation size in percentage points.

    Returns
    -------
    CounterfactualExplanationInput
    """
    with open(_DATA_JSON) as f:
        named_sites = json.load(f)["named_sites"]

    # Get baseline weights from first valid result
    selected = next(
        (r for r in baseline_results if r["name"] == selected_site_name), None
    )
    if selected is None:
        raise ValueError(f"Site '{selected_site_name}' not found in baseline results.")

    baseline_weights = selected["weights_used"]
    baseline_score   = selected["composite_score"]
    baseline_rank    = selected["rank"]

    logger.info(
        "[counterfactual] Running %d scenarios for '%s' (delta=+%.1fpp each)",
        len(factor_order), selected_site_name, delta_pct,
    )

    scenarios: list[CounterfactualResult] = []
    for fid in factor_order:
        try:
            result = run_scenario(
                named_sites=named_sites,
                baseline_results=baseline_results,
                baseline_weights=baseline_weights,
                selected_site_name=selected_site_name,
                target_factor=fid,
                factor_labels=factor_labels,
                delta_pct=delta_pct,
            )
            scenarios.append(result)
            logger.debug(
                "  factor=%-20s  baseline=%.1f%%  perturbed=%.1f%%  winner=%s  class=%s",
                fid,
                result.baseline_weight_pct,
                result.perturbed_weight_pct,
                result.scenario_winner,
                result.classification,
            )
        except Exception as exc:
            logger.warning("[counterfactual] Skipped factor '%s': %s", fid, exc)

    # Categorise scenarios
    robust_factors   = [s.changed_factor_label for s in scenarios if s.classification == "ROBUST"]
    sensitive_factors= [s.changed_factor_label for s in scenarios if s.classification == "SENSITIVE"]
    limited_factors  = [s.changed_factor_label for s in scenarios if s.classification == "CAPABILITY_LIMITATION"]

    return CounterfactualExplanationInput(
        site_name=selected_site_name,
        baseline_rank=baseline_rank,
        baseline_score=baseline_score,
        baseline_weights=_weights_to_pct_snapshot(baseline_weights, factor_labels),
        scenarios=scenarios,
        robust_factors=robust_factors,
        sensitive_factors=sensitive_factors,
        limited_factors=limited_factors,
    )
