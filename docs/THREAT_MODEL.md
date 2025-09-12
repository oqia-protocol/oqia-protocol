# Oqia Protocol Threat Model

This document outlines potential security threats to the Oqia Protocol and is intended to be a living document, updated as the protocol evolves.

## 1. Core Components

The Oqia Protocol consists of the following core smart contracts:

*   **OqiaBotFactory.sol:** Responsible for creating new agent wallets (ERC-4337 Safe-based).
*   **OqiaAgentWallet.sol:** The agent's own smart contract wallet.
*   **OqiaModuleRegistry.sol:** A registry for modules that can be installed in agent wallets.
*   **OqiaSessionKeyManager.sol:** Manages ephemeral session keys for delegated agent interaction.
*   **SimpleArbitrageLicense.sol:** An example of a module license (ERC-721).
*   **SimpleArbitrageModule.sol:** An example of a module that can be installed in an agent wallet.

## 2. Potential Threats & Mitigations

This section details potential threats, their impact, and proposed mitigations.

### 2.1. Smart Contract Vulnerabilities (General)

*   **Threat:** Standard smart contract vulnerabilities like re-entrancy, integer overflow/underflow, unchecked external calls, etc.
*   **Impact:** Could lead to loss of funds, unauthorized access, or denial of service.
*   **Mitigation:**
    *   Adherence to the "checks-effects-interactions" pattern.
    *   Use of OpenZeppelin contracts where possible.
    *   Comprehensive test suite with 100% line and branch coverage.
    *   Regular static analysis with tools like Slither.
    *   Independent security audit by a reputable firm.

### 2.2. OqiaBotFactory.sol

*   **Threat:** Malicious actor could create a large number of agent wallets, potentially spamming the network or exploiting a vulnerability in the wallet creation process.
*   **Impact:** Denial of service, waste of resources.
*   **Mitigation:**
    *   Consider adding a fee for agent creation to deter spam.
    *   Ensure that the wallet creation process is atomic and cannot be left in an inconsistent state.

### 2.3. OqiaSessionKeyManager.sol

*   **Threat:** A compromised session key could be used by an attacker to perform unauthorized actions on behalf of the agent.
*   **Impact:** Loss of funds, unauthorized module installation, etc., up to the limits defined for the session key.
*   **Mitigation:**
    *   **Short-lived session keys:** Encourage and enforce short expiry times for session keys.
    *   **Strict permissions:** Session keys should be granted with the minimum necessary permissions (e.g., limited to specific functions, specific target contracts, and with spending caps).
    *   **Revocation:** A robust and easily accessible mechanism for revoking compromised session keys.

### 2.4. OqiaModuleRegistry.sol & Malicious Modules

*   **Threat:** A malicious module could be registered and then installed by an agent, leading to the agent's wallet being drained or used for malicious purposes.
*   **Impact:** Complete compromise of the agent wallet.
*   **Mitigation:**
    *   **Curation:** Implement a curation mechanism for the module registry. This could be a simple allowlist, a decentralized curation market (e.g., using a token), or a reputation-based system.
    *   **Transparency:** Make it easy for users to see the source code and audit history of modules before installing them.
    *   **Sandboxing:** While difficult in the EVM, explore architectural patterns that limit the potential damage a module can do.

## 3. Off-Chain Components

*   **Threat:** The off-chain components that generate agent signals could be compromised, leading to malicious on-chain actions.
*   **Impact:** Dependent on the nature of the agent and its modules.
*   **Mitigation:**
    *   Secure key management for any keys used to sign off-chain messages.
    *   Monitoring and alerting for unusual off-chain activity.

## 4. Next Steps

*   [ ] Review and refine this threat model with the team.
*   [ ] Create a `SECURITY_CHECKLIST.md` based on this model and general smart contract best practices.
*   [ ] Begin implementation of the mitigations described above.
