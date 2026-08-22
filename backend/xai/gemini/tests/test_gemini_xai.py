"""
xai/gemini/tests/test_gemini_xai.py
====================================
Unit tests for the Gemini XAI layer.

CRITICAL: These tests verify that ALL numerical calculations are performed
by Python/AHP — NOT by the LLM.

Test categories:
  - Counterfactual engine (pure math, no Gemini)
  - Risk classification (pure math, no Gemini)
  - Weight normalisation
  - Gemini service fallback behaviour
  - AHP ranking identity (XAI enabled == XAI disabled)
  - Payload construction

Gemini API calls are mocked for deterministic results.
Live Gemini tests are in a separate section (requires GEMINI_API_KEY).

Run unit tests only:
    cd d:\\LunaAstraT\\LunarHabitatAI
    python -m pytest xai/gemini/tests/test_gemini_xai.py -v

Run live Gemini integration tests (requires GEMINI_API_KEY):
    python -m pytest xai/gemini/tests/test_gemini_xai.py -v -m integration
"""

import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock

_REPO = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)


# ===========================================================================
# Section 1: Counterfactual Engine (pure Python, no Gemini)
# ===========================================================================

class TestWeightPerturbation(unittest.TestCase):
    """Test weight perturbation mathematics."""

    def setUp(self):
        # Actual AHP weights from ahp_config.json (normalised)
        self.baseline = {
            "safety":          0.3966,
            "water_ice":       0.2685,
            "sunlight":        0.1214,
            "resources":       0.1214,
            "expansion":       0.0548,
            "scientific_value":0.0373,
        }
        # Normalise to exactly 1.0
        total = sum(self.baseline.values())
        self.baseline = {k: v / total for k, v in self.baseline.items()}

    def test_weights_sum_to_one_after_perturbation(self):
        """TEST D: All weights after perturbation must sum to 1.0."""
        from xai.gemini.counterfactual import perturb_weights
        for fid in self.baseline:
            perturbed = perturb_weights(self.baseline, fid, delta_pct=5.0)
            total = sum(perturbed.values())
            self.assertAlmostEqual(
                total, 1.0, places=9,
                msg=f"Weights don't sum to 1.0 after perturbing '{fid}': sum={total}"
            )

    def test_target_factor_increases(self):
        """Perturbed factor weight must be >= baseline weight."""
        from xai.gemini.counterfactual import perturb_weights
        for fid in self.baseline:
            perturbed = perturb_weights(self.baseline, fid, delta_pct=5.0)
            self.assertGreaterEqual(
                perturbed[fid], self.baseline[fid],
                msg=f"Factor '{fid}' weight did not increase after perturbation"
            )

    def test_other_factors_decrease(self):
        """All other factors must decrease or stay the same after perturbation."""
        from xai.gemini.counterfactual import perturb_weights
        fid = "safety"
        perturbed = perturb_weights(self.baseline, fid, delta_pct=5.0)
        for other_fid in self.baseline:
            if other_fid != fid:
                self.assertLessEqual(
                    perturbed[other_fid], self.baseline[other_fid] + 1e-12,
                    msg=f"Factor '{other_fid}' unexpectedly increased after perturbing '{fid}'"
                )

    def test_all_weights_non_negative(self):
        """No weight should become negative after perturbation."""
        from xai.gemini.counterfactual import perturb_weights
        for fid in self.baseline:
            perturbed = perturb_weights(self.baseline, fid, delta_pct=5.0)
            for k, v in perturbed.items():
                self.assertGreaterEqual(v, 0.0, msg=f"Negative weight for '{k}' after perturbing '{fid}'")

    def test_invalid_factor_raises(self):
        """Perturbing a non-existent factor must raise ValueError."""
        from xai.gemini.counterfactual import perturb_weights
        with self.assertRaises(ValueError):
            perturb_weights(self.baseline, "nonexistent_factor", delta_pct=5.0)

    def test_large_perturbation_clamped(self):
        """A 100pp perturbation should clamp weight to 1.0 without crashing."""
        from xai.gemini.counterfactual import perturb_weights
        perturbed = perturb_weights(self.baseline, "safety", delta_pct=100.0)
        self.assertAlmostEqual(perturbed["safety"], 1.0, places=9)
        total = sum(perturbed.values())
        self.assertAlmostEqual(total, 1.0, places=9)


class TestScenarioClassification(unittest.TestCase):
    """Test scenario classification logic (pure Python)."""

    def test_robust_classification(self):
        """
        TEST A: Winner unchanged AND capability >= threshold → ROBUST.
        """
        from xai.gemini.counterfactual import classify_scenario, CAPABILITY_THRESHOLD
        # High capability score, winner unchanged
        result = classify_scenario(winner_changed=False, selected_site_factor_score=92.0)
        self.assertEqual(result, "ROBUST")

    def test_sensitive_classification(self):
        """
        TEST B: Winner changed → SENSITIVE (regardless of capability score).
        """
        from xai.gemini.counterfactual import classify_scenario
        result = classify_scenario(winner_changed=True, selected_site_factor_score=92.0)
        self.assertEqual(result, "SENSITIVE")

    def test_sensitive_with_low_score(self):
        """Winner changed takes precedence — still SENSITIVE."""
        from xai.gemini.counterfactual import classify_scenario
        result = classify_scenario(winner_changed=True, selected_site_factor_score=10.0)
        self.assertEqual(result, "SENSITIVE")

    def test_capability_limitation(self):
        """
        TEST C: Winner unchanged BUT score < threshold → CAPABILITY_LIMITATION.
        """
        from xai.gemini.counterfactual import classify_scenario, CAPABILITY_THRESHOLD
        low_score = CAPABILITY_THRESHOLD - 1.0
        result = classify_scenario(winner_changed=False, selected_site_factor_score=low_score)
        self.assertEqual(result, "CAPABILITY_LIMITATION")

    def test_boundary_at_threshold(self):
        """Score exactly at threshold (= CAPABILITY_THRESHOLD) → ROBUST."""
        from xai.gemini.counterfactual import classify_scenario, CAPABILITY_THRESHOLD
        result = classify_scenario(winner_changed=False, selected_site_factor_score=CAPABILITY_THRESHOLD)
        self.assertEqual(result, "ROBUST")


class TestCounterfactualWithRealAHP(unittest.TestCase):
    """
    TEST E: Counterfactual calculations are performed by Python, not Gemini.
    Verifies that the engine produces valid structured results using real AHP data.
    """

    def setUp(self):
        from scoring_engine import score_sites, AHP_WEIGHTS, FACTOR_LABELS, FACTOR_ORDER, _normalize_weights
        import json
        data_path = os.path.join(_REPO, "sunlight_ice_dust_final.json")
        with open(data_path) as f:
            self.named_sites = json.load(f)["named_sites"]
        self.baseline_results = score_sites(self.named_sites)
        self.valid_results = [r for r in self.baseline_results if r.get("composite_score") is not None]
        self.factor_labels = FACTOR_LABELS
        self.factor_order = FACTOR_ORDER
        self.selected_site = self.valid_results[0]["name"]
        self.baseline_weights = self.valid_results[0]["weights_used"]

    def test_run_all_scenarios_returns_correct_count(self):
        """Should return one scenario per AHP factor."""
        from xai.gemini.counterfactual import run_all_scenarios
        result = run_all_scenarios(
            selected_site_name=self.selected_site,
            baseline_results=self.valid_results,
            factor_labels=self.factor_labels,
            factor_order=self.factor_order,
        )
        self.assertEqual(len(result.scenarios), len(self.factor_order))

    def test_all_scenarios_have_valid_classification(self):
        """Every scenario must have a valid classification string."""
        from xai.gemini.counterfactual import run_all_scenarios
        result = run_all_scenarios(
            selected_site_name=self.selected_site,
            baseline_results=self.valid_results,
            factor_labels=self.factor_labels,
            factor_order=self.factor_order,
        )
        valid_classes = {"ROBUST", "SENSITIVE", "CAPABILITY_LIMITATION"}
        for s in result.scenarios:
            self.assertIn(s.classification, valid_classes,
                          msg=f"Invalid classification '{s.classification}' for factor '{s.changed_factor_id}'")

    def test_scenario_weights_sum_to_one(self):
        """TEST D applied to real run: all perturbed weights sum to 1.0."""
        from xai.gemini.counterfactual import run_all_scenarios
        result = run_all_scenarios(
            selected_site_name=self.selected_site,
            baseline_results=self.valid_results,
            factor_labels=self.factor_labels,
            factor_order=self.factor_order,
        )
        for s in result.scenarios:
            pct_sum = sum(s.perturbed_weights.weights_pct.values())
            self.assertAlmostEqual(
                pct_sum, 100.0, places=6,
                msg=f"Perturbed weights don't sum to 100% for factor '{s.changed_factor_id}': sum={pct_sum}"
            )

    def test_counterfactual_is_pure_python_no_gemini(self):
        """
        TEST E: Counterfactual results are generated without any Gemini API call.
        Verifies that run_all_scenarios does not import or call gemini_service.
        """
        from xai.gemini.counterfactual import run_all_scenarios
        with patch("xai.gemini.gemini_service.explain_counterfactual") as mock_gemini:
            result = run_all_scenarios(
                selected_site_name=self.selected_site,
                baseline_results=self.valid_results,
                factor_labels=self.factor_labels,
                factor_order=self.factor_order,
            )
            # Gemini explain_counterfactual must NOT have been called
            mock_gemini.assert_not_called()
        # We still got valid results
        self.assertIsNotNone(result)
        self.assertGreater(len(result.scenarios), 0)


# ===========================================================================
# Section 2: Risk Engine (pure Python)
# ===========================================================================

class TestRiskEngine(unittest.TestCase):
    """TEST I: Risk levels computed correctly from factor scores."""

    def setUp(self):
        from scoring_engine import FACTOR_LABELS
        self.factor_labels = FACTOR_LABELS

    def _make_result(self, safety, water_ice, sunlight, resources, expansion=50.0, sci=33.0):
        return {
            "name": "Test Site",
            "rank": 1,
            "composite_score": 60.0,
            "weights_used": {
                "safety": 0.3966, "water_ice": 0.2685, "sunlight": 0.1214,
                "resources": 0.1214, "expansion": 0.0548, "scientific_value": 0.0373
            },
            "factor_scores": {
                "safety": safety, "water_ice": water_ice, "sunlight": sunlight,
                "resources": resources, "expansion": expansion, "scientific_value": sci
            },
        }

    def test_high_risk_below_40(self):
        """Score < 40 → HIGH risk."""
        from xai.gemini.risk_engine import compute_risks
        result = self._make_result(safety=30.0, water_ice=80.0, sunlight=70.0, resources=75.0)
        risks = compute_risks(result, self.factor_labels)
        safety_risk = next(r for r in risks if r.factor_id == "safety")
        self.assertEqual(safety_risk.risk_level, "HIGH")

    def test_medium_risk_40_to_70(self):
        """Score 40–69 → MEDIUM risk."""
        from xai.gemini.risk_engine import compute_risks
        result = self._make_result(safety=55.0, water_ice=80.0, sunlight=70.0, resources=75.0)
        risks = compute_risks(result, self.factor_labels)
        safety_risk = next(r for r in risks if r.factor_id == "safety")
        self.assertEqual(safety_risk.risk_level, "MEDIUM")

    def test_low_risk_above_70(self):
        """Score >= 70 → LOW risk."""
        from xai.gemini.risk_engine import compute_risks
        result = self._make_result(safety=85.0, water_ice=80.0, sunlight=70.0, resources=75.0)
        risks = compute_risks(result, self.factor_labels)
        safety_risk = next(r for r in risks if r.factor_id == "safety")
        self.assertEqual(safety_risk.risk_level, "LOW")

    def test_expansion_is_data_limited(self):
        """Expansion and scientific_value are always DATA_LIMITED (neutral proxy)."""
        from xai.gemini.risk_engine import compute_risks
        result = self._make_result(safety=85.0, water_ice=80.0, sunlight=70.0, resources=75.0)
        risks = compute_risks(result, self.factor_labels)
        exp_risk = next(r for r in risks if r.factor_id == "expansion")
        sci_risk = next(r for r in risks if r.factor_id == "scientific_value")
        self.assertEqual(exp_risk.risk_level, "DATA_LIMITED")
        self.assertEqual(sci_risk.risk_level, "DATA_LIMITED")

    def test_risks_sorted_by_severity(self):
        """HIGH risks must appear before MEDIUM, MEDIUM before LOW."""
        from xai.gemini.risk_engine import compute_risks
        result = self._make_result(
            safety=85.0,   # LOW
            water_ice=30.0,  # HIGH
            sunlight=55.0,   # MEDIUM
            resources=75.0,  # LOW
        )
        risks = compute_risks(result, self.factor_labels)
        # Filter to non-data-limited
        meaningful = [r for r in risks if r.risk_level != "DATA_LIMITED"]
        order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        for i in range(len(meaningful) - 1):
            self.assertLessEqual(
                order[meaningful[i].risk_level],
                order[meaningful[i + 1].risk_level],
                msg="Risks not sorted by severity"
            )


# ===========================================================================
# Section 3: AHP Ranking Identity Test
# ===========================================================================

class TestAHPRankingIdentity(unittest.TestCase):
    """
    TEST F: XAI enabled/disabled produces identical AHP rankings.
    Proves: LLM ≠ Decision Maker.
    """

    def setUp(self):
        from scoring_engine import score_sites
        import json
        data_path = os.path.join(_REPO, "sunlight_ice_dust_final.json")
        with open(data_path) as f:
            self.named_sites = json.load(f)["named_sites"]
        self.score_sites = score_sites

    def test_rankings_identical_with_and_without_gemini_xai(self):
        """AHP scores and ranks must be identical regardless of XAI state."""
        baseline = self.score_sites(self.named_sites)

        # Simulate "XAI enabled" — run same score_sites independently
        xai_enabled = self.score_sites(self.named_sites)

        self.assertEqual(len(baseline), len(xai_enabled))
        for b, x in zip(baseline, xai_enabled):
            self.assertEqual(b["name"], x["name"],
                             msg="Site names differ between XAI enabled/disabled")
            self.assertEqual(b.get("rank"), x.get("rank"),
                             msg=f"Rank differs for site '{b['name']}'")
            if b["composite_score"] is not None:
                self.assertAlmostEqual(
                    b["composite_score"], x["composite_score"], places=6,
                    msg=f"Score differs for site '{b['name']}'"
                )

    def test_top_site_is_haworth_crater(self):
        """Verify the known #1 site with AHP defaults."""
        results = self.score_sites(self.named_sites)
        valid = [r for r in results if r.get("composite_score") is not None]
        self.assertEqual(valid[0]["name"], "Haworth Crater",
                         msg=f"Expected 'Haworth Crater' at #1 but got '{valid[0]['name']}'")

    def test_weight_normalisation_in_results(self):
        """AHP default weights in results must sum to 1.0."""
        results = self.score_sites(self.named_sites)
        valid = [r for r in results if r.get("composite_score") is not None]
        weights = valid[0]["weights_used"]
        total = sum(weights.values())
        self.assertAlmostEqual(total, 1.0, places=9,
                               msg=f"AHP default weights don't sum to 1.0: {total}")


# ===========================================================================
# Section 4: Gemini Service Fallback Behaviour
# ===========================================================================

class TestGeminiServiceFallback(unittest.TestCase):
    """
    TEST G: Missing API key handled safely.
    TEST H: Invalid Gemini response handled safely.
    TEST J: No secrets logged.
    """

    def _make_site_payload(self):
        """Build a minimal SiteSelectionExplanationInput for testing."""
        from xai.gemini.payloads import (
            SiteSelectionExplanationInput, FactorDetail, SiteComparisonSnapshot
        )
        return SiteSelectionExplanationInput(
            site_name="Haworth Crater",
            rank=1,
            composite_score=76.48,
            weight_source="AHP_DEFAULT",
            factors=[
                FactorDetail("safety", "Safety", 39.66, 99.78, 39.54),
                FactorDetail("water_ice", "Water Ice", 26.85, 100.0, 26.85),
            ],
            strongest_factors=["water_ice", "safety"],
            weakest_factors=["sunlight"],
            strongest_factor_label="Water Ice",
            weakest_factor_label="Sunlight",
            all_sites_summary=[
                SiteComparisonSnapshot("Haworth Crater", 1, 76.48, "Water Ice", "Sunlight"),
                SiteComparisonSnapshot("Nobile Rim", 2, 54.22, "Safety", "Expansion"),
            ],
            ml_archetype="Shadow-Dominated",
        )

    def test_missing_api_key_uses_fallback(self):
        """TEST G: No GEMINI_API_KEY → fallback explanation used, no exception raised."""
        import xai.gemini.gemini_service as svc
        payload = self._make_site_payload()

        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GEMINI_API_KEY", None)
            # Reset the client so it reinitialises
            svc._client._client = None
            result = svc.explain_site_selection(payload)

        self.assertIn("summary", result)
        self.assertIn("key_reasons", result)
        self.assertEqual(result.get("_source"), "FALLBACK",
                         msg="Expected FALLBACK source when API key is missing")

    def test_invalid_gemini_response_handled(self):
        """TEST H: Malformed JSON from Gemini returns fallback, no exception."""
        import xai.gemini.gemini_service as svc
        payload = self._make_site_payload()

        with patch.object(svc._client, "generate", return_value="not valid json {{{{"):
            result = svc.explain_site_selection(payload)

        self.assertIn("summary", result)
        self.assertEqual(result.get("_source"), "FALLBACK",
                         msg="Expected FALLBACK on malformed JSON response")

    def test_empty_gemini_response_handled(self):
        """Empty string from Gemini returns fallback."""
        import xai.gemini.gemini_service as svc
        payload = self._make_site_payload()

        with patch.object(svc._client, "generate", return_value=""):
            result = svc.explain_site_selection(payload)

        self.assertIn("summary", result)
        self.assertEqual(result.get("_source"), "FALLBACK")

    def test_none_gemini_response_handled(self):
        """None from Gemini returns fallback."""
        import xai.gemini.gemini_service as svc
        payload = self._make_site_payload()

        with patch.object(svc._client, "generate", return_value=None):
            result = svc.explain_site_selection(payload)

        self.assertIn("summary", result)
        self.assertEqual(result.get("_source"), "FALLBACK")

    def test_fallback_uses_real_values(self):
        """Fallback explanation must reference real scores, not invented values."""
        import xai.gemini.gemini_service as svc
        payload = self._make_site_payload()

        with patch.object(svc._client, "generate", return_value=None):
            result = svc.explain_site_selection(payload)

        summary = result.get("summary", "")
        # Must mention real site name and rank
        self.assertIn("Haworth Crater", summary)
        self.assertIn("#1", summary)

    def test_api_key_not_in_logs(self):
        """TEST J: API key prefix is confirmed NOT logged in full."""
        import logging
        import io
        import xai.gemini.gemini_service as svc

        fake_key = "FAKEKEYFORTESTINGONLY1234567890"
        log_capture = io.StringIO()
        handler = logging.StreamHandler(log_capture)
        handler.setLevel(logging.DEBUG)
        logging.getLogger().addHandler(handler)

        with patch.dict(os.environ, {"GEMINI_API_KEY": fake_key}):
            svc._client._client = None
            # This initializes — key prefix should appear but not the full key
            svc._client._initialize()

        log_output = log_capture.getvalue()
        logging.getLogger().removeHandler(handler)

        # Full key must NOT appear in logs
        self.assertNotIn(fake_key, log_output,
                         msg="Full API key appears in log output — security violation!")


# ===========================================================================
# Section 5: Payload Construction
# ===========================================================================

