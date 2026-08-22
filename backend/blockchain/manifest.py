import os
import json
import uuid
import time
from datetime import datetime
from blockchain.hashing import hash_artifact_json, sha256_file, sha256_text_file

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
ML_OUT = os.path.join(_REPO, "ml", "outputs")
XAI_OUT = os.path.join(_REPO, "xai", "outputs")
GEMINI_OUT = os.path.join(_REPO, "xai", "gemini", "outputs")

def get_artifact_paths(site_name_safe: str):
    """Returns a dictionary of artifact file paths needed for the manifest."""
    return {
        "dataset": os.path.join(_REPO, "sunlight_ice_dust_final.json"),
        "feature_config": os.path.join(ML_OUT, "feature_selection_report.json"),
        "preprocessing": os.path.join(ML_OUT, "preprocessing_meta.json"),
        "ml_model": os.path.join(ML_OUT, "kmeans_model.joblib"),
        "cluster_assignment": os.path.join(ML_OUT, "named_site_archetypes.json"),
        "ahp_config": os.path.join(_REPO, "ahp_config.json"),
        "ahp_result": os.path.join(XAI_OUT, "score_breakdown.json"),
        "ml_xai": os.path.join(XAI_OUT, "cluster_delta_report.json"),
        "ahp_xai": os.path.join(XAI_OUT, "rank_sensitivity.json"),
        "gemini_explanation": os.path.join(GEMINI_OUT, f"site_explanation_{site_name_safe}.json"),
        "counterfactual": os.path.join(GEMINI_OUT, f"counterfactual_{site_name_safe}.json"),
        "report": os.path.join(XAI_OUT, "xai_report.html")
    }

def hash_all_artifacts(paths: dict) -> dict:
    """Computes SHA-256 hashes for all paths."""
    return {
        "datasetHash": hash_artifact_json(paths["dataset"]),
        "featureConfigHash": hash_artifact_json(paths["feature_config"]),
        "preprocessingHash": hash_artifact_json(paths["preprocessing"]),
        "modelHash": sha256_file(paths["ml_model"]),
        "clusterHash": hash_artifact_json(paths["cluster_assignment"]),
        "ahpConfigHash": hash_artifact_json(paths["ahp_config"]),
        "ahpResultHash": hash_artifact_json(paths["ahp_result"]),
        "mlXaiHash": hash_artifact_json(paths["ml_xai"]),
        "ahpXaiHash": hash_artifact_json(paths["ahp_xai"]),
        "geminiHash": hash_artifact_json(paths["gemini_explanation"]),
        "counterfactualHash": hash_artifact_json(paths["counterfactual"]),
        "reportHash": sha256_text_file(paths["report"])
    }

def generate_decision_manifest(site_name: str) -> dict:
    """Builds the comprehensive JSON manifest for a site decision."""
    site_name_safe = site_name.replace(" ", "_").replace("/", "-")
    paths = get_artifact_paths(site_name_safe)
    hashes = hash_all_artifacts(paths)
    
    # Extract some metadata for human readability
    # 1. AHP Result
    ahp_data = {}
    if os.path.exists(paths["ahp_result"]):
        with open(paths["ahp_result"], "r", encoding="utf-8") as f:
            ahp_data = json.load(f)
            
    site_rank = 0
    site_score = 0.0
    for r in ahp_data.get("overall_ranking", []):
        if r["name"] == site_name:
            site_rank = r["rank"]
            site_score = r["composite_score"]
            break
            
    weights = ahp_data.get("factor_weights", {})

    # 2. ML Archetype
    ml_data = {}
    if os.path.exists(paths["cluster_assignment"]):
        with open(paths["cluster_assignment"], "r", encoding="utf-8") as f:
            ml_data = json.load(f)
    
    site_ml = ml_data.get(site_name, {})
    cluster_id = site_ml.get("cluster_id", -1)
    archetype = site_ml.get("archetype_label", "Unknown")

    decision_id = f"DEC-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"

    manifest = {
        "decision_id": decision_id,
        "site": {
            "site_id": site_name,
            "rank": site_rank,
            "ahp_score": site_score
        },
        "ml": {
            "model": "KMeans",
            "model_version": "1.0",
            "cluster_id": cluster_id,
            "archetype": archetype
        },
        "ahp": {
            "version": "1.0",
            "weights": weights
        },
        "artifacts": hashes,
        "pipeline": {
            "version": "1.0",
            "timestamp_utc": datetime.utcnow().isoformat()
        }
    }
    return manifest
