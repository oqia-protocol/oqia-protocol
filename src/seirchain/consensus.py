import threading
from .ledger import TriangularLedger
from .miner import EnhancedSierpinskiMiner

class FractalConsensus:
    """
    Parallel, multi‑level consensus with geometric finality.
    """

    def __init__(self, ledger: TriangularLedger, miners: list[EnhancedSierpinskiMiner]):
        self.ledger = ledger
        self.miners = miners
        self.lock = threading.Lock()

    def propose_block(self, proof: dict):
        coord = proof["coord"]
        if not self.ledger.validate_subdivision(coord):
            raise ValueError("Invalid fractal geometry")
        # commit block (omitted)

    def synchronize(self):
        with self.lock:
            # fetch and reconcile proofs (omitted)
            pass
