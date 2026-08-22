import rasterio

path = "LDEM_80S_80MPP_ADJ.tiff"

with rasterio.open(path) as src:
    print("Size (width x height):", src.width, "x", src.height)
    print("Coordinate system:", src.crs)
    print("Pixel resolution:", src.res)
    print("Bounds:", src.bounds)