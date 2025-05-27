import time

class EnhancedSierpinskiMiner:
    """
    Geometric Proof‑of‑Work: solve fractal puzzles per triangle depth.
    """

    def __init__(self, ledger, base_difficulty: int = 1_000):
        self.ledger = ledger
        self.base_diff = base_difficulty

    def _generate_puzzle(self, coord: Tuple[int,int,int]) -> str:
        return f"PUZZLE::{coord}"

    def _check_solution(self, puzzle: str, nonce: int, target: int) -> bool:
        # dummy check: in reality you'd hash(puzzle+nonce) < target
        return hash((puzzle, nonce)) % (self.base_diff * target) == 0

    def mine(self, coord: Tuple[int,int,int]) -> dict:
        """
        Attempts to find a valid nonce for the triangle at coord.
        Returns the mining “proof” on success.
        """
        puzzle = self._generate_puzzle(coord)
        target = self._adjust_difficulty(coord[2])
        nonce = 0
        start = time.time()
        while True:
            if self._check_solution(puzzle, nonce, target):
                elapsed = time.time() - start
                return {"coord": coord, "nonce": nonce, "time": elapsed}
            nonce += 1

    def _adjust_difficulty(self, level: int) -> int:
        """Scale target by triangle depth: deeper = harder."""
        return level + 1
