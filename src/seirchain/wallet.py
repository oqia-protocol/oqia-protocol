from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

class SecureWalletManager:
    """
    Multi‑signature wallet with fractal key‑share distribution.
    """

    def __init__(self):
        self.keys = []

    def generate_key(self):
        key = Ed25519PrivateKey.generate()
        self.keys.append(key)
        return key

    def sign(self, key_index: int, message: bytes) -> bytes:
        return self.keys[key_index].sign(message)

    def craft_tx(self, to: str, amount: int, coord: tuple[int,int,int]) -> dict:
        return {"to": to, "amount": amount, "coord": coord, "signatures": []}

    def add_signature(self, tx: dict, key_index: int):
        sig = self.sign(key_index, str(tx).encode())
        tx["signatures"].append(sig)
