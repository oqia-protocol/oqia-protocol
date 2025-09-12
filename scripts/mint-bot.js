// scripts/mint-bot.js (v4.0 - Oqia-Native Wallet)
// This script calls the refactored factory to create a new agent wallet.

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

// --- CONFIGURATION LOADER ---
function loadConfig() {
    const {
        ALCHEMY_SEPOLIA_RPC_URL,
        DEPLOYER_PRIVATE_KEY
    } = process.env;

    if (!ALCHEMY_SEPOLIA_RPC_URL || !DEPLOYER_PRIVATE_KEY) {
        console.error(chalk.red("Error: Missing required environment variables in .env file."));
        process.exit(1);
    }

    // Read factory address from the temporary file
    const factoryAddressPath = path.join("/tmp", "factory-address.tmp");
    if (!fs.existsSync(factoryAddressPath)) {
        console.error(chalk.red(`Error: Factory address file not found at ${factoryAddressPath}`));
        console.error(chalk.yellow("Please run the deployment script first."));
        process.exit(1);
    }
    const FACTORY_ADDRESS = fs.readFileSync(factoryAddressPath, "utf8").trim();
    
    const factoryArtifactPath = path.resolve(__dirname, "../artifacts/contracts/OqiaBotFactory.sol/OqiaBotFactory.json");
    if (!fs.existsSync(factoryArtifactPath)) {
        console.error(chalk.red(`Error: ABI file not found at ${factoryArtifactPath}`));
        console.error(chalk.yellow("Please compile your contracts by running 'npx hardhat compile' first."));
        process.exit(1);
    }

    const FACTORY_ABI = JSON.parse(fs.readFileSync(factoryArtifactPath, "utf8")).abi;

    return {
        rpcUrl: ALCHEMY_SEPOLIA_RPC_URL,
        privateKey: DEPLOYER_PRIVATE_KEY,
        factoryAddress: FACTORY_ADDRESS,
        factoryAbi: FACTORY_ABI,
    };
}

// --- MAIN MINTING LOGIC ---
async function main() {
    const config = loadConfig();
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
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