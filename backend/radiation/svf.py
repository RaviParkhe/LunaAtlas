"""
svf.py — Sky View Factor computation from a lunar DEM elevation grid.

Sky View Factor (SVF) measures the fraction of the visible sky hemisphere
that is not blocked by surrounding terrain. For a flat open surface, SVF = 1.
For enclosed terrain (crater interior), SVF < 1.

Method:
  For each grid cell, scan N_AZIMUTHS evenly-spaced azimuth directions.
  In each direction, compute the maximum horizon elevation angle over a
  search radius (default 5 km). Then:

      SVF = mean_over_azimuths( cos(horizon_angle)^2 )

  This is the standard hemispherical-integral form of SVF for a tilted plane
  (here assumed horizontal), consistent with sky radiation geometry.

  Result is clipped to [0, 1].

Reference for SVF formula:
  Watson, I.D. & Johnson, G.T. (1987). Graphical estimation of sky view-factors
  in urban environments. Journal of Climatology, 7(2), 193-197.
  Also: Dozier & Frew (1990). Rapid calculation of terrain parameters for
  radiation modeling from digital elevation data. IEEE TGRS, 28(5), 963-969.

IMPORTANT ASSUMPTIONS:
  - DEM cell spacing is approximately 1000 m (1 km).
  - SVF is computed purely from terrain geometry; no atmospheric effects.
  - This is a 1 km resolution screening estimate.
  - Sub-kilometre crater walls and small terrain features are NOT resolved.
"""

import numpy as np


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
N_AZIMUTHS = 16            # Number of azimuth directions (evenly spaced)
SEARCH_RADIUS_KM = 5.0     # Horizon search radius in km
CELL_SIZE_M = 1000.0       # DEM cell spacing in metres (~1 km per cell)


def compute_svf(
    elevation_m: np.ndarray,
    cell_size_m: float = CELL_SIZE_M,
    search_radius_km: float = SEARCH_RADIUS_KM,
    n_azimuths: int = N_AZIMUTHS,
) -> np.ndarray:
    """
    Compute Sky View Factor for every cell in a 2-D elevation grid.

    Parameters
    ----------
    elevation_m : np.ndarray, shape (rows, cols)
        Terrain elevation in metres. Must not contain NaN.
    cell_size_m : float
        Grid cell size in metres.
    search_radius_km : float
        Maximum look-ahead distance for horizon computation in km.
    n_azimuths : int
        Number of azimuth directions to sample (16 recommended).

    Returns
    -------
    svf : np.ndarray, shape (rows, cols), dtype float32
        Sky View Factor, values in [0, 1].
        1.0 = full open sky; 0.0 = fully enclosed (theoretical minimum).
    """
    rows, cols = elevation_m.shape
    max_cells = int(np.ceil(search_radius_km * 1000.0 / cell_size_m))

    # Azimuth angles (radians), evenly spaced around 360 degrees
    azimuths = np.linspace(0, 2 * np.pi, n_azimuths, endpoint=False)
    # Direction cosines (dx, dy) for each azimuth
    # Convention: azimuth 0 = +col direction (East), 90 = +row direction (South)
    dx = np.sin(azimuths)   # column offset direction
    dy = np.cos(azimuths)   # row offset direction (positive = southward)

    # Accumulator for sum of cos^2(horizon_angle) over azimuths
    cos2_sum = np.zeros((rows, cols), dtype=np.float64)

    # Pre-compute distances for each step (1 to max_cells) in each direction
    step_distances_m = np.arange(1, max_cells + 1) * cell_size_m

    for az_idx in range(n_azimuths):
        ddx = dx[az_idx]
        ddy = dy[az_idx]

        # For each azimuth, find the maximum horizon elevation angle
        # at each grid cell by scanning along the ray
        max_tan_horizon = np.full((rows, cols), -np.inf, dtype=np.float64)

        for step in range(1, max_cells + 1):
            # Fractional pixel offset
            frac_col = ddx * step
            frac_row = ddy * step
            # Integer sample indices (nearest-neighbour)
            sample_col = np.round(
                np.arange(cols)[np.newaxis, :] + frac_col
            ).astype(int)
            sample_row = np.round(
                np.arange(rows)[:, np.newaxis] + frac_row
            ).astype(int)

            # Mask: only include samples inside the grid
            valid = (
                (sample_col >= 0) & (sample_col < cols) &
                (sample_row >= 0) & (sample_row < rows)
            )

            # Horizontal distance to this sample cell
            horiz_dist_m = np.sqrt(frac_col**2 + frac_row**2) * cell_size_m

            # Elevation difference
            # Clamp out-of-bound indices to 0 for safe indexing (mask applied)
            sc = np.clip(sample_col, 0, cols - 1)
            sr = np.clip(sample_row, 0, rows - 1)

            dz = elevation_m[sr, sc] - elevation_m

            # Tangent of elevation angle
            tan_angle = dz / horiz_dist_m   # same as tan(elev_angle)

            # Update maximum horizon tangent where valid
            tan_angle = np.where(valid, tan_angle, -np.inf)
            max_tan_horizon = np.maximum(max_tan_horizon, tan_angle)

        # Horizon elevation angle in radians
        # tan_angle can be negative (terrain below), which gives negative angle
        horizon_angle = np.arctan(np.maximum(max_tan_horizon, 0.0))
        # Clip to [0, pi/2]
        horizon_angle = np.clip(horizon_angle, 0.0, np.pi / 2)

        # SVF contribution from this azimuth: cos^2(horizon_angle)
        cos2_sum += np.cos(horizon_angle) ** 2

    # Average over all azimuths
    svf = cos2_sum / n_azimuths

    # Clip to valid range [0, 1] (should already be, but safety clip)
    svf = np.clip(svf, 0.0, 1.0).astype(np.float32)
    return svf


