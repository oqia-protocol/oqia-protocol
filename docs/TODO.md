# Oqia Protocol — TODO

- [x] Session key logic inside the agent wallet to validate signed grants (temporal & function caps).
- [ ] `OqiaBotFactory` — mint ownership NFT (ERC-721) + create Agent Core wallet (Safe wrapper).
- [ ] `OqiaModuleRegistry` — register/approve modules and mint license NFTs (ERC-721 + ERC-2981 royalties).
- [ ] Tests: unit and integration tests for minting, ownership transfer, session key behavior, and module installs/blacklist.
- [ ] Off-chain demo: script to generate session grants and sign transactions (in `scripts/`).
- [ ] Frontend: simple UI in `frontend/` for minting and granting session keys (connects to local Hardhat).
- [ ] Indexing: events emitted so a simple indexer or subgraph can list agents and modules.
- [ ] Security: run static analysis (Slither) and basic property tests.
- [ ] Threat model & security checklist.
