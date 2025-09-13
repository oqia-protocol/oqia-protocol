# Oqia Protocol

Oqia is a decentralized protocol for autonomous on-chain agents.

## Project Status

The core smart contracts for the Oqia Protocol are currently under active development. The foundational component, the `OqiaAgentWallet`, has been implemented and tested.

### Recent Updates

I have successfully integrated session key functionality directly into the `OqiaAgentWallet.sol` contract. This is a significant enhancement to the security and flexibility of agent wallets, allowing for fine-grained, temporary permissions.

Key changes include:
- **Session Key Management:** Instead of a separate contract, session key logic is now built into `OqiaAgentWallet.sol`. This simplifies the architecture and reduces complexity.
- **Granular Permissions:** Session keys can now be authorized for specific functions using function selectors (`bytes4`). This allows for more secure, task-oriented permissions.
- **Time-based Validity:** Session keys can be created with a set duration, after which they automatically expire.
- **Comprehensive Events:** The contract now emits `SessionKeyCreated`, `ExecutionSuccess`, and `ExecutionFailure` events, providing better on-chain visibility into agent activities.
- **Test Coverage:** The test suite has been updated to fully cover the new session key functionality, ensuring everything works as expected.

## Development

Built with:
- Hardhat for smart contract development
- ethers.js for blockchain interactions
- OpenZeppelin for secure contract implementations
- Safe contracts for account abstraction

---

*OQIA Protocol - Bringing AI agents onchain with enterprise-grade security and flexibility.*
