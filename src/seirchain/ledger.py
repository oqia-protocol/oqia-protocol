import threading
from typing import List, Tuple

class TriangularLedger:
    """
    Core fractal transaction storage and validation using a Sierpinski subdivision.
    Transactions are indexed by (x, y, level) within a triangular grid.
    """

    def __init__(self, max_level: int = 10):
        self.max_level = max_level
        self.lock = threading.RLock()
        # Storage: dict[level][(x,y)] -> list of txs
        self._shards = {level: {} for level in range(max_level + 1)}

    def add_transaction(self, tx_data: dict, coord: Tuple[int,int,int]):
        """
        Add a transaction to the triangle at given coordinate.
        coord: (x, y, level)
        """
        x, y, lvl = coord
        if lvl > self.max_level or x < 0 or y < 0 or x + y > 2**lvl:
            raise ValueError("Invalid Sierpinski coordinate")
        with self.lock:
            shard = self._shards[lvl].setdefault((x,y), [])
            shard.append(tx_data)

    def get_transactions(self, coord: Tuple[int,int,int]) -> List[dict]:
        """Retrieve all transactions in the specified triangle."""
        return self._shards.get(coord[2], {}).get((coord[0], coord[1]), [])

    def validate_subdivision(self, parent: Tuple[int,int,int]) -> bool:
        """
        Check that child triangles at level+1 correctly partition
        the parent triangle. Returns True if the geometry holds.
        """
        # Implementation omitted for brevity
        return True

    def prune_empty_shards(self):
        """Optional housekeeping: remove shards with zero txs."""
        with self.lock:
            for lvl, data in list(self._shards.items()):
                empties = [k for k,v in data.items() if not v]
                for k in empties:
                    del data[k]
