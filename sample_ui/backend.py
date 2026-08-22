import os
import sys
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to path so we can import from xai
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from xai.gemini.payloads import (
    SiteSelectionExplanationInput, 
    FactorDetail, 
    SiteComparisonSnapshot,
    RiskMitigationInput,
    FactorRisk,
    MissionContext,
    CounterfactualExplanationInput,
    CounterfactualResult,
    WeightSnapshot
)
from xai.gemini.gemini_service import (
    explain_site_selection,
    explain_risk_mitigation,
    explain_counterfactual
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    site_name: str
    team_size: str
    mission_spec: str

@app.post("/api/xai/full-report")
def get_full_report(body: RequestBody):
    # ---------------------------------------------------------
    # 1. Site Selection Payload
    # ---------------------------------------------------------
    factors = [
        FactorDetail("illumination", "Illumination Duration", 35.0, 92.0, 32.2),
        FactorDetail("comm", "Earth Comm Line-of-Sight", 25.0, 88.5, 22.12),
        FactorDetail("ice", "Distance to PSR (Ice)", 20.0, 78.0, 15.6),
        FactorDetail("slope", "Terrain Slope", 10.0, 60.5, 6.05),
        FactorDetail("dust", "Dust Hazard", 10.0, 75.0, 7.5),
    ]
    
    comparisons = [
        SiteComparisonSnapshot("Shackleton Crater", 2, 82.1, "illumination", "ice"),
        SiteComparisonSnapshot("Cabeus Crater", 3, 79.4, "ice", "comm")
    ]

    site_payload = SiteSelectionExplanationInput(
        site_name=body.site_name,
        rank=1,
        composite_score=85.5,
        weight_source="AHP_DEFAULT",
        factors=factors,
        strongest_factors=["illumination", "comm"],
        weakest_factors=["slope", "dust"],
        strongest_factor_label="Illumination Duration",
        weakest_factor_label="Terrain Slope",
        all_sites_summary=comparisons,
        ml_archetype="Peak of Eternal Light (PoEL)"
    )

    # ---------------------------------------------------------
    # 2. Risk Mitigation Payload
    # ---------------------------------------------------------
    # Incorporate user choices (team size & mission spec) into mission context
    top_priority = body.mission_spec.replace("-", " ").title()
    mission_context = MissionContext(
        weight_source=f"USER_SELECTION ({body.team_size} Team)",
        top_priority=top_priority,
        second_priority="Safety & Redundancy",
        weights_pct={"Illumination Duration": 35.0, "Safety": 25.0}
    )

    risks = [
        FactorRisk("dust", "Dust Hazard", "HIGH" if body.team_size == "Large" else "MEDIUM", 75.0, "Dust mitigation scales with team size"),
        FactorRisk("slope", "Terrain Slope", "MEDIUM", 60.5, "Steep terrain poses localized risk"),
    ]

    risk_payload = RiskMitigationInput(
        site_name=body.site_name,
        rank=1,
        composite_score=85.5,
        risks=risks,
        mission=mission_context,
        meaningful_risk_count=len([r for r in risks if r.risk_level in ["HIGH", "MEDIUM"]])
    )

    # ---------------------------------------------------------
    # 3. Counterfactual Payload
    # ---------------------------------------------------------
    scenarios = [
        CounterfactualResult(
            changed_factor_id="comm",
            changed_factor_label="Earth Comm Line-of-Sight",
            baseline_weight_pct=25.0,
            perturbed_weight_pct=40.0,
            delta_pct=15.0,
            baseline_winner=body.site_name,
            scenario_winner="Shackleton Crater",
            winner_changed=True,
            selected_site_factor_score=88.5,
            runner_up_name="Shackleton Crater",
            runner_up_score=89.0,
            classification="SENSITIVE",
            baseline_weights=WeightSnapshot({"Earth Comm Line-of-Sight": 25.0}),
            perturbed_weights=WeightSnapshot({"Earth Comm Line-of-Sight": 40.0})
        )
    ]

    counter_payload = CounterfactualExplanationInput(
        site_name=body.site_name,
        baseline_rank=1,
        baseline_score=85.5,
        baseline_weights=WeightSnapshot({"Illumination": 35.0}),
        scenarios=scenarios,
        robust_factors=["Illumination Duration", "Distance to PSR (Ice)"],
        sensitive_factors=["Earth Comm Line-of-Sight"],
        limited_factors=["Terrain Slope"]
    )

    # ---------------------------------------------------------
    # Generate all three explanations
    # ---------------------------------------------------------
    return {
        "site_selection": explain_site_selection(site_payload),
        "risk_mitigation": explain_risk_mitigation(risk_payload),
        "counterfactual": explain_counterfactual(counter_payload)
    }

# Mount the static UI
static_dir = os.path.join(os.path.dirname(__file__))
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