def validate_svf_synthetic():
    """
    Validate SVF computation on synthetic terrain.

    Tests:
      1. Flat terrain: SVF should be very close to 1.0 everywhere.
      2. Enclosed terrain (deep box): SVF should be substantially below 1.0
         at interior cells.

    Returns
    -------
    dict with validation results and pass/fail status.
    """
    results = {}

    # Test 1: Flat terrain — all elevations identical
    flat = np.zeros((50, 50), dtype=np.float64)
    svf_flat = compute_svf(flat, cell_size_m=1000.0, search_radius_km=5.0)
    mean_flat = float(np.mean(svf_flat))
    min_flat = float(np.min(svf_flat))
    # Expected: SVF ≈ 1.0 everywhere (all horizon angles = 0 for flat terrain)
    flat_ok = (mean_flat > 0.99) and (min_flat > 0.97)
    results["flat_terrain"] = {
        "mean_svf": mean_flat,
        "min_svf": min_flat,
        "pass": flat_ok,
        "expected": "SVF ≈ 1.0 everywhere (no horizon obstruction)"
    }

    # Test 2: Enclosed terrain — a very deep 'pit'
    # Grid: 50x50, central 4x4 cells depressed by 2000 m.
    # The surrounding terrain (at 0 m) rises sharply above the pit floor.
    # From the pit center, the nearest rim is 1 cell away (1 km):
    #   horizon_angle = atan(2000m / 1000m) = atan(2) ≈ 63.4 degrees
    #   cos^2(63.4 deg) ≈ 0.20
    # So SVF for the deep-pit interior should be substantially < 1.
    pit = np.zeros((50, 50), dtype=np.float64)
    pit[23:27, 23:27] = -2000.0   # 2000 m deep pit in center
    svf_pit = compute_svf(pit, cell_size_m=1000.0, search_radius_km=5.0)
    interior_svf = float(np.mean(svf_pit[23:27, 23:27]))
    exterior_svf = float(np.mean(svf_pit[0:10, 0:10]))
    # The interior of a 2000m deep pit should have SVF << 1
    # With 4 cells and 16 directions, atan(2000/1000)=63 deg → cos^2 ≈ 0.20 for nearest rim
    # Even the deepest cell mean should be well below 0.80
    enclosed_ok = interior_svf < 0.80
    results["enclosed_terrain"] = {
        "interior_svf_mean": interior_svf,
        "exterior_svf_mean": exterior_svf,
        "pass": enclosed_ok,
        "expected": "Interior SVF < 0.80 for 2000m deep pit (rim above horizon blocks large sky fraction)"
    }

    all_pass = all(r["pass"] for r in results.values())
    results["overall_pass"] = all_pass
    return results


if __name__ == "__main__":
    print("Running SVF synthetic validation...")
    val = validate_svf_synthetic()
    for name, res in val.items():
        if name == "overall_pass":
            print(f"\nOverall validation: {'PASS' if res else 'FAIL'}")
        else:
            status = "PASS" if res["pass"] else "FAIL"
            print(f"\n  [{status}] {name}")
            for k, v in res.items():
                if k != "pass":
                    print(f"    {k}: {v}")
