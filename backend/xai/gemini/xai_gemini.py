"""
xai/gemini/xai_gemini.py
========================
Orchestrator for the Gemini XAI explanation layer.

This module wires together:
  1. Existing AHP scoring (score_sites) -- unchanged
  2. Risk engine (compute_risks) -- derived from AHP factor scores
  3. Counterfactual engine (run_all_scenarios) -- pure Python AHP
  4. Payload construction (payloads.py) -- safe DTOs
  5. Gemini service (gemini_service.py) -- LLM natural language generation
  6. Result persistence -- JSON outputs saved to xai/gemini/outputs/

CRITICAL:
  - The AHP ranking produced by score_sites() is NEVER modified by this module.
  - If Gemini fails for any reason, deterministic fallback explanations are used.
  - The fallback explanations are based entirely on actual calculated values.

Run:
    cd d:\\LunaAstraT\\LunarHabitatAI
    # Without Gemini (fallback only):
    python -m xai.gemini.xai_gemini

    # With Gemini:
    set GEMINI_API_KEY=your_key_here
    python -m xai.gemini.xai_gemini

    # Explain specific site only:
    python -m xai.gemini.xai_gemini --site "Haworth Crater"
"""

from __future__ import annotations
import os
import sys
import json
import time
import logging
import argparse

_HERE = os.path.dirname(os.path.abspath(__file__))
_XAI  = os.path.dirname(_HERE)
_REPO = os.path.dirname(_XAI)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

# Configure logging before any imports
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

from scoring_engine import (
    score_sites,
    AHP_WEIGHTS,
    FACTOR_LABELS,
    FACTOR_ORDER,
    get_weight_metadata,
    _normalize_weights,
)
from xai.gemini.payloads import (
    SiteSelectionExplanationInput,
    SiteComparisonSnapshot,
    build_factor_details,
)
from xai.gemini.risk_engine import build_risk_mitigation_input
from xai.gemini.counterfactual import run_all_scenarios
import xai.gemini.gemini_service as gemini_service

GEMINI_OUT = os.path.join(_HERE, "outputs")
DATA_JSON  = os.path.join(_REPO, "sunlight_ice_dust_final.json")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_named_sites() -> dict:
    with open(DATA_JSON) as f:
        return json.load(f)["named_sites"]


def _load_ml_archetypes() -> dict:
    """Load ML site archetypes if available; return {} if not yet generated."""
    from ml.config import OUTPUT_DIR
    path = os.path.join(OUTPUT_DIR, "named_site_archetypes.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    logger.info("[xai_gemini] ML archetypes not found -- archetype context will be omitted.")
    return {}


def _save(filename: str, data: dict) -> str:
    os.makedirs(GEMINI_OUT, exist_ok=True)
    path = os.path.join(GEMINI_OUT, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return path


def _banner(msg: str):
    print(f"\n{'='*65}\n  {msg}\n{'='*65}")


def _check_api_key_configured() -> bool:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        logger.warning(
            "[xai_gemini] GEMINI_API_KEY is not set. "
            "Deterministic fallback explanations will be used. "
            "To enable Gemini: set GEMINI_API_KEY=<your_key>"
        )
        return False
    # Log key prefix only -- never the full key
    logger.info("[xai_gemini] GEMINI_API_KEY detected (prefix: %s****)", key[:4])
    return True


# ---------------------------------------------------------------------------
# Build SiteSelectionExplanationInput from score_sites() output
# ---------------------------------------------------------------------------

def build_site_explanation_input(
    target_result: dict,
    all_results: list[dict],
    archetypes: dict,
) -> SiteSelectionExplanationInput:
    """
    Construct the XAI DTO for site-selection explanation.

    Parameters
    ----------
    target_result : dict
        score_sites() entry for the site being explained.
    all_results : list[dict]
        Full score_sites() output (for comparison context).
    archetypes : dict
        ML site archetypes from named_site_archetypes.json (may be empty).

    Returns
    -------
    SiteSelectionExplanationInput
    """
    factors = build_factor_details(target_result, FACTOR_LABELS, FACTOR_ORDER)

    # Determine strongest and weakest factors by raw score
    factor_scores = target_result.get("factor_scores", {})
    sorted_by_score = sorted(factor_scores.items(), key=lambda x: -x[1])
    strongest_ids    = [fid for fid, _ in sorted_by_score]
    weakest_ids      = list(reversed(strongest_ids))

    strongest_label = FACTOR_LABELS.get(strongest_ids[0], strongest_ids[0]) if strongest_ids else "N/A"
    weakest_label   = FACTOR_LABELS.get(weakest_ids[0], weakest_ids[0]) if weakest_ids else "N/A"

    # Build comparison snapshots (all other valid sites)
    all_snapshots = []
    for r in all_results:
        if r.get("composite_score") is None:
            continue
        r_scores = r.get("factor_scores", {})
        r_sorted = sorted(r_scores.items(), key=lambda x: -x[1])
        all_snapshots.append(SiteComparisonSnapshot(
            name=r["name"],
            rank=r.get("rank", 0),
            composite_score=r["composite_score"],
            strongest_factor=FACTOR_LABELS.get(r_sorted[0][0], r_sorted[0][0]) if r_sorted else "N/A",
            weakest_factor=FACTOR_LABELS.get(r_sorted[-1][0], r_sorted[-1][0]) if r_sorted else "N/A",
        ))

    # ML archetype
    site_name = target_result["name"]
    archetype_entry = archetypes.get(site_name, {})
    ml_archetype = archetype_entry.get("archetype_label") if archetype_entry else None

    return SiteSelectionExplanationInput(
        site_name=site_name,
        rank=target_result.get("rank", 0),
        composite_score=target_result.get("composite_score", 0.0),
        weight_source=target_result.get("weight_source", "AHP_DEFAULT"),
        factors=factors,
        strongest_factors=strongest_ids,
        weakest_factors=weakest_ids,
        strongest_factor_label=strongest_label,
        weakest_factor_label=weakest_label,
        all_sites_summary=all_snapshots,
        ml_archetype=ml_archetype,
    )


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_gemini_xai(
    site_name: str | None = None,
    weights: dict | None = None,
) -> dict:
    """
    Run the complete Gemini XAI explanation pipeline.

    This function:
      1. Calls score_sites() to get AHP rankings (UNCHANGED by this function).
      2. For the top-ranked site (or specified site_name), generates:
         a) Site-selection explanation
         b) Risk-mitigation recommendations
         c) Mission-priority counterfactual analysis
      3. Saves all outputs to xai/gemini/outputs/

    IMPORTANT: The AHP ranking returned by score_sites() is NEVER modified.
    This function only adds explanations -- it does not change scores or ranks.

    Parameters
    ----------
    site_name : str or None
        If provided, explain this specific site. Defaults to the #1 ranked site.
    weights : dict or None
        Custom AHP weights override. If None, AHP defaults are used.

    Returns
    -------
    dict
        {
            "ahp_results": [...],          # original AHP results (unmodified)
            "site_explanation": {...},      # Gemini/fallback explanation
            "risk_mitigation": {...},       # Gemini/fallback risk explanation
            "counterfactual": {...},        # Gemini/fallback counterfactual
            "gemini_available": bool,
        }
    """
    t0 = time.monotonic()
    _banner("Gemini XAI -- Lunar Habitat Site Selector")

    # --- Step 1: Check API key availability (does not affect AHP) ---
    gemini_available = _check_api_key_configured()

    # --- Step 2: Load data and run AHP scoring (unchanged) ---
    _banner("Step 1 -- AHP Scoring (existing pipeline, unmodified)")
    named_sites = _load_named_sites()
    ahp_results = score_sites(named_sites, weights=weights)

    valid_results = [r for r in ahp_results if r.get("composite_score") is not None]
    if not valid_results:
        logger.error("[xai_gemini] No valid AHP results. Cannot continue.")
        return {"error": "No valid AHP results"}

    # Print AHP ranking (same output as scoring_engine.py self-test)
    print(f"\n  {'Rank':<5} {'Site':<28} {'Score':>7}  {'Source'}")
    print(f"  {'-'*5} {'-'*28} {'-'*7}  {'-'*14}")
    for r in valid_results:
        print(f"  #{r['rank']:<4} {r['name']:<28} {r['composite_score']:>6.2f}   {r['weight_source']}")

    # --- Step 3: Select target site ---
    if site_name:
        target = next((r for r in valid_results if r["name"] == site_name), None)
        if target is None:
            logger.error("[xai_gemini] Site '%s' not found. Using #1 ranked site.", site_name)
            target = valid_results[0]
    else:
        target = valid_results[0]

    logger.info(
        "[xai_gemini] Explaining site: '%s' (rank #%d, score %.2f)",
        target["name"], target["rank"], target["composite_score"],
    )

    # --- Step 4: Load ML archetypes (optional context) ---
    archetypes = _load_ml_archetypes()

    # --- Step 5: Feature 1 -- Site-selection explanation ---
    _banner("Step 2 -- Site Selection Explanation")
    sel_payload = build_site_explanation_input(target, valid_results, archetypes)
    site_explanation = gemini_service.explain_site_selection(sel_payload)
    print(f"  Summary: {site_explanation.get('summary', '')[:200]}")
    print(f"  Source : {site_explanation.get('_source', '?')}")

    # --- Step 6: Feature 2 -- Risk mitigation ---
    _banner("Step 3 -- Risk Mitigation Recommendations")
    risk_payload = build_risk_mitigation_input(target, FACTOR_LABELS)
    risk_explanation = gemini_service.explain_risk_mitigation(risk_payload)
    print(f"  Overview: {risk_explanation.get('overview', '')[:200]}")
    print(f"  Source  : {risk_explanation.get('_source', '?')}")

    # --- Step 7: Feature 3 -- Mission-priority counterfactual ---
    _banner("Step 4 -- Mission-Priority Counterfactual Analysis")
    cf_input = run_all_scenarios(
        selected_site_name=target["name"],
        baseline_results=valid_results,
        factor_labels=FACTOR_LABELS,
        factor_order=FACTOR_ORDER,
    )

    # Print classification table
    print(f"\n  {'Factor':<20} {'d weight':<12} {'Winner':<28} {'Class'}")
    print(f"  {'-'*20} {'-'*12} {'-'*28} {'-'*22}")
    for s in cf_input.scenarios:
        print(
            f"  {s.changed_factor_label:<20} "
            f"+{s.delta_pct:<10.1f}%  "
            f"{s.scenario_winner:<28} "
            f"{s.classification}"
        )

    cf_explanation = gemini_service.explain_counterfactual(cf_input)
    print(f"\n  Summary: {cf_explanation.get('summary', '')[:200]}")
    print(f"  Source : {cf_explanation.get('_source', '?')}")

    # --- Step 8: Save all outputs ---
    _banner("Step 5 -- Saving Outputs")
    safe_name = target["name"].replace(" ", "_").replace("/", "-")

    ahp_path = _save("ahp_results.json", {"results": ahp_results, "weight_source": target["weight_source"]})
    sel_path = _save(f"site_explanation_{safe_name}.json", {
        "site_name": target["name"],
        "rank": target["rank"],
        "composite_score": target["composite_score"],
        "explanation": site_explanation,
    })
    risk_path = _save(f"risk_mitigation_{safe_name}.json", {
        "site_name": target["name"],
        "risk_explanation": risk_explanation,
    })
    cf_scenarios_raw = [s.__dict__ if hasattr(s, "__dict__") else s for s in cf_input.scenarios]
    cf_path = _save(f"counterfactual_{safe_name}.json", {
        "site_name": target["name"],
        "baseline_rank": cf_input.baseline_rank,
        "robust_factors": cf_input.robust_factors,
        "sensitive_factors": cf_input.sensitive_factors,
        "limited_factors": cf_input.limited_factors,
        "explanation": cf_explanation,
    })

    print(f"  AHP results    -> {ahp_path}")
    print(f"  Site explain   -> {sel_path}")
    print(f"  Risk mitigation-> {risk_path}")
    print(f"  Counterfactual -> {cf_path}")

    elapsed = round(time.monotonic() - t0, 1)
    _banner(f"Gemini XAI Complete -- {elapsed}s")
    print(f"  Site explained   : {target['name']} (rank #{target['rank']})")
    print(f"  Gemini available : {gemini_available}")
    print(f"  Explanation mode : {'GEMINI' if gemini_available else 'FALLBACK (deterministic)'}")
    print(f"  AHP rank #1 UNCHANGED: {valid_results[0]['name']}")
    print()

    return {
        "ahp_results": ahp_results,
        "site_explanation": site_explanation,
        "risk_mitigation": risk_explanation,
        "counterfactual": {
            "scenarios": cf_input.to_dict(),
            "explanation": cf_explanation,
        },
        "gemini_available": gemini_available,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Gemini XAI -- Lunar Habitat Site Selection Explanations"
    )
    parser.add_argument(
        "--site",
        type=str,
        default=None,
        help="Site name to explain (default: #1 AHP-ranked site)",
    )
    args = parser.parse_args()
    run_gemini_xai(site_name=args.site)
