"""
xai/gemini/payloads.py
======================
XAI Data Transfer Objects (DTOs) for Gemini input payloads.

These dataclasses act as explicit contracts between the Python/AHP calculation
layer and the Gemini natural-language generation layer. They ensure:

1. Only the minimum required information is sent to Gemini.
2. Internal fields (database paths, raw objects, credentials) cannot leak.
3. Each payload is self-describing and independently auditable.

CRITICAL: The LLM receives ONLY these payload objects — never raw AHP dicts,
site entries, or scoring-engine internals.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Feature 1: Site Selection Explanation payload
# ---------------------------------------------------------------------------

@dataclass
class FactorDetail:
    """Score breakdown for a single AHP factor."""
    factor_id:     str
    factor_label:  str
    weight_pct:    float          # e.g. 39.66
    raw_score:     float          # 0–100 raw factor score
    contribution:  float          # = weight * raw_score  (in composite-score points)


@dataclass
class SiteComparisonSnapshot:
    """Lightweight view of another candidate site for comparison context."""
    name:            str
    rank:            int
    composite_score: float
    strongest_factor: str         # factor_id of highest raw score
    weakest_factor:   str         # factor_id of lowest raw score


@dataclass
class SiteSelectionExplanationInput:
    """
    All structured facts needed to explain WHY a site was ranked #1.

    Gemini receives this object only — no raw scoring-engine dicts.
    """
    site_name:           str
    rank:                int
    composite_score:     float
    weight_source:       str                  # "AHP_DEFAULT" or "SLIDER_OVERRIDE"
    factors:             List[FactorDetail]   # ordered by AHP weight descending

    # Derived context (computed by the application, not the LLM)
    strongest_factors:   List[str]            # factor_ids sorted by raw_score desc
    weakest_factors:     List[str]            # factor_ids sorted by raw_score asc
    strongest_factor_label: str
    weakest_factor_label:   str

    # Comparison against other candidates
    all_sites_summary:   List[SiteComparisonSnapshot]

    # ML archetype (contextual, not an AHP score)
    ml_archetype:        Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Feature 2: Risk → Mitigation payload
# ---------------------------------------------------------------------------

@dataclass
class FactorRisk:
    """Computed risk for a single AHP factor."""
    factor_id:    str
    factor_label: str
    risk_level:   str    # "LOW" | "MEDIUM" | "HIGH" | "DATA_LIMITED"
    score:        float  # the underlying raw factor score (0–100)
    note:         str    # short note e.g. "Dust risk proxy: higher score = safer"


@dataclass
class MissionContext:
    """
    Mission profile derived from active AHP weights.

    Only fields that actually exist in the application are included.
    The LLM cannot invent additional mission parameters.
    """
    weight_source:    str                    # "AHP_DEFAULT" or "SLIDER_OVERRIDE"
    top_priority:     str                    # label of highest-weight factor
    second_priority:  str                    # label of second-highest-weight factor
    weights_pct:      Dict[str, float]       # {factor_label: weight_pct}


@dataclass
class RiskMitigationInput:
    """
    All structured facts needed to generate contextual risk-mitigation text.

    Gemini receives this object only.
    """
    site_name:       str
    rank:            int
    composite_score: float
    risks:           List[FactorRisk]
    mission:         MissionContext

    # Only meaningful risks (non-LOW) are included by default
    # LOW risks are omitted to keep the prompt focused
    meaningful_risk_count: int   # number of MEDIUM or HIGH risks

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Feature 3: Counterfactual Explanation payload
# ---------------------------------------------------------------------------

@dataclass
class WeightSnapshot:
    """AHP weights at a specific scenario state."""
    weights_pct: Dict[str, float]   # {factor_label: weight_pct}


@dataclass
class CounterfactualResult:
    """
    Result of a single mission-priority perturbation scenario.

    Computed entirely by Python — Gemini never performs these calculations.
    """
    changed_factor_id:    str
    changed_factor_label: str
    baseline_weight_pct:  float
    perturbed_weight_pct: float
    delta_pct:            float              # = perturbed - baseline

    baseline_winner:      str
    scenario_winner:      str
    winner_changed:       bool

    selected_site_factor_score: float        # raw score of selected site for changed factor
    runner_up_name:       Optional[str]      # second-place site at baseline
    runner_up_score:      Optional[float]    # runner-up composite at perturbed weights

    # One of: "ROBUST" | "SENSITIVE" | "CAPABILITY_LIMITATION"
    classification:       str

    # Human-readable baseline and perturbed weight tables
    baseline_weights:     WeightSnapshot
    perturbed_weights:    WeightSnapshot


@dataclass
class CounterfactualExplanationInput:
    """
    All counterfactual scenarios for a site, ready for Gemini.

    Contains: the baseline, all scenarios, and a summary of notable ones.
    """
    site_name:          str
    baseline_rank:      int
    baseline_score:     float
    baseline_weights:   WeightSnapshot

    scenarios:          List[CounterfactualResult]

    # Pre-filtered notable scenarios (computed by Python)
    robust_factors:      List[str]    # factor labels where classification=ROBUST
    sensitive_factors:   List[str]    # factor labels where classification=SENSITIVE
    limited_factors:     List[str]    # factor labels where classification=CAPABILITY_LIMITATION

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Helper: build factor details list from score_sites() output
# ---------------------------------------------------------------------------

def build_factor_details(
    result: dict,
    factor_labels: Dict[str, str],
    factor_order: List[str],
) -> List[FactorDetail]:
    """
    Convert a score_sites() result entry into a list of FactorDetail objects.

    Parameters
    ----------
    result : dict
        One entry from score_sites() output.
    factor_labels : dict
        {factor_id: human_label}  — from scoring_engine.FACTOR_LABELS
    factor_order : list
        Ordered factor ids — from scoring_engine.FACTOR_ORDER
    """
    details = []
    weights_used   = result.get("weights_used", {})
    factor_scores  = result.get("factor_scores", {})
    factor_weighted = result.get("factor_weighted", {})

    for fid in factor_order:
        w   = weights_used.get(fid, 0.0)
        raw = factor_scores.get(fid, 0.0)
        con = factor_weighted.get(fid, 0.0)
        details.append(FactorDetail(
            factor_id=fid,
            factor_label=factor_labels.get(fid, fid),
            weight_pct=round(w * 100, 2),
            raw_score=round(raw, 2),
            contribution=round(con, 3),
        ))

    # Sort by weight descending (matches AHP importance order)
    details.sort(key=lambda d: -d.weight_pct)
    return details
