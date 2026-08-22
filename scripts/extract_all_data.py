import subprocess
import os
import shutil

repo_dir = os.path.join(os.path.dirname(__file__), "..", "pipeline_upstream")
data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(data_dir, exist_ok=True)

# Files from terrain-track
terrain_files = [
    "craters_in_box.csv",
    "elevation_grid.json",
    "final_terrain_hazard_output.json"
]

for filename in terrain_files:
    target_path = os.path.join(data_dir, filename)
    res = subprocess.run(
        ["git", "--git-dir", os.path.join(repo_dir, ".git"), "show", f"origin/terrain-track:{filename}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    if res.returncode == 0:
        with open(target_path, "wb") as f:
            f.write(res.stdout)
        print(f"Extracted {filename} ({len(res.stdout)} bytes) from terrain-track")
    else:
        print(f"Failed to extract {filename}: {res.stderr.decode('utf-8', errors='ignore')}")

# Files from main / sunlight track
sunlight_files = [
    "sunlight_ice_dust_final.json",
    "sunlight_score_400x400.npy",
    "ice_score_400x400.npy",
    "dust_risk_score_400x400.npy",
    "illumination_400x400.npy",
    "grid_meta.json",
    "sunlight_score_preview.png",
    "ice_score_preview.png",
    "dust_risk_preview.png",
    "illumination_preview.png"
]

for filename in sunlight_files:
    target_path = os.path.join(data_dir, filename)
    res = subprocess.run(
        ["git", "--git-dir", os.path.join(repo_dir, ".git"), "show", f"origin/main:{filename}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    if res.returncode == 0:
        with open(target_path, "wb") as f:
            f.write(res.stdout)
        print(f"Extracted {filename} ({len(res.stdout)} bytes) from main/sunlight-track")
    else:
        print(f"Failed to extract {filename}: {res.stderr.decode('utf-8', errors='ignore')}")

print("\nData extraction complete!")
