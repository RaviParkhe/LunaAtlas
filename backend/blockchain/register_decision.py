import sys
import json
import os
from blockchain.registry import DecisionRegistry

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m blockchain.register_decision <manifest_file_path>")
        sys.exit(1)
        
    manifest_path = sys.argv[1]
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    try:
        registry = DecisionRegistry()
        print("Connected to blockchain.")
        print(f"Registering decision {manifest['decision_id']}...")
        receipt = registry.register_decision(manifest)
        print(f"Decision registered successfully in block {receipt.blockNumber}!")
        print(f"Transaction hash: {receipt.transactionHash.hex()}")
    except Exception as e:
        print(f"Failed to register decision: {e}")
