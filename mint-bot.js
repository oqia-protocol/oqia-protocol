// scripts/mint-bot.js
// This script interacts with your deployed OqiaBotFactory to mint a new agent.

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

// --- CONFIGURATION ---
const FACTORY_ADDRESS = "0x851356ae760d987E095750cCeb3bC6014560891C"; // Your deployed factory address on Sepolia
const ALCHEMY_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// The ABI for the createBot function
const FACTORY_ABI = [
    "function createBot(address botOwner, address[] calldata owners, uint256 threshold, address fallbackHandler, string calldata metadataURI, uint256 saltNonce) returns (address)",
    "event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet, string metadataURI)"
];

// --- MAIN MINTING LOGIC ---
async function main() {
    console.log("🚀 Starting the bot minting process...");

    // Connect to the Sepolia network
    const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
    const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    console.log(`👤 Minting with wallet: ${ownerWallet.address}`);

    // Create an instance of your factory contract
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, ownerWallet);

    // --- Define the new bot's parameters ---
    const botOwner = ownerWallet.address;
    const owners = [ownerWallet.address]; // The initial Safe owners (can be a multisig)
    const threshold = 1; // Requires 1 signature from the owners list
    const fallbackHandler = ethers.ZeroAddress; // Optional: for advanced interactions
    const metadataURI = "ipfs://bafyreig5q252nvzgf4fhfr3q2cl7sf3zax2qpwemnp6gcgknmhevamtkny/metadata.json"; // Example IPFS URI
    
    // A random salt nonce to ensure a unique wallet address
    const saltNonce = Math.floor(Math.random() * 1000000);
    console.log(`🧂 Using Salt Nonce: ${saltNonce}`);

    try {
        console.log("\nTransaction Details:");
        console.log(`   - Bot Owner: ${botOwner}`);
        console.log(`   - Wallet Owners: [${owners.join(", ")}]`);
        console.log(`   - Threshold: ${threshold}`);

        console.log("\nSending transaction to create new agent...");
        const tx = await factory.createBot(
            botOwner,
            owners,
            threshold,
            fallbackHandler,
            metadataURI,
            saltNonce,
            { gasLimit: 500000 }
        );

        console.log(`   - Transaction sent! Hash: ${tx.hash}`);
        console.log("   - Waiting for transaction to be confirmed...");
        
        const receipt = await tx.wait();
        
        console.log("\n🎉 Bot minted successfully!");
        console.log(`   - Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log("   - Check Etherscan: https://sepolia.etherscan.io/tx/" + tx.hash);

        // Extract bot wallet address from the event
        const factoryInterface = new ethers.Interface(FACTORY_ABI);
        const botCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = factoryInterface.parseLog(log);
                return parsed && parsed.name === "BotCreated";
            } catch {
                return false;
            }
        });

        if (!botCreatedEvent) {
            throw new Error("BotCreated event not found in transaction receipt.");
        }

        const botAddress = botCreatedEvent.args.wallet;
        console.log(`   - New Bot Wallet Address: ${chalk.magenta(botAddress)}`);

        // Save bot configuration to bot-config.json
        const botConfig = {
            botAddress: botAddress,
            factoryAddress: FACTORY_ADDRESS,
        };
        const botConfigPath = path.resolve(__dirname, "bot-config.json");
        fs.writeFileSync(botConfigPath, JSON.stringify(botConfig, null, 4));
        console.log(chalk.green(`   - Bot configuration saved to ${botConfigPath}`));

        console.log("\n✅ You can now run 'node controller.js' to control your new agent!");

    } catch (error) {
        console.error("\n🔥 An error occurred during minting:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});


