// scripts/mint-bot.js v2.1
// This version loads the full ABI from the artifacts folder to ensure
// reliable event parsing after a successful transaction.

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const prompts = require("prompts");
require("dotenv").config();

// --- CONFIGURATION LOADER ---
function loadConfig() {
    const { ALCHEMY_SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, FACTORY_ADDRESS } = process.env;

    if (!ALCHEMY_SEPOLIA_RPC_URL || !DEPLOYER_PRIVATE_KEY || !FACTORY_ADDRESS) {
        console.error(chalk.red(" Error: Missing required environment variables in .env file."));
        process.exit(1);
    }
    
    // --- FIX: Load the full, compiled ABI ---
    const factoryArtifactPath = path.resolve(__dirname, "../artifacts/src/OqiaBotFactory.sol/OqiaBotFactory.json");
    if (!fs.existsSync(factoryArtifactPath)) {
        console.error(chalk.red(` Error: ABI file not found at ${factoryArtifactPath}`));
        console.error(chalk.yellow("Please compile your contracts by running 'npx hardhat compile' first."));
        process.exit(1);
    }
    const FACTORY_ABI = JSON.parse(fs.readFileSync(factoryArtifactPath, "utf8")).abi;
    // --- END FIX ---

    return {
        rpcUrl: ALCHEMY_SEPOLIA_RPC_URL,
        privateKey: DEPLOYER_PRIVATE_KEY,
        factoryAddress: FACTORY_ADDRESS,
        factoryAbi: FACTORY_ABI,
    };
}

// --- MAIN MINTING LOGIC (abbreviated, no changes here) ---
async function main() {
    const config = loadConfig();
    // ... the rest of the minting logic is identical ...
    console.log(chalk.cyan(" Starting the bot minting process..."));
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const ownerWallet = new ethers.Wallet(config.privateKey, provider);
    const factory = new ethers.Contract(config.factoryAddress, config.factoryAbi, ownerWallet);
    const saltNonce = Math.floor(Math.random() * 1e16);
    
    console.log(` Minting with wallet: ${chalk.green(ownerWallet.address)}`);
    console.log(` Using Salt Nonce: ${saltNonce}`);

    const tx = await factory.createBot(
        ownerWallet.address, [ownerWallet.address], 1, ethers.ZeroAddress, "ipfs://placeholder", saltNonce
    );
    console.log(`   - Transaction sent! Hash: ${chalk.cyan(tx.hash)}`);
    
    const receipt = await tx.wait(1);
    console.log(chalk.green("\n Transaction confirmed!"));

    const botCreatedEvent = receipt.logs.map(log => {
        try { return factory.interface.parseLog(log); } catch { return null; }
    }).find(event => event?.name === 'BotCreated');

    if (!botCreatedEvent) {
        throw new Error("BotCreated event not found in transaction receipt.");
    }
    
    const newBotAddress = botCreatedEvent.args.wallet; // Corrected argument name
    const newTokenId = botCreatedEvent.args.tokenId;
    console.log(`\n Bot #${newTokenId} Minted! Wallet Address: ${chalk.bold.magenta(newBotAddress)}`);

    const configData = { botAddress: newBotAddress, tokenId: newTokenId.toString() };
    const configPath = path.resolve(__dirname, 'bot-config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`   - Configuration saved to: ${chalk.gray(configPath)}`);
}

main().catch(console.error);