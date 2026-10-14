# Reads a body written by build_model.py (.cache/models/<body>/raw.bin + meta.json).
import json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class RawBody:
    def __init__(self, name):
        d = os.path.join(ROOT, ".cache", "models", name)
        self.meta = json.load(open(os.path.join(d, "meta.json"), encoding="utf8"))
        self.raw = np.fromfile(os.path.join(d, "raw.bin"), dtype=np.uint8)
        self.by_id = {s["id"]: s for s in self.meta["structs"]}

    def mesh(self, sid):
        """Positions (mm), triangles and part index of one structure."""
        s = self.by_id[sid]
        vo, vl, nv = s["v"]
        rec = self.raw[vo:vo + vl].reshape(nv, 16)
        q = rec[:, :6].copy().view(np.uint16).astype(np.float64)
        co = np.array(self.meta["lo"]) + q / 65535 * np.array(self.meta["size"])
        io, il, ni = s["i"]
        tri = self.raw[io:io + il].copy().view(np.uint32).reshape(-1, 3).astype(np.int64)
        return co, tri, rec[:, 11].astype(np.int64)
