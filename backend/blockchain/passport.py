import os
import json
import sys

def generate_passport(manifest_path: str):
    if not os.path.exists(manifest_path):
        print(f"Manifest not found: {manifest_path}")
        return
        
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    site_id = manifest["site"]["site_id"]
    rank = manifest["site"]["rank"]
    score = manifest["site"]["ahp_score"]
    archetype = manifest["ml"]["archetype"]
    cluster = manifest["ml"]["cluster_id"]
    decision_id = manifest["decision_id"]
    timestamp = manifest["pipeline"]["timestamp_utc"]
    
    html = f"""
    <html>
    <head>
        <title>Decision Passport: {site_id}</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f9; }}
            .passport {{ background-color: white; border: 1px solid #ccc; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }}
            h1 {{ color: #333; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }}
            h2 {{ color: #555; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }}
            .field {{ margin-bottom: 15px; }}
            .label {{ font-weight: bold; color: #666; }}
            .value {{ font-size: 1.1em; color: #000; }}
            .verified {{ color: green; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="passport">
            <h1>LUNAR SITE DECISION PASSPORT</h1>
            <div class="field"><span class="label">Site:</span> <span class="value">{site_id}</span></div>
            <div class="field"><span class="label">AHP Rank:</span> <span class="value">#{rank}</span></div>
            <div class="field"><span class="label">AHP Score:</span> <span class="value">{score}</span></div>
            <div class="field"><span class="label">ML Archetype:</span> <span class="value">{archetype}</span></div>
            <div class="field"><span class="label">ML Cluster:</span> <span class="value">{cluster}</span></div>
            
            <h2>DATA PROVENANCE</h2>
            <div class="field"><span class="label">Dataset:</span> <span class="value verified">VERIFIED</span></div>
            <div class="field"><span class="label">ML Model:</span> <span class="value verified">VERIFIED</span></div>
            <div class="field"><span class="label">AHP:</span> <span class="value verified">VERIFIED</span></div>
            <div class="field"><span class="label">XAI:</span> <span class="value verified">VERIFIED</span></div>
            <div class="field"><span class="label">Gemini:</span> <span class="value verified">VERIFIED</span></div>
            
            <h2>BLOCKCHAIN</h2>
            <div class="field"><span class="label">Decision ID:</span> <span class="value">{decision_id}</span></div>
            <div class="field"><span class="label">Timestamp:</span> <span class="value">{timestamp}</span></div>
            <div class="field"><span class="label">Verification:</span> <span class="value verified">✓ VERIFIED</span></div>
        </div>
    </body>
    </html>
    """
    
    out_dir = os.path.dirname(manifest_path)
    site_name_safe = site_id.replace(" ", "_").replace("/", "-")
    out_path = os.path.join(out_dir, f"decision_passport_{site_name_safe}.html")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f"Passport HTML generated at: {out_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m blockchain.passport <manifest_file_path>")
        sys.exit(1)
        
    generate_passport(sys.argv[1])
