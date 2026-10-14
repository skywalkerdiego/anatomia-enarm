# blender -b --python tools/inspect_axes.py -- <stl dir> <id> [<id> ...]
# Prints the bounds and triangle count of raw meshes, to learn the data's axes.
import sys, os, struct

args = sys.argv[sys.argv.index("--") + 1:]
folder, ids = args[0], args[1:]
for fid in ids:
    path = os.path.join(folder, fid + ".stl")
    if not os.path.exists(path):
        print(fid, "missing")
        continue
    with open(path, "rb") as f:
        f.seek(80)
        n = struct.unpack("<I", f.read(4))[0]
        lo = [1e9] * 3
        hi = [-1e9] * 3
        data = f.read()
    step = max(1, n // 4000)
    for t in range(0, n, step):
        base = t * 50 + 12
        for v in range(3):
            p = struct.unpack_from("<3f", data, base + v * 12)
            for a in range(3):
                lo[a] = min(lo[a], p[a])
                hi[a] = max(hi[a], p[a])
    print(fid.ljust(10), str(n).rjust(8), "tris  x[%7.1f %7.1f] y[%7.1f %7.1f] z[%7.1f %7.1f]" % (lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
