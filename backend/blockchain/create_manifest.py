import sys
import json
import os
from blockchain.manifest import generate_decision_manifest

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m blockchain.create_manifest <Site Name>")
        sys.exit(1)
        
    site_name = sys.argv[1]
    manifest = generate_decision_manifest(site_name)
    
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "outputs", "blockchain")
    os.makedirs(out_dir, exist_ok=True)
    
    site_name_safe = site_name.replace(" ", "_").replace("/", "-")
    out_file = os.path.join(out_dir, f"decision_manifest_{site_name_safe}.json")
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4)
        
    print(f"Manifest created at: {out_file}")
