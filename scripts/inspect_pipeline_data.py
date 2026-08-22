import json
import os
import numpy as np

def validate_pipeline_files():
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    file_sun = os.path.join(data_dir, "sunlight_ice_dust_final.json")
    file_terrain = os.path.join(data_dir, "final_terrain_hazard_output.json")

    print("=" * 70)
    print("      LUNAR HABITAT AI — PIPELINE DATA CONTRACT VALIDATION")
    print("=" * 70)

    expected_sites = [
        "Shackleton Crater Rim",
        "de Gerlache Rim",
        "Malapert Massif",
        "Faustini Rim",
        "Nobile Rim",
        "Haworth Crater"
    ]

    # --- 1. Validate Track B: Sunlight / Ice / Dust ---
    print(f"\n[1] Checking Sunlight / Ice Track: {os.path.basename(file_sun)}")
    if not os.path.exists(file_sun):
        print(f"ERROR: File not found at {file_sun}")
        return False

    with open(file_sun, "r", encoding="utf-8") as f:
        sun_data = json.load(f)

    if "grid_meta" not in sun_data:
        print("ERROR: Missing 'grid_meta' in sunlight file!")
        return False

    meta = sun_data["grid_meta"]
    print(f"  -> grid_meta: shape={meta.get('shape')}, bounds={meta.get('bounds')}")
    if meta.get("shape") != [400, 400]:
        print(f"ERROR: Unexpected grid shape {meta.get('shape')}, expected [400, 400]")
        return False

    sun_layers = [k for k in sun_data.keys() if k not in ("grid_meta", "named_sites")]
    print(f"  -> Score Layers present: {sun_layers}")

    sun_sites = sun_data.get("named_sites", {})
    print(f"  -> Named Sites present: {list(sun_sites.keys())}")
    for site in expected_sites:
        if site not in sun_sites:
            print(f"WARNING: Expected site '{site}' missing from sunlight data")

    # --- 2. Validate Track A: Terrain / Landing Suitability ---
    print(f"\n[2] Checking Terrain / Landing Track: {os.path.basename(file_terrain)}")
    if not os.path.exists(file_terrain):
        print(f"ERROR: File not found at {file_terrain}")
        return False

    with open(file_terrain, "r", encoding="utf-8") as f:
        terrain_data = json.load(f)

    if "grid_meta" not in terrain_data:
        print("ERROR: Missing 'grid_meta' in terrain file!")
        return False

    t_meta = terrain_data["grid_meta"]
    print(f"  -> grid_meta: shape={t_meta.get('shape')}, bounds={t_meta.get('bounds')}")
    if t_meta.get("shape") != [400, 400]:
        print(f"ERROR: Unexpected grid shape {t_meta.get('shape')}, expected [400, 400]")
        return False

    terrain_layers = [k for k in terrain_data.keys() if k not in ("grid_meta", "named_sites")]
    print(f"  -> Terrain Data Layers present: {terrain_layers}")

    terrain_sites = terrain_data.get("named_sites", {})
    print(f"  -> Named Sites present: {list(terrain_sites.keys())}")
    for site in expected_sites:
        if site not in terrain_sites:
            print(f"WARNING: Expected site '{site}' missing from terrain data")

    # --- 3. Print Sample Site Inspection ---
    print("\n" + "=" * 70)
    print(" SAMPLE SITE INSPECTION: Shackleton Crater Rim")
    print("=" * 70)
    sample_site = "Shackleton Crater Rim"
    sun_sample = sun_sites.get(sample_site, {})
    terrain_sample = terrain_sites.get(sample_site, {})

    print(f"Site: {sample_site}")
    print(f"  Coordinates: Lat={sun_sample.get('lat')}, Lon={sun_sample.get('lon')}")
    print(f"  Sunlight Score:           {sun_sample.get('sunlight_score'):.2f} / 100")
    print(f"  Ice Score (ISRU Proxy):   {sun_sample.get('ice_score'):.2f} / 100")
    print(f"  Dust Risk Score:          {sun_sample.get('dust_risk_score'):.2f} / 100")
    print(f"  Landing Suitability:      {terrain_sample.get('landing_suitability_score'):.2f} / 100")
    print(f"  Best Nearby Landing:      {terrain_sample.get('best_nearby_score'):.2f} / 100 (Offset: {terrain_sample.get('best_nearby_offset_km')} km)")
    print(f"  Is Flat Gate:             {terrain_sample.get('is_flat')}")

    # --- 4. Print Summary Across All 6 Named Candidate Sites ---
    print("\n" + "=" * 70)
    print(" ALL 6 CANDIDATE SITES ACROSS COMBINED DATA:")
    print("=" * 70)
    print(f"{'Site Name':<24} | {'Sunlight':<8} | {'Ice':<6} | {'Dust':<6} | {'Landing':<8} | {'Flat?':<5}")
    print("-" * 70)
    for name in expected_sites:
        s = sun_sites.get(name, {})
        t = terrain_sites.get(name, {})
        sun_sc = f"{s.get('sunlight_score', 0):.1f}" if 'sunlight_score' in s else "N/A"
        ice_sc = f"{s.get('ice_score', 0):.1f}" if 'ice_score' in s else "N/A"
        dst_sc = f"{s.get('dust_risk_score', 0):.1f}" if 'dust_risk_score' in s else "N/A"
        lnd_sc = f"{t.get('landing_suitability_score', 0):.1f}" if 'landing_suitability_score' in t else "N/A"
        flat_st = str(t.get('is_flat', 'N/A'))
        print(f"{name:<24} | {sun_sc:<8} | {ice_sc:<6} | {dst_sc:<6} | {lnd_sc:<8} | {flat_st:<5}")

    print("=" * 70)
    print("DATA INTEGRITY CHECK: SUCCESSFUL & LOCKED!")
    return True

if __name__ == "__main__":
    validate_pipeline_files()
