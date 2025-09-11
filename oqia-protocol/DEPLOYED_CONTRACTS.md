# Deployed Contracts on Sepolia Testnet

This document lists the addresses of the contracts deployed on the Sepolia testnet.

## OqiaBotFactory
*   **Proxy Address:** `0x39570EF64a95e61D759ba2276f8abb163D62714C`
*   **Implementation Address:** `0x4B1C1Ad87B6282314D3CaBE0FFF518b020c4dC61`
*   **Description:** A factory contract responsible for creating Oqia Bot NFT wallets (Gnosis Safes). It mints an ERC721 token representing ownership of a bot wallet.

## OqiaModuleRegistry
*   **Proxy Address:** `0x5daa57C6cBACA0740abbd23Af85f8A5921cb5bC1`
*   **Implementation Address:** `0xFc7A3B8646a0BD9C78fBF208EC0651f285837418`
*   **Description:** A registry contract for Oqia modules. It allows the owner to register new modules and mint licenses for them, represented as ERC721 tokens.

## OqiaSessionKeyManager
*   **Contract Address:** `0x5983D1006f3C5B01A630F6C81AC784aacAD39Fa9`
*   **Description:** A contract designed to manage session keys for a Gnosis Safe, enabling delegated execution of transactions with predefined permissions and limits.
