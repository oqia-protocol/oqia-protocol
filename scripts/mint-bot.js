// scripts/mint-bot.js (v5.0 - E2E Test Version)
// This script reads the deployed factory address and mints a new agent wallet.

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

// --- CONFIGURATION LOADER ---
function loadConfig() {
    const { DEPLOYER_PRIVATE_KEY } = process.env;
    if (!DEPLOYER_PRIVATE_KEY) {
        throw new Error("Missing DEPLOYER_PRIVATE_KEY in .env file.");
    }

    const deployedContractsPath = path.resolve(__dirname, "..", "deployed_contracts.json");
    if (!fs.existsSync(deployedContractsPath)) {
        throw new Error("deployed_contracts.json not found. Please run the deployment script first.");
    }
    const deployedContracts = JSON.parse(fs.readFileSync(deployedContractsPath, "utf8"));

    const getAddress = (name) => {
        const address = deployedContracts[name];
        if (!address) throw new Error(`${name} address not found in deployed_contracts.json`);
        return address;
    };

    const factoryAddress = getAddress("OqiaBotFactory");

    const factoryArtifactPath = path.resolve(__dirname, "../artifacts/contracts/OqiaBotFactory.sol/OqiaBotFactory.json");
    if (!fs.existsSync(factoryArtifactPath)) {
        throw new Error("Factory ABI not found. Please compile contracts first.");
    }

    const factoryAbi = JSON.parse(fs.readFileSync(factoryArtifactPath, "utf8")).abi;

    return {
        privateKey: DEPLOYER_PRIVATE_KEY,
        factoryAddress: factoryAddress,
        factoryAbi: factoryAbi,
    };
}

// --- MAIN MINTING LOGIC ---
async function main() {
    const config = loadConfig();
    const { ALCHEMY_SEPOLIA_RPC_URL } = process.env;
    // Connect to the Sepolia testnet
    const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_RPC_URL);
    const ownerWallet = new ethers.Wallet(config.privateKey, provider);

    console.log(chalk.cyan("🚀 Minting Oqia Agent Wallet..."));
    console.log(`- Minting with owner wallet: ${chalk.green(ownerWallet.address)}`);
    
    const factory = new ethers.Contract(config.factoryAddress, config.factoryAbi, ownerWallet);

    const tx = await factory.createBot(ownerWallet.address);
    console.log(`  - Transaction sent! Hash: ${chalk.cyan(tx.hash)}`);
    const receipt = await tx.wait(1);
    console.log(chalk.green("  - Transaction confirmed!"));

    const botCreatedEvent = receipt.logs.map(log => {
        try { return factory.interface.parseLog(log); } catch { return null; }
    }).find(event => event?.name === 'BotCreated');

    if (!botCreatedEvent) {
        throw new Error("BotCreated event not found in transaction receipt.");
    }
    
    const newBotAddress = botCreatedEvent.args.wallet;
    const newBotTokenId = botCreatedEvent.args.tokenId;
    console.log(`\n✅ Bot #${newBotTokenId} Minted! Wallet Address: ${chalk.bold.magenta(newBotAddress)}`);

    console.log(chalk.cyan("\n💾 Saving configuration..."));

    const configData = {
        botAddress: newBotAddress,
        botTokenId: newBotTokenId.toString(),
    };
    const configPath = path.resolve(__dirname, 'bot-config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`- Configuration saved to: ${chalk.gray(configPath)}`);
}

main().catch(error => {
    console.error(chalk.red("\nAn error occurred:"));
    console.error(error);
    process.exit(1);
});