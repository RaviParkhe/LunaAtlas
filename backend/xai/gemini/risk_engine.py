"""
xai/gemini/risk_engine.py
=========================
Derives structured risk levels from existing AHP factor scores.

IMPORTANT: This module does NOT invent data.
All risk levels are computed from the same factor scores used by the AHP
scoring engine (score_sites()). No new data sources are introduced.

Risk level thresholds (applied per factor):
    HIGH   : factor_score < 40     (significant concern)
    MEDIUM : 40 <= factor_score < 70  (moderate concern)
    LOW    : factor_score >= 70     (acceptable)
    DATA_LIMITED : factor is a neutral proxy (expansion, scientific_value)
                   — these use a fixed placeholder score of 50.0

Factor-specific semantics:
    safety          → score = (100 - dust_risk). Low score = high dust = risky.
    water_ice       → score = ice_score. Low score = less water-ice access.
    sunlight        → score = sunlight_score. Low score = less solar energy.
    resources       → proxy = avg(ice, sunlight). Low score = limited ISRU potential.
    expansion       → neutral 50.0 proxy. Flagged as DATA_LIMITED.
    scientific_value → proxy = avg(all). Flagged as DATA_LIMITED.
"""

from __future__ import annotations
import sys
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(os.path.dirname(_HERE))
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

from xai.gemini.payloads import FactorRisk, RiskMitigationInput, MissionContext


# ---------------------------------------------------------------------------
# Thresholds and metadata
# ---------------------------------------------------------------------------

RISK_HIGH_THRESHOLD   = 40.0
RISK_MEDIUM_THRESHOLD = 70.0

# Factors using neutral proxy scores — flag as DATA_LIMITED instead of HIGH/MED/LOW
DATA_LIMITED_FACTORS = {"expansion", "scientific_value"}

# Human-readable notes per factor (explains what the score means)
FACTOR_NOTES = {
    "safety": (
        "Safety score = 100 minus dust-risk score. "
        "Lower safety score indicates higher dust accumulation risk."
    ),
    "water_ice": (
        "Water-ice score = permanent-shadow proxy (ice persistence). "
        "Lower score indicates reduced water-ice accessibility near the site."
    ),
    "sunlight": (
        "Sunlight score = % illumination time (0–100 scale). "
        "Lower score indicates reduced solar energy potential."
    ),
    "resources": (
        "Resources score = proxy average of ice and sunlight scores. "
        "Lower score indicates limited in-situ resource utilization (ISRU) potential."
    ),
    "expansion": (
        "Expansion score is a neutral proxy (50.0) — "
        "no terrain-flatness layer is available yet. Data limited."
    ),
    "scientific_value": (
        "Scientific value score is a proxy average of all raw data layers. "
        "Exact scientific characterization requires additional datasets. Data limited."
    ),
}


# ---------------------------------------------------------------------------
# Core risk classification
# ---------------------------------------------------------------------------

def classify_risk(score: float, factor_id: str) -> str:
    """Classify a factor score into a risk level string."""
    if factor_id in DATA_LIMITED_FACTORS:
        return "DATA_LIMITED"
    if score < RISK_HIGH_THRESHOLD:
        return "HIGH"
    if score < RISK_MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"


def compute_risks(site_result: dict, factor_labels: dict) -> list[FactorRisk]:
    """
    Compute structured risk levels for all AHP factors of a site.

    Parameters
    ----------
    site_result : dict
        One entry from score_sites() — must contain 'factor_scores'.
    factor_labels : dict
        {factor_id: human_label} from scoring_engine.FACTOR_LABELS

    Returns
    -------
    list[FactorRisk]
        One FactorRisk entry per AHP factor, sorted by severity:
        HIGH → MEDIUM → DATA_LIMITED → LOW
    """
    factor_scores = site_result.get("factor_scores", {})
    risks = []

    for fid, score in factor_scores.items():
        level = classify_risk(score, fid)
        risks.append(FactorRisk(
            factor_id=fid,
            factor_label=factor_labels.get(fid, fid),
            risk_level=level,
            score=round(score, 2),
            note=FACTOR_NOTES.get(fid, ""),
        ))

    # Sort: HIGH first, then MEDIUM, then DATA_LIMITED, then LOW
    _order = {"HIGH": 0, "MEDIUM": 1, "DATA_LIMITED": 2, "LOW": 3}
    risks.sort(key=lambda r: _order.get(r.risk_level, 9))
    return risks


def build_mission_context(weights_used: dict, factor_labels: dict) -> MissionContext:
    """
    Derive a MissionContext from the active AHP weights.

    Parameters
    ----------
    weights_used : dict
        {factor_id: weight (0–1)} — from score_sites() result.
    factor_labels : dict
        {factor_id: label}

    Returns
    -------
    MissionContext
    """
    sorted_factors = sorted(weights_used.items(), key=lambda x: -x[1])
    top_id     = sorted_factors[0][0] if len(sorted_factors) > 0 else ""
    second_id  = sorted_factors[1][0] if len(sorted_factors) > 1 else ""

    return MissionContext(
        weight_source=_infer_weight_source(weights_used),
        top_priority=factor_labels.get(top_id, top_id),
        second_priority=factor_labels.get(second_id, second_id),
        weights_pct={
            factor_labels.get(fid, fid): round(w * 100, 2)
            for fid, w in weights_used.items()
        },
    )


def _infer_weight_source(weights_used: dict) -> str:
    """Try to detect if weights are AHP defaults or slider-overridden."""
    # Import here to avoid circular imports at module load
    try:
        from scoring_engine import AHP_WEIGHTS, _normalize_weights
        norm_ahp = _normalize_weights(AHP_WEIGHTS.copy())
        for fid, w in weights_used.items():
            if abs(w - norm_ahp.get(fid, 0.0)) > 0.0001:
                return "SLIDER_OVERRIDE"
        return "AHP_DEFAULT"
    except Exception:
        return "UNKNOWN"


def build_risk_mitigation_input(
    site_result: dict,
    factor_labels: dict,
    include_low_risks: bool = False,
) -> RiskMitigationInput:
    """
    Build a complete RiskMitigationInput DTO from a score_sites() result.

    Parameters
    ----------
    site_result : dict
        One entry from score_sites()
    factor_labels : dict
        {factor_id: label}
    include_low_risks : bool
        If False (default), LOW-risk factors are excluded from the payload
        to keep Gemini focused on meaningful risks.

    Returns
    -------
    RiskMitigationInput
    """
    all_risks = compute_risks(site_result, factor_labels)
    meaningful = [r for r in all_risks if r.risk_level in ("HIGH", "MEDIUM")]
    data_limited = [r for r in all_risks if r.risk_level == "DATA_LIMITED"]

    # Include DATA_LIMITED if there are no other meaningful risks
    if not meaningful:
        meaningful = data_limited or all_risks

    risks_for_payload = meaningful if not include_low_risks else all_risks

    mission = build_mission_context(
        site_result.get("weights_used", {}), factor_labels
    )

    return RiskMitigationInput(
        site_name=site_result["name"],
        rank=site_result.get("rank", 0),
        composite_score=site_result.get("composite_score", 0.0),
        risks=risks_for_payload,
        mission=mission,
        meaningful_risk_count=len(meaningful),
    )
