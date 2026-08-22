import os
import json
from blockchain.manifest import get_artifact_paths, hash_all_artifacts
from blockchain.registry import DecisionRegistry

def verify_decision(manifest_path: str):
    print("============================================================")
    print("BLOCKCHAIN DECISION VERIFICATION")
    print("============================================================")
    
    if not os.path.exists(manifest_path):
        print(f"Manifest not found: {manifest_path}")
        return False
        
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    decision_id = manifest["decision_id"]
    site_id = manifest["site"]["site_id"]
    
    print(f"\nDecision ID:\n{decision_id}")
    print(f"\nSite:\n{site_id}")
    
    try:
        registry = DecisionRegistry()
        print("\nBlockchain:\nCONNECTED")
    except Exception as e:
        print(f"\nBlockchain:\nUNAVAILABLE ({e})")
        return False
        
    print("\n------------------------------------------------------------\n")
    
    # Recompute local hashes
    site_name_safe = site_id.replace(" ", "_").replace("/", "-")
    paths = get_artifact_paths(site_name_safe)
    local_hashes = hash_all_artifacts(paths)
    
    # Get on-chain record
    onchain = registry.get_decision(decision_id)
    if not onchain:
        print("FINAL STATUS:\n[FAIL] DECISION NOT FOUND ON BLOCKCHAIN")
        return False
        
    # onchain is a tuple corresponding to the struct fields
    # (datasetHash, featureConfigHash, preprocessingHash, modelHash, clusterHash, ahpConfigHash, 
    #  ahpResultHash, mlXaiHash, ahpXaiHash, geminiHash, counterfactualHash, reportHash, 
    #  timestamp, siteId, pipelineVersion)
    
    keys = [
        ("Dataset", "datasetHash"),
        ("Feature Configuration", "featureConfigHash"),
        ("Preprocessing", "preprocessingHash"),
        ("ML Model", "modelHash"),
        ("Cluster Assignment", "clusterHash"),
        ("AHP Configuration", "ahpConfigHash"),
        ("AHP Result", "ahpResultHash"),
        ("ML-XAI", "mlXaiHash"),
        ("AHP-XAI", "ahpXaiHash"),
        ("Gemini Explanation", "geminiHash"),
        ("Counterfactual", "counterfactualHash"),
        ("Final Report", "reportHash")
    ]
    
    all_match = True
    
    for i, (label, key) in enumerate(keys):
        local_hash = local_hashes[key]
        onchain_hash = "0x" + onchain[i].hex()
        
        if local_hash == onchain_hash:
            print(f"{label:<25} [PASS] VERIFIED")
        else:
            print(f"{label:<25} [FAIL] HASH MISMATCH")
            print(f"  Expected (Blockchain): {onchain_hash}")
            print(f"  Actual (Local)       : {local_hash}")
            all_match = False
            
    print("\n------------------------------------------------------------\n")
    
    if all_match:
        print("FINAL STATUS:\n[PASS] DECISION VERIFIED")
        print(f"\nTimestamp:\n{onchain[12]}")
    else:
        print("FINAL STATUS:\n[FAIL] DECISION MODIFIED")
        
    return all_match
