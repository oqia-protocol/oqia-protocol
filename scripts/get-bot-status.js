// scripts/get-bot-status.js (v2.0 - Oqia-Native Wallet)
// This script reads the bot config and displays on-chain status about the agent.

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

// --- CONFIGURATION LOADER ---
function loadConfig() {
    const {
        ALCHEMY_SEPOLIA_RPC_URL,
    } = process.env;

    if (!ALCHEMY_SEPOLIA_RPC_URL) {
        console.error(chalk.red("Error: Missing ALCHEMY_SEPOLIA_RPC_URL in .env file."));
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

    const botConfigPath = path.resolve(__dirname, 'bot-config.json');
    if (!fs.existsSync(botConfigPath)) {
        console.error(chalk.red(`Error: Bot configuration file not found at ${botConfigPath}`));
        console.error(chalk.yellow("Please mint a bot first by running 'node scripts/mint-bot.js'."));
        process.exit(1);
    }
    const botConfig = JSON.parse(fs.readFileSync(botConfigPath, "utf8"));

    return {
        rpcUrl: ALCHEMY_SEPOLIA_RPC_URL,
        factoryAddress: FACTORY_ADDRESS,
        factoryAbi: FACTORY_ABI,
        botConfig: botConfig
    };
}

async function main() {
    const config = loadConfig();
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);

    console.log(chalk.bold.cyan("--- Oqia Bot Status ---"));

    // --- Bot Wallet Info ---
    console.log(chalk.bold(`\nBot Wallet: ${chalk.magenta(config.botConfig.botAddress)}`));
    const balance = await provider.getBalance(config.botConfig.botAddress);
    console.log(`  - Balance: ${chalk.green(ethers.formatEther(balance))} ETH`);

    // --- Bot NFT Info ---
    const factory = new ethers.Contract(config.factoryAddress, config.factoryAbi, provider);
    const owner = await factory.ownerOf(config.botConfig.botTokenId);
    console.log(chalk.bold(`\nBot NFT #${config.botConfig.botTokenId}`));
    console.log(`  - Owner: ${chalk.green(owner)}`);

    console.log(chalk.bold.cyan("\n-----------------------"));
}

main().catch(error => {
    console.error(chalk.red("\nAn error occurred:"));
    console.error(error);
    process.exit(1);
});
