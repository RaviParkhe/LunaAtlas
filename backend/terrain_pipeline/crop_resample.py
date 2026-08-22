import rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from rasterio.transform import from_origin
import numpy as np

path = "LDEM_80S_80MPP_ADJ.tiff"

half_size = 200_000
grid_size = 400
pixel_size = (2 * half_size) / grid_size  # 400,000 / 400 = 1000.0 meters — should print exactly 1000.0

with rasterio.open(path) as src:
    window = from_bounds(-half_size, -half_size, half_size, half_size, transform=src.transform)

    elevation_400 = src.read(
        1,
        window=window,
        out_shape=(grid_size, grid_size),
        resampling=Resampling.average
    )

    # Build the CORRECT transform by hand: top-left corner + real pixel size
    new_transform = from_origin(-half_size, half_size, pixel_size, pixel_size)

print("New shape:", elevation_400.shape)
print("Pixel size (should be 1000.0):", pixel_size)
print("Min elevation:", np.nanmin(elevation_400))
print("Max elevation:", np.nanmax(elevation_400))
print("New transform:")
print(new_transform)


import matplotlib.pyplot as plt

plt.figure(figsize=(6, 6))
plt.imshow(elevation_400, cmap="gray", extent=[-half_size/1000, half_size/1000, -half_size/1000, half_size/1000])
plt.xlabel("X (km)")
plt.ylabel("Y (km)")
plt.title("Cropped 400x400 km South Pole DEM (1 km/pixel)")
plt.colorbar(label="Elevation (m)")
plt.show()

import json

grid_meta = {
    "shape": [400, 400],
    "bounds": {
        "left": -200000.0,
        "bottom": -200000.0,
        "right": 200000.0,
        "top": 200000.0
    },
    "projection": "Moon (2015) South Polar Stereographic, EPSG-style IAU:30135, centered at lunar south pole (0,0)"
}

output = {
    "grid_meta": grid_meta,
    "elevation_m": elevation_400.tolist()  # convert numpy array to plain list so it can go into JSON
}

with open(r"D:\lunar-terrain-track\elevation_grid.json", "w", encoding="utf-8") as f:
    json.dump(output, f)

print("Saved elevation_grid.json")