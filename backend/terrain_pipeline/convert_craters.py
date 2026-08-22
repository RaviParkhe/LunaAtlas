import pandas as pd
import numpy as np
from pyproj import Transformer

path = "lunar_crater_database_robbins_2018.csv"
craters = pd.read_csv(path)

# Set up the conversion: Moon lat/lon (sphere, radius 1737400m) -> South Polar Stereographic
# This matches the same projection your elevation GeoTIFF uses
transformer = Transformer.from_crs(
    "+proj=longlat +R=1737400 +no_defs",
    "+proj=stere +lat_0=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +R=1737400 +units=m +no_defs",
    always_xy=True
)

# Longitude in this dataset runs 0-360; wrap to -180..180 first for safety
lon_wrapped = np.where(craters["LON_CIRC_IMG"] > 180,
                        craters["LON_CIRC_IMG"] - 360,
                        craters["LON_CIRC_IMG"])

x, y = transformer.transform(lon_wrapped, craters["LAT_CIRC_IMG"].values)
craters["x"] = x
craters["y"] = y

# Sanity check: Shackleton should now land near (0, 0) since it's almost exactly at the pole
shackleton = craters[craters["CRATER_ID"] == "10-1-090536"]
print("Shackleton x,y (should be small, close to 0,0):")
print(shackleton[["CRATER_ID", "x", "y"]])

# Now filter to just your 400x400km box (-200000 to 200000 in both x and y)
half_size = 200_000
in_box = craters[
    (craters["x"] >= -half_size) & (craters["x"] <= half_size) &
    (craters["y"] >= -half_size) & (craters["y"] <= half_size)
]

print(f"\nCraters in your 400x400km box: {len(in_box)} (out of {len(craters)} total)")

in_box.to_csv(r"D:\lunar-terrain-track\craters_in_box.csv", index=False)
print("Saved craters_in_box.csv")