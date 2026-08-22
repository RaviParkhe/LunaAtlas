"""
xai/gemini/gemini_service.py
============================
Gemini API integration for natural-language XAI explanation generation.

RESPONSIBILITY: Convert already-calculated structured facts into human-readable
explanations. This module NEVER performs calculations, never determines rankings,
never classifies risks, and never runs counterfactuals.

SECURITY:
  - API key read from GEMINI_API_KEY environment variable only.
  - Key is NEVER logged, hardcoded, or exposed to the frontend.
  - Only XAI DTO payloads are sent to Gemini (no raw internal objects).

FALLBACK:
  - If GEMINI_API_KEY is absent, or Gemini is unavailable for any reason,
    a deterministic fallback explanation is generated from the same structured
    facts. The AHP ranking is never affected by this fallback.

Uses: google-genai SDK (v1.59.0+), which is already installed.
"""

from __future__ import annotations
import os
import json
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini model configuration
# ---------------------------------------------------------------------------

_GEMINI_MODEL       = "gemini-3.6-flash"
_REQUEST_TIMEOUT    = 60   # seconds (increased for larger payloads)
_MAX_OUTPUT_TOKENS  = 4096

# ---------------------------------------------------------------------------
# System prompt (injected once per client session)
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an explanation generator for a lunar habitat site-selection decision-support system.

ROLE:
  You are NOT the decision-maker. Your only job is to convert pre-calculated,
  structured facts into clear, scientifically-cautious human-readable explanations.

ALL numerical calculations, AHP weights, factor scores, rankings, risk levels,
and counterfactual results were computed by the application. You must NOT:
  - Calculate, modify, or question AHP scores or weights
  - Determine which site is best
  - Invent, estimate, or fabricate measurements, risks, or environmental values
  - Override rankings or change the selected site
  - Perform counterfactual arithmetic
  - Claim that a site is absolutely safe or guaranteed suitable for humans

LANGUAGE REQUIREMENTS:
  - Use scientifically cautious language:
      "comparatively favorable", "relatively strong", "identified limitation",
      "under the selected mission priorities", "based on available data"
  - Distinguish clearly between: (a) calculated facts, (b) interpretation, (c) recommendations
  - Be accessible to both technical and non-technical readers
  - Be concise — avoid repetition

If any information is marked as unavailable or data-limited, say so explicitly.
Do NOT invent substitute values.

OUTPUT FORMAT:
  Always respond with valid JSON matching the schema provided in the user message.
  Do not include explanations, markdown, or text outside the JSON structure.
