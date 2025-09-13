# New Development Plan: Oqia Protocol

This document outlines a phased development plan for the Oqia Protocol, breaking down the project into actionable steps with a focus on security, testing, and community engagement.

## Phase 1: Core Infrastructure & Smart Contracts (Weeks 1-5)

This phase focuses on building a secure and robust foundation for the Oqia Protocol.

*   **Week 1: Security & Threat Modeling**
    *   [x] Conduct a thorough threat modeling exercise to identify potential security vulnerabilities.
    *   [x] Create a comprehensive security checklist that will be used throughout the development process.
    *   [ ] Research and select a reputable smart contract audit firm.

*   **Weeks 2-4: Smart Contract Development & Testing**
    *   [ ] **`OqiaBotFactory.sol`**:
        *   [x] Implement the logic for minting ownership NFTs (ERC-721).
        *   [x] Implement the creation of the Agent Core wallet (Safe wrapper).
        *   [ ] Write comprehensive unit tests for all functions.
    *   [ ] **`OqiaModuleRegistry.sol`**:
        *   [x] Implement module registration and approval.
        *   [x] Implement the minting of license NFTs (ERC-721 with ERC-2981 royalties).
        *   [x] Develop a blacklisting mechanism for malicious modules.
        *   [ ] Write comprehensive unit tests.
    *   [ ] **`OqiaAgentWallet.sol` & Session Keys**:
        *   [x] Implement the session key architecture for granting ephemeral permissions.
        *   [x] Implement temporal and function-based caps for session keys.
        *   [ ] Write extensive tests to ensure session key restrictions are enforced correctly.

*   **Week 5: Integration Testing & Deployment to Testnet**
    *   [ ] Write integration tests for the entire smart contract suite.
    *   [ ] Deploy all contracts to a public testnet (e.g., Sepolia).
    *   [ ] Verify all contract interactions on the testnet.

## Phase 2: Off-Chain Services & Frontend (Weeks 6-9)

This phase focuses on building the necessary off-chain components and a user-friendly frontend to interact with the protocol.

*   **Weeks 6-7: Off-Chain Backend & Demo**
    *   [ ] Develop a demo backend service to generate session grants and sign transactions.
    *   [ ] Create a skeleton for the vector database to store off-chain agent knowledge.
    *   [ ] Implement a simple API to interact with the backend services.

*   **Weeks 8-9: Frontend MVP**
    *   [x] Design a simple and intuitive user interface.
    *   [x] Implement the frontend for minting agent NFTs.
    *   [x] Implement the frontend for granting and revoking session keys.
    *   [ ] Connect the frontend to the deployed smart contracts on the testnet.

## Phase 3: Community, Security & Mainnet Launch (Weeks 10-13)

This phase focuses on preparing for mainnet launch, engaging with the community, and ensuring the long-term security of the protocol.

*   **Week 10: Indexing, Documentation & CI/CD**
    *   [ ] Set up a subgraph or a simple indexer to list agents and modules.
    *   [ ] Write comprehensive documentation for developers and end-users.
    *   [ ] Implement a CI/CD pipeline for automated testing and deployment.
    *   [ ] Integrate static analysis tools (e.g., Slither) into the CI/CD pipeline.

*   **Week 11: Community Building & Feedback**
    *   [ ] Launch a bug bounty program to incentivize security researchers to find vulnerabilities.
    *   [ ] Open-source the code and invite community contributions.
    *   [ ] Gather feedback from the community and make necessary improvements.

*   **Week 12: Smart Contract Audit & Final Preparations**
    *   [ ] Submit the smart contracts for a professional security audit.
    *   [ ] Address all the issues and recommendations from the audit report.
    *   [ ] Perform final testing and security checks.

*   **Week 13: Mainnet Launch & Post-Launch Monitoring**
    *   [ ] Deploy the smart contracts to the Ethereum mainnet.
    *   [ ] Implement a monitoring system to track the health and security of the protocol.
    *   [ ] Announce the mainnet launch and engage with the community.
