import subprocess
import os
import json

repo_dir = os.path.join(os.path.dirname(__file__), "..", "pipeline_upstream")

branches = [
    "origin/main",
    "origin/terrain-track",
    "origin/lunar_habitat_sunlight_track",
    "origin/frontend-development"
]

report = {}

for branch in branches:
    res = subprocess.run(
        ["git", "--git-dir", os.path.join(repo_dir, ".git"), "ls-tree", "-r", "-l", branch],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    files = []
    for line in res.stdout.strip().split("\n"):
        if not line:
            continue
        # Format: <mode> <type> <object> <size>    <file>
        parts = line.split(maxsplit=4)
        if len(parts) >= 5:
            mode, obj_type, obj_hash, size, filename = parts
            files.append({
                "name": filename,
                "size_bytes": int(size.strip()) if size.strip().isdigit() else 0,
                "type": obj_type
            })
    
    # get commit log
    log_res = subprocess.run(
        ["git", "--git-dir", os.path.join(repo_dir, ".git"), "log", "-n", "3", "--oneline", branch],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    report[branch] = {
        "recent_commits": log_res.stdout.strip().split("\n"),
        "file_count": len(files),
        "files": sorted(files, key=lambda x: x["name"])
    }

print(json.dumps(report, indent=2))
