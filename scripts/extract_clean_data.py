import subprocess
import os

repo_dir = os.path.join(os.path.dirname(__file__), "..", "pipeline_upstream")
out_file = os.path.join(os.path.dirname(__file__), "..", "data", "final_terrain_hazard_output.json")

# Extract directly using git show binary stream
res = subprocess.run(
    ["git", "--git-dir", os.path.join(repo_dir, ".git"), "show", "origin/terrain-track:final_terrain_hazard_output.json"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

if res.returncode == 0:
    with open(out_file, "wb") as f:
        f.write(res.stdout)
    print(f"Extracted clean binary {len(res.stdout)} bytes to {out_file}")
else:
    print("Error extracting:", res.stderr)
