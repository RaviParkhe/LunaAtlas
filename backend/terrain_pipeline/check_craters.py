import pandas as pd
import numpy as np

path = "lunar_crater_database_robbins_2018.csv"

craters = pd.read_csv(path)

# Among craters very close to the pole, find the one closest to Shackleton's known diameter (19-21 km)
near_pole = craters[craters["LAT_CIRC_IMG"] < -88.5].copy()
near_pole["diam_diff"] = np.abs(near_pole["DIAM_CIRC_IMG"] - 20)  # 20 = midpoint of 19-21km range

closest_by_size = near_pole.nsmallest(5, "diam_diff")
print(closest_by_size[["CRATER_ID", "LAT_CIRC_IMG", "LON_CIRC_IMG", "DIAM_CIRC_IMG"]])