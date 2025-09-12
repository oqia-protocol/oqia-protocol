# Oqia Protocol — Development Plan

Date: 2025-09-12

This document distills the `WHITEPAPER.md` into a concrete development plan, milestones, MVP scope, risks, acceptance criteria, and next steps for engineering.

## Quick summary
- Goal: Build an open, modular, NFT-owned AI agent framework on Ethereum (ERC-4337 Safe-based agent wallets, ERC-721 ownership NFTs, NFT-licensed modules, session key architecture, and hybrid off-chain knowledge layer).
- MVP: Ability to mint an agent NFT that provisions a Safe-based agent wallet, grant ephemeral session keys with enforced caps, and install a module license; basic frontend to demonstrate these flows; unit & integration tests.

## Product contract
- Inputs: user wallets, module contracts (ERC-721), off-chain agent signals, session key grants, paymaster funds.
- Outputs: deployed agent smart wallets (ERC-4337/Safe), ownership ERC-721 NFTs, module license NFTs, registry events for indexing, frontend views.
- Error modes: deployment failure, compromised session key, malicious module behavior, indexing outage.
- Success criteria (MVP): mint an agent NFT + Safe-based wallet on local network; create and enforce session grants; mint module license NFT and observe registry events; frontend can show agent and grant flows; tests pass.

## MVP scope
1. Smart contracts:
   - `OqiaBotFactory` — mint ownership NFT (ERC-721) + create Agent Core wallet (Safe wrapper).
   - `OqiaModuleRegistry` — register/approve modules and mint license NFTs (ERC-721 + ERC-2981 royalties).
   - Session key logic inside the agent wallet to validate signed grants (temporal & function caps).
2. Tests: unit and integration tests for minting, ownership transfer, session key behavior, and module installs/blacklist.
3. Off-chain demo: script to generate session grants and sign transactions (in `scripts/`).
4. Frontend: simple UI in `frontend/` for minting and granting session keys (connects to local Hardhat).
5. Indexing: events emitted so a simple indexer or subgraph can list agents and modules.
6. Security: run static analysis (Slither) and basic property tests.

MVP Acceptance Criteria:
- Tests all pass.
- Developer can mint an agent NFT; a corresponding Safe-based wallet address is created.
- A signed session grant allows only whitelisted calls within caps; non-whitelisted calls are rejected.
- Module license NFTs can be minted and blacklisting prevents further installs.
- Frontend can show agent ownership and session grant generator (demo only).

## Milestones & rough estimates (work-weeks)
1. Scoping & Specs — 0.5–1w (DELIVERED)
2. Threat model & security checklist — 0.5w
3. Core contracts & tests (Agent Core + Factory) — 2–3w
4. Module registry & licenses — 1–2w
5. Session key architecture — 1–2w
6. Off-chain demo backend & vector DB skeleton — 2w
7. Frontend MVP (minting UI, dashboard) — 1–2w
8. Indexing / subgraph & docs — 1–2w
9. Tests, CI, static analysis — 1w

Estimated MVP total: 9–13 work-weeks.

## Repo mapping
- Smart contracts: `contracts/` (new/updated: `OqiaAgentWallet.sol`, `OqiaBotFactory.sol`, `OqiaModuleRegistry.sol`)
- Tests & scripts: `test/`, `scripts/` (deploy, grant helpers)
- Frontend: `frontend/` (`app.js`, `index.html`, `style.css`)
- Types: `typechain-types/` (regenerate after contract changes)
- Docs: `docs/` (this file), `README.md`
- CI/security: `.github/workflows/` (to be added)

## Top risks & mitigations
1. Compromised off-chain signer: enforce strict session key caps (time, functions, value), fast on-chain revocation, monitoring.
2. Malicious modules: require community curation, staking bonds, blacklist mechanism, emergency pause.
3. Ownership transfer race conditions: ensure NFT transfer event updates control mapping atomically and add tests.
4. Gas sponsorship abuse: implement paymaster constraints and treasury monitoring.
5. Reentrancy & unsafe delegatecalls: avoid delegatecall-based modules; require static analysis and audits.
6. Data privacy & scaling for vector DBs: keep heavy data off-chain, anchor hashes on-chain (IPFS/Arweave), and provide access controls via NFTs.

## Tests & quality gates
- Unit tests for every contract (happy path + key edge cases).
- Integration test: mint → grant session key → off-chain signer executes allowed call.
- Static analysis: Slither (no high-severity findings); integrate into CI.
- Linting & typecheck: Solidity style + JS/TS lints; regenerate `typechain-types/`.

## Low-risk early improvements
- `scripts/grant_session.js` helper for generating session grants.
- Test skeletons in `test/` before contract implementation (TDD).
- `docs/ARCHITECTURE.md` distilled diagrams and API contracts.

## Next steps (choose one)
- Option A (scoping completion): produce a full `docs/FEATURE_SPEC.md` with user stories, prioritized backlog, and week-by-week plan. Then mark scoping done and begin threat-model.
- Option B (start implementing): begin with `OqiaBotFactory.sol` + test harness.

If you want Option A, I will complete the feature spec and update the todo list.
If you want Option B, tell me whether to start with contracts or frontend.

---

This document was created from `WHITEPAPER.md` and the project TODO list. Place comments or give priority guidance and I will continue with the next item.
