import sys
import os

# Ensure project root is in python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_endpoints():
    print("=" * 60)
    print("         RUNNING FASTAPI ENDPOINT TESTS")
    print("=" * 60)

    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("[1] GET /api/health: PASS ->", res.json()["system"])

    # 2. Profiles
    res = client.get("/api/profiles")
    assert res.status_code == 200, res.text
    presets = list(res.json()["presets"].keys())
    print("[2] GET /api/profiles: PASS -> Profiles found:", presets)

    # 3. Evaluate (Balanced)
    res = client.post("/api/evaluate", json={"profile": "balanced"})
    assert res.status_code == 200, res.text
    data = res.json()
    print(f"[3] POST /api/evaluate (Balanced): PASS -> #1 Site: {data['ranked_named_sites'][0]['name']} (Score: {data['ranked_named_sites'][0]['overall_score']})")

    # 4. Evaluate (Solar Priority)
    res = client.post("/api/evaluate", json={"profile": "power_first"})
    assert res.status_code == 200, res.text
    data = res.json()
    print(f"[4] POST /api/evaluate (Solar Priority): PASS -> #1 Site: {data['ranked_named_sites'][0]['name']} (Score: {data['ranked_named_sites'][0]['overall_score']})")

    # 5. Site Details
    res = client.get("/api/sites/Shackleton Crater Rim")
    assert res.status_code == 200, res.text
    site = res.json()["site"]
    print(f"[5] GET /api/sites/Shackleton: PASS -> Lat={site['lat']}, Lon={site['lon']}, Elev={site['elevation_m']}m")

    # 6. Layers
    res = client.get("/api/layers")
    assert res.status_code == 200, res.text
    print(f"[6] GET /api/layers: PASS -> {len(res.json()['layers'])} spatial layers available")

    # 7. Grid Heatmap
    res = client.post("/api/grid/heatmap", json={"layer": "overall_score", "downsample_factor": 2})
    assert res.status_code == 200, res.text
    hm = res.json()
    print(f"[7] POST /api/grid/heatmap: PASS -> Shape={hm['shape']}, Min={hm['min']}, Max={hm['max']}")

    # 8. Live NOAA Solar Monitor
    res = client.get("/api/monitor/solar")
    assert res.status_code == 200, res.text
    sol = res.json()
    print(f"[8] GET /api/monitor/solar: PASS -> Threat={sol['threat_level']}, Status={sol['status']}")

    print("=" * 60)
    print("ALL API ENDPOINTS TESTED SUCCESSFULLY & VERIFIED!")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
