import pandas as pd
import numpy as np
import json

craters = pd.read_csv(r"D:\lunar-terrain-track\craters_in_box.csv")

with open(r"D:\lunar-terrain-track\elevation_grid.json", encoding="utf-8") as f:
    data = json.load(f)

grid_size = 400
pixel_size = 1000.0  # meters
half_size = 200_000

hazard_grid = np.zeros((grid_size, grid_size))

for _, crater in craters.iterrows():
    # Convert this crater's x,y position into row,col grid indices
    col = int((crater["x"] + half_size) / pixel_size)
    row = int((half_size - crater["y"]) / pixel_size)  # y flips: north(+) is row 0

    # Skip if somehow just outside due to rounding at the edge
    if not (0 <= row < grid_size and 0 <= col < grid_size):
        continue

    # Hazard contribution: bigger craters = more hazard. Simple for now: just diameter.
    hazard_grid[row, col] += crater["DIAM_CIRC_IMG"]

print("Hazard grid - min:", hazard_grid.min(), "max:", hazard_grid.max(), "mean:", hazard_grid.mean())
print("Cells with zero craters:", np.sum(hazard_grid == 0), "out of", grid_size * grid_size)

data["crater_hazard_raw"] = hazard_grid.tolist()

with open(r"D:\lunar-terrain-track\elevation_grid.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

print("Saved crater_hazard_raw into elevation_grid.json")