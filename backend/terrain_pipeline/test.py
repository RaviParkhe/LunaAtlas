import json
with open("elevation_grid.json", encoding="utf-8") as f:
    data = json.load(f)
print(json.dumps(data["grid_meta"], indent=2))