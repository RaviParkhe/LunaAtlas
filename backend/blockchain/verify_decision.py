import sys
import json
import os
from blockchain.verifier import verify_decision

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m blockchain.verify_decision <manifest_file_path>")
        sys.exit(1)
        
    manifest_path = sys.argv[1]
    verify_decision(manifest_path)
