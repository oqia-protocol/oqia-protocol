# OQIA Protocol

A decentralized autonomous agent system built on Ethereum, enabling AI agents to operate with account abstraction through Safe wallets and session key management.

## Overview

OQIA (Onchain Query Intelligence Agents) Protocol provides infrastructure for deploying and managing AI agents that can interact with blockchain networks autonomously. Each agent is represented as an NFT with an associated Safe wallet for secure operations.

## Architecture

- **OqiaBotFactory**: ERC721-compliant factory contract for creating agent NFTs with associated Safe wallets
- **OqiaModuleRegistry**: Registry system for managing authorized modules and licensing
- **OqiaSessionKeyManager**: Account abstraction module for managing temporary session keys
- **Controller**: JavaScript runtime for operating agents with session key authentication

## Deployed Contracts (Sepolia)

- **OqiaBotFactory**: `0x851356ae760d987E095750cCeb3bC6014560891C`
- **OqiaModuleRegistry**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **OqiaSessionKeyManager**: `0xdc64a140aa3e981100a9beca4e685f962f0cf6c9`

## Quick Start

### Prerequisites

```bash
npm install
```

### Configuration

Create a `.env` file:

```
ALCHEMY_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
SESSION_KEY_MANAGER_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### Creating a Bot

```bash
node mint-bot.js
```

This will:
- Create a new agent NFT
- Deploy an associated Safe wallet
- Generate metadata and save configuration

### Running the Controller

```bash
node controller.js
```

This will:
- Initialize the agent with session key authentication
- Enable the OqiaSessionKeyManager module on the Safe
- Authorize session keys for autonomous operations

## Testing

```bash
# Run contract tests
npx hardhat test

# Deploy contracts locally
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Features

- **Account Abstraction**: Agents operate through Safe wallets with session key management
- **Upgradeable Architecture**: UUPS proxy pattern for future improvements  
- **Module System**: Extensible registry for authorized agent capabilities
- **NFT Ownership**: Each agent is an ERC721 token with associated metadata
- **Session Keys**: Temporary authentication for autonomous operations

## Security

- All operations require proper authentication through Safe wallets
- Session keys have limited scope and can be revoked
- Module registry controls authorized agent capabilities
- Contracts are upgradeable only by authorized owners

## Development

Built with:
- Hardhat for smart contract development
- ethers.js for blockchain interactions
- OpenZeppelin for secure contract implementations
- Safe contracts for account abstraction

---

*OQIA Protocol - Bringing AI agents onchain with enterprise-grade security and flexibility.*