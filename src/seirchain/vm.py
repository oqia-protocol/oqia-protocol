class FractalContractEngine:
    """
    EVM‑inspired VM adapted for fractal execution.
    Contract state is sharded across triangles.
    """

    def __init__(self, ledger):
        self.ledger = ledger

    def deploy(self, bytecode: bytes, coord: tuple[int,int,int]):
        self.ledger.add_transaction({"type": "deploy", "code": bytecode}, coord)

    def call(self, coord: tuple[int,int,int], method: str, args: list):
        # load state → execute → commit diffs (omitted)
        pass