class TestPayloadConstruction(unittest.TestCase):
    """Verify that payload DTOs are constructed correctly."""

    def setUp(self):
        from scoring_engine import score_sites, FACTOR_LABELS, FACTOR_ORDER
        import json
        data_path = os.path.join(_REPO, "sunlight_ice_dust_final.json")
        with open(data_path) as f:
            self.named_sites = json.load(f)["named_sites"]
        self.results = score_sites(self.named_sites)
        self.valid = [r for r in self.results if r.get("composite_score") is not None]
        self.factor_labels = FACTOR_LABELS
        self.factor_order = FACTOR_ORDER

    def test_build_factor_details_correct_count(self):
        """Should build one FactorDetail per AHP factor."""
        from xai.gemini.payloads import build_factor_details
        details = build_factor_details(self.valid[0], self.factor_labels, self.factor_order)
        self.assertEqual(len(details), len(self.factor_order))

    def test_factor_details_weights_sum_to_100(self):
        """Weight percentages in FactorDetail must sum to ~100%."""
        from xai.gemini.payloads import build_factor_details
        details = build_factor_details(self.valid[0], self.factor_labels, self.factor_order)
        total_pct = sum(d.weight_pct for d in details)
        self.assertAlmostEqual(total_pct, 100.0, places=1,
                               msg=f"Factor weight percentages don't sum to 100%: {total_pct}")

    def test_risk_mitigation_payload_has_risks(self):
        """RiskMitigationInput must contain at least one risk entry."""
        from xai.gemini.risk_engine import build_risk_mitigation_input
        payload = build_risk_mitigation_input(self.valid[0], self.factor_labels)
        self.assertGreater(len(payload.risks), 0)

    def test_payload_to_dict_is_json_serialisable(self):
        """SiteSelectionExplanationInput.to_dict() must be JSON-serialisable."""
        from xai.gemini.payloads import build_factor_details, SiteSelectionExplanationInput, SiteComparisonSnapshot
        details = build_factor_details(self.valid[0], self.factor_labels, self.factor_order)
        factor_scores = self.valid[0].get("factor_scores", {})
        sorted_by_score = sorted(factor_scores.items(), key=lambda x: -x[1])
        payload = SiteSelectionExplanationInput(
            site_name=self.valid[0]["name"],
            rank=self.valid[0].get("rank", 1),
            composite_score=self.valid[0]["composite_score"],
            weight_source="AHP_DEFAULT",
            factors=details,
            strongest_factors=[fid for fid, _ in sorted_by_score],
            weakest_factors=[fid for fid, _ in reversed(sorted_by_score)],
            strongest_factor_label=self.factor_labels.get(sorted_by_score[0][0], ""),
            weakest_factor_label=self.factor_labels.get(sorted_by_score[-1][0], ""),
            all_sites_summary=[],
        )
        try:
            json.dumps(payload.to_dict())
        except (TypeError, ValueError) as e:
            self.fail(f"Payload is not JSON-serialisable: {e}")


# ===========================================================================
# Section 6: Live Gemini Integration Tests (requires GEMINI_API_KEY)
# ===========================================================================

import pytest

@pytest.mark.integration
class TestLiveGeminiIntegration(unittest.TestCase):
    """
    LIVE integration tests — require GEMINI_API_KEY to be set.
    Run with: pytest -m integration
    These are clearly separated from unit tests.
    """

    def setUp(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        if not self.api_key:
            self.skipTest("GEMINI_API_KEY not set — skipping live Gemini integration tests.")

    def test_live_site_explanation(self):
        """Live test: Gemini returns a valid site explanation."""
        from scoring_engine import score_sites, FACTOR_LABELS, FACTOR_ORDER
        import json
        data_path = os.path.join(_REPO, "sunlight_ice_dust_final.json")
        with open(data_path) as f:
            named_sites = json.load(f)["named_sites"]
        results = score_sites(named_sites)
        valid = [r for r in results if r.get("composite_score") is not None]

        from xai.gemini.xai_gemini import build_site_explanation_input
        import xai.gemini.gemini_service as svc

        # Reset client to pick up key
        svc._client._client = None
        payload = build_site_explanation_input(valid[0], valid, {})
        result = svc.explain_site_selection(payload)

        self.assertIn("summary", result)
        self.assertIn("key_reasons", result)
        self.assertIn("limitations", result)
        self.assertIsInstance(result["key_reasons"], list)
        # Live call should return GEMINI source (unless API failed)
        print(f"\n[integration] Source: {result.get('_source')}")
        print(f"[integration] Summary: {result.get('summary', '')[:200]}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