"""


# ---------------------------------------------------------------------------
# Gemini client factory (lazy initialization)
# ---------------------------------------------------------------------------

class _GeminiClient:
    """Lazy wrapper around the google-genai client."""

    def __init__(self):
        self._client = None
        self._api_key: Optional[str] = None

    def _initialize(self) -> bool:
        """
        Attempt to initialize the Gemini client from environment.
        Returns True if successful, False if API key is missing.
        """
        if self._client is not None:
            return True

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            logger.warning(
                "[gemini] GEMINI_API_KEY not set. "
                "Gemini explanations disabled — deterministic fallback will be used."
            )
            return False

        try:
            import google.genai as genai
            self._client = genai.Client(api_key=api_key)
            # Store only the first 4 chars for log confirmation (not the full key)
            self._api_key = api_key[:4] + "****"
            logger.info("[gemini] Client initialized (key prefix: %s)", self._api_key)
            return True
        except ImportError:
            logger.error(
                "[gemini] google-genai package not found. "
                "Install: pip install google-genai"
            )
            return False
        except Exception as exc:
            logger.error("[gemini] Failed to initialize client: %s", type(exc).__name__)
            return False

    def generate(self, contents: str, response_schema: dict | None = None) -> Optional[str]:
        """
        Send a generation request to Gemini.

        Parameters
        ----------
        contents : str
            The user-turn message (structured XAI payload as JSON).
        response_schema : dict or None
            Optional JSON schema for structured output.

        Returns
        -------
        str or None
            Raw text response, or None on failure.
        """
        if not self._initialize():
            return None

        try:
            import google.genai as genai
            from google.genai import types

            config_kwargs = {
                "system_instruction": _SYSTEM_PROMPT,
                "max_output_tokens": _MAX_OUTPUT_TOKENS,
            }

            # Request structured JSON output if schema provided
            if response_schema:
                config_kwargs["response_mime_type"] = "application/json"
                config_kwargs["response_schema"] = response_schema

            config = types.GenerateContentConfig(**config_kwargs)

            t0 = time.monotonic()
            response = self._client.models.generate_content(
                model=_GEMINI_MODEL,
                contents=contents,
                config=config,
            )
            latency = round(time.monotonic() - t0, 2)
            logger.info("[gemini] Response received in %.2fs", latency)

            if response and response.text:
                return response.text.strip()

            logger.warning("[gemini] Empty response received from model.")
            return None

        except Exception as exc:
            exc_type = type(exc).__name__
            logger.error("[gemini] Request failed: %s — %s", exc_type, str(exc)[:200])
            return None


# Module-level shared client (one client, many requests)
_client = _GeminiClient()


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _parse_json_response(raw: str, fallback: dict) -> tuple[dict, bool]:
    """
    Parse Gemini JSON response safely.
    Returns (result_dict, is_gemini_response).
    is_gemini_response is False if parsing failed or raw was empty.
    """
    if not raw:
        logger.warning("[gemini] Empty response — using fallback.")
        return fallback, False
    try:
        # Strip markdown code fences if present
        text = raw.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
        return json.loads(text), True
    except json.JSONDecodeError as exc:
        logger.warning("[gemini] JSON parse failed (%s) — using fallback.", exc)
        return fallback, False


# ---------------------------------------------------------------------------
# Response schema (what we ask Gemini to return)
# ---------------------------------------------------------------------------

_SITE_EXPLANATION_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "key_reasons": {"type": "array", "items": {"type": "string"}},
        "limitations": {"type": "array", "items": {"type": "string"}},
        "ml_context": {"type": "string"},
    },
    "required": ["summary", "key_reasons", "limitations"],
}

_RISK_MITIGATION_SCHEMA = {
    "type": "object",
    "properties": {
        "overview": {"type": "string"},
        "mitigations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "factor": {"type": "string"},
                    "risk_level": {"type": "string"},
                    "recommendation": {"type": "string"},
                },
                "required": ["factor", "risk_level", "recommendation"],
            },
        },
        "mission_note": {"type": "string"},
    },
    "required": ["overview", "mitigations"],
}

_COUNTERFACTUAL_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "scenario_narratives": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "factor": {"type": "string"},
                    "classification": {"type": "string"},
                    "narrative": {"type": "string"},
                },
                "required": ["factor", "classification", "narrative"],
            },
        },
        "overall_robustness": {"type": "string"},
    },
    "required": ["summary", "scenario_narratives", "overall_robustness"],
}


# ---------------------------------------------------------------------------
# Deterministic fallback explanations
# ---------------------------------------------------------------------------

def _fallback_site_explanation(payload_dict: dict) -> dict:
    """
    Generate a deterministic site-selection explanation from structured facts.
    Used when Gemini is unavailable. No fake values — everything from payload.
    """
    name     = payload_dict["site_name"]
    rank     = payload_dict["rank"]
    score    = payload_dict["composite_score"]
    strongest= payload_dict["strongest_factor_label"]
    weakest  = payload_dict["weakest_factor_label"]
    source   = payload_dict["weight_source"]
    archetype= payload_dict.get("ml_archetype") or "not available"

    factors = payload_dict.get("factors", [])
    top_contribs = sorted(factors, key=lambda f: -f["contribution"])[:3]
    reason_lines = [
        f"{f['factor_label']}: raw score {f['raw_score']:.1f}/100, "
        f"weight {f['weight_pct']:.1f}%, contributed {f['contribution']:.2f} composite points."
        for f in top_contribs
    ]

    return {
        "summary": (
            f"{name} is ranked #{rank} with a composite score of {score:.1f}/100 "
            f"under {source.replace('_', ' ').lower()} mission priorities. "
            f"Its comparatively strong {strongest} is the primary driver of this ranking. "
            f"Its identified relative limitation is {weakest}."
        ),
        "key_reasons": reason_lines,
        "limitations": [
            f"{weakest} is the lowest-scoring factor for this site under current priorities.",
            "All scores are relative to other candidate sites in this dataset.",
        ],
        "ml_context": (
            f"Environmental archetype: {archetype}."
            if archetype != "not available"
            else "ML archetype: data not available."
        ),
        "_source": "FALLBACK",
    }


def _fallback_risk_explanation(payload_dict: dict) -> dict:
    """
    Generate a deterministic risk-mitigation explanation from structured facts.
    """
    name  = payload_dict["site_name"]
    risks = payload_dict.get("risks", [])
    mission = payload_dict.get("mission", {})

    mitigations = []
    for r in risks:
        lvl   = r["risk_level"]
        label = r["factor_label"]
        score = r["score"]

        if lvl == "HIGH":
            rec = (
                f"{label} presents an identified high-concern area (score: {score:.1f}/100). "
                f"Additional shielding, redundancy, or operational mitigation measures "
                f"should be assessed prior to mission planning."
            )
        elif lvl == "MEDIUM":
            rec = (
                f"{label} is a moderate concern (score: {score:.1f}/100). "
                f"Standard mitigation protocols are recommended."
            )
        elif lvl == "DATA_LIMITED":
            rec = (
                f"{label} assessment is data-limited (proxy score: {score:.1f}/100). "
                f"Dedicated measurement data is recommended before mission commitment."
            )
        else:
            rec = f"{label} is within acceptable range (score: {score:.1f}/100)."

        mitigations.append({
            "factor": label,
            "risk_level": lvl,
            "recommendation": rec,
        })

    top_priority = mission.get("top_priority", "Safety")
    return {
        "overview": (
            f"Risk assessment for {name} based on available data. "
            f"Under the current mission priorities (top priority: {top_priority}), "
            f"{len([r for r in risks if r['risk_level'] in ('HIGH','MEDIUM')])} factor(s) "
            f"require attention."
        ),
        "mitigations": mitigations,
        "mission_note": (
            f"Mission profile: top priority = {top_priority}, "
            f"second priority = {mission.get('second_priority', 'N/A')}."
        ),
        "_source": "FALLBACK",
    }


def _fallback_counterfactual_explanation(payload_dict: dict) -> dict:
    """
    Generate a deterministic counterfactual explanation from structured facts.
    """
    name      = payload_dict["site_name"]
    robust    = payload_dict.get("robust_factors", [])
    sensitive = payload_dict.get("sensitive_factors", [])
    limited   = payload_dict.get("limited_factors", [])
    scenarios = payload_dict.get("scenarios", [])

    narratives = []
    for s in scenarios:
        clsf  = s["classification"]
        label = s["changed_factor_label"]
        b_w   = s["baseline_weight_pct"]
        p_w   = s["perturbed_weight_pct"]
        score = s["selected_site_factor_score"]
        new_winner = s["scenario_winner"]

        if clsf == "ROBUST":
            text = (
                f"Increasing {label} priority from {b_w:.1f}% to {p_w:.1f}% "
                f"does not change the recommended site. "
                f"{name} maintains its ranking comparatively well "
                f"(factor score: {score:.1f}/100)."
            )
        elif clsf == "SENSITIVE":
            text = (
                f"Increasing {label} priority from {b_w:.1f}% to {p_w:.1f}% "
                f"changes the top recommendation from {name} to {new_winner}. "
                f"This suggests the ranking is sensitive to this priority shift."
            )
        elif clsf == "CAPABILITY_LIMITATION":
            text = (
                f"Increasing {label} priority from {b_w:.1f}% to {p_w:.1f}% "
                f"keeps {name} as top site, but its {label} score is only "
                f"{score:.1f}/100 — an identified capability limitation "
                f"under increased {label} emphasis."
            )
        else:
            text = f"{label}: scenario classification = {clsf}."

        narratives.append({
            "factor": label,
            "classification": clsf,
            "narrative": text,
        })

    return {
        "summary": (
            f"Counterfactual analysis for {name} (baseline rank #1). "
            f"Robust factors: {', '.join(robust) or 'none'}. "
            f"Sensitive factors: {', '.join(sensitive) or 'none'}. "
            f"Capability limitations: {', '.join(limited) or 'none'}."
        ),
        "scenario_narratives": narratives,
        "overall_robustness": (
            "ROBUST" if not sensitive and not limited
            else ("MIXED" if not sensitive else "SENSITIVE")
        ),
        "_source": "FALLBACK",
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def explain_site_selection(payload) -> dict:
    """
    Generate a natural-language site-selection explanation via Gemini.

    Parameters
    ----------
    payload : SiteSelectionExplanationInput
        Pre-calculated DTO from payloads.py.

    Returns
    -------
    dict
        Keys: summary, key_reasons, limitations, ml_context
        Plus '_source': 'GEMINI' or 'FALLBACK'
    """
    payload_dict = payload.to_dict()
    logger.info(
        "[gemini] explain_site_selection: site=%s rank=%d score=%.2f",
        payload_dict["site_name"], payload_dict["rank"], payload_dict["composite_score"],
    )

    fallback = _fallback_site_explanation(payload_dict)

    user_message = (
        "Generate a site-selection explanation from these pre-calculated facts.\n\n"
        "Structured input:\n"
        f"{json.dumps(payload_dict, indent=2)}\n\n"
        "Return a JSON object with these fields:\n"
        "  summary        : 2–3 sentence explanation of why this site ranked #1\n"
        "  key_reasons    : list of 3–5 specific reasons grounded in the numbers above\n"
        "  limitations    : list of 1–3 identified limitations or caveats\n"
        "  ml_context     : 1 sentence about the environmental archetype (if provided)\n"
        "Use only the facts provided. Do not invent values."
    )

    raw = _client.generate(user_message, response_schema=_SITE_EXPLANATION_SCHEMA)
    result, is_gemini = _parse_json_response(raw, fallback)
    result["_source"] = "GEMINI" if is_gemini else "FALLBACK"
    return result


def explain_risk_mitigation(payload) -> dict:
    """
    Generate natural-language risk-mitigation recommendations via Gemini.

    Parameters
    ----------
    payload : RiskMitigationInput
        Pre-calculated DTO from payloads.py.

    Returns
    -------
    dict
        Keys: overview, mitigations (list), mission_note
        Plus '_source': 'GEMINI' or 'FALLBACK'
    """
    payload_dict = payload.to_dict()
    logger.info(
        "[gemini] explain_risk_mitigation: site=%s risks=%d",
        payload_dict["site_name"], len(payload_dict["risks"]),
    )

    fallback = _fallback_risk_explanation(payload_dict)

    user_message = (
        "Generate contextual risk-mitigation recommendations from these pre-calculated facts.\n\n"
        "Structured input:\n"
        f"{json.dumps(payload_dict, indent=2)}\n\n"
        "Return a JSON object with these fields:\n"
        "  overview      : 1–2 sentences summarising the overall risk profile\n"
        "  mitigations   : list of objects, one per risk, each with:\n"
        "                    factor (string), risk_level (string), recommendation (string)\n"
        "  mission_note  : 1 sentence on how mission priorities affect risk interpretation\n"
        "Use only the risks provided. Do not invent measurements or radiation values. "
        "Be scientifically cautious."
    )

    raw = _client.generate(user_message, response_schema=_RISK_MITIGATION_SCHEMA)
    result, is_gemini = _parse_json_response(raw, fallback)
    result["_source"] = "GEMINI" if is_gemini else "FALLBACK"
    return result


def explain_counterfactual(payload) -> dict:
    """
    Generate natural-language counterfactual narratives via Gemini.

    Parameters
    ----------
    payload : CounterfactualExplanationInput
        Pre-calculated DTO from counterfactual.py.

    Returns
    -------
    dict
        Keys: summary, scenario_narratives (list), overall_robustness
        Plus '_source': 'GEMINI' or 'FALLBACK'
    """
    payload_dict = payload.to_dict()
    logger.info(
        "[gemini] explain_counterfactual: site=%s scenarios=%d",
        payload_dict["site_name"], len(payload_dict["scenarios"]),
    )

    fallback = _fallback_counterfactual_explanation(payload_dict)

    user_message = (
        "Generate counterfactual explanations from these pre-calculated results.\n\n"
        "Structured input:\n"
        f"{json.dumps(payload_dict, indent=2)}\n\n"
        "For context:\n"
        "  ROBUST               = priority change does not alter the top recommendation.\n"
        "  SENSITIVE            = priority change causes a different site to rank #1.\n"
        "  CAPABILITY_LIMITATION= ranking held but the site has a weak score in that factor.\n\n"
        "Return a JSON object with these fields:\n"
        "  summary             : 2–3 sentence overview of the counterfactual analysis\n"
        "  scenario_narratives : list of objects, one per scenario, each with:\n"
        "                          factor (string), classification (string), narrative (string)\n"
        "  overall_robustness  : one word — ROBUST, MIXED, or SENSITIVE\n"
        "Use only the pre-calculated results. Do not recalculate scores or weights."
    )

    raw = _client.generate(user_message, response_schema=_COUNTERFACTUAL_SCHEMA)
    result, is_gemini = _parse_json_response(raw, fallback)
    result["_source"] = "GEMINI" if is_gemini else "FALLBACK"
    return result
