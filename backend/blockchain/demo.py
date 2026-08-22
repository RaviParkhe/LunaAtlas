import os
import json
import time
from blockchain.manifest import generate_decision_manifest, get_artifact_paths
from blockchain.registry import DecisionRegistry
from blockchain.verifier import verify_decision

def run_demo():
    print("============================================================")
    print("TAMPER-DETECTION DEMONSTRATION")
    print("============================================================")
    
    site_name = "Haworth Crater"
    site_name_safe = site_name.replace(" ", "_").replace("/", "-")
    paths = get_artifact_paths(site_name_safe)
    
    print("\n1. Deploying Smart Contract to Local Blockchain...")
    registry = DecisionRegistry()
    contract_addr = registry.deploy()
    print(f"   Deployed to: {contract_addr}")
    
    # We must patch the environment variable so other components use the same address
    os.environ["BLOCKCHAIN_CONTRACT_ADDRESS"] = contract_addr
    # Re-initialize registry with the known address
    registry = DecisionRegistry()
    
    print(f"\n2. Generating Decision Manifest for {site_name}...")
    manifest = generate_decision_manifest(site_name)
    manifest_path = "demo_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f)
        
    print(f"\n3. Registering Decision {manifest['decision_id']}...")
    registry.register_decision(manifest)
    print("   Registered successfully.")
    
    print("\n4. Verifying Decision (Expected: PASS)...")
    res1 = verify_decision(manifest_path)
    assert res1 is True, "Initial verification failed!"
    
    print("\n5. Tampering with AHP Result file...")
    ahp_path = paths["ahp_result"]
    with open(ahp_path, "r", encoding="utf-8") as f:
        original_ahp = f.read()
        
    tampered_ahp = original_ahp.replace(site_name, "Tampered Name")
    with open(ahp_path, "w", encoding="utf-8") as f:
        f.write(tampered_ahp)
        
    print("\n6. Verifying Decision again (Expected: FAIL)...")
    res2 = verify_decision(manifest_path)
    assert res2 is False, "Tampered verification succeeded unexpectedly!"
    
    print("\n7. Restoring original AHP Result file...")
    with open(ahp_path, "w", encoding="utf-8") as f:
        f.write(original_ahp)
        
    print("\n8. Verifying Decision again (Expected: PASS)...")
    res3 = verify_decision(manifest_path)
    assert res3 is True, "Restored verification failed!"
    
    # Cleanup
    if os.path.exists(manifest_path):
        os.remove(manifest_path)
        
    print("\n============================================================")
    print("DEMO COMPLETED SUCCESSFULLY")
    print("============================================================")

if __name__ == "__main__":
    run_demo()
