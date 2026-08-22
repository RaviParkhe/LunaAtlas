import rasterio
import matplotlib.pyplot as plt
import numpy as np

path = "LDEM_80S_80MPP_ADJ.tiff"

with rasterio.open(path) as src:
    elevation = src.read(1)  # read the first (only) band as a 2D array of numbers

# Some pixels near the edges/gaps might be a "nodata" placeholder value — mask those out so they don't mess up the color scale
nodata = src.nodata
if nodata is not None:
    elevation = np.where(elevation == nodata, np.nan, elevation)

plt.figure(figsize=(8, 8))
plt.imshow(elevation, cmap="gray")
plt.colorbar(label="Elevation (meters)")
plt.title("LOLA South Pole DEM (80S, 80m/pixel)")
plt.show()