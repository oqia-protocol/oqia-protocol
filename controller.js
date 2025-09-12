// Oqia Protocol - Off-Chain AI Controller (v3.0 - Oqia-Native Wallet)

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

// --- CONFIGURATION LOADER ---
function loadConfig() {
    const { ALCHEMY_SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

    if (!ALCHEMY_SEPOLIA_RPC_URL || !DEPLOYER_PRIVATE_KEY) {
        throw new Error("Missing required environment variables in .env file.");
    }

    const botConfigPath = path.resolve(__dirname, "./scripts/bot-config.json");
    if (!fs.existsSync(botConfigPath)) {
        throw new Error("bot-config.json not found. Please run the mint-bot.js script first.");
    }
    const botConfig = JSON.parse(fs.readFileSync(botConfigPath, "utf8"));

    // The new architecture doesn't require the registry or session manager for the controller.
    // However, we do need addresses for the modules the agent will call.
    // This is hardcoded for now, but should be discovered dynamically in a real agent.
    const simpleArbitrageModuleAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

    const agentWalletArtifactPath = path.resolve(__dirname, "./artifacts/contracts/OqiaAgentWallet.sol/OqiaAgentWallet.json");
    const simpleArbitrageModuleArtifactPath = path.resolve(__dirname, "./artifacts/contracts/SimpleArbitrageModule.sol/SimpleArbitrageModule.json");

    for (const p of [agentWalletArtifactPath, simpleArbitrageModuleArtifactPath]) {
        if (!fs.existsSync(p)) {
            throw new Error(`ABI file not found at ${p}. Please compile contracts with 'npx hardhat compile'.`);
        }
    }

    const AGENT_WALLET_ABI = JSON.parse(fs.readFileSync(agentWalletArtifactPath, "utf8")).abi;
    const SIMPLE_ARBITRAGE_MODULE_ABI = JSON.parse(fs.readFileSync(simpleArbitrageModuleArtifactPath, "utf8")).abi;

    return {
        rpcUrl: ALCHEMY_SEPOLIA_RPC_URL,
        ownerPrivateKey: DEPLOYER_PRIVATE_KEY,
        botWalletAddress: botConfig.botAddress,
        agentWalletAbi: AGENT_WALLET_ABI,
        simpleArbitrageModuleAbi: SIMPLE_ARBITRAGE_MODULE_ABI,
        simpleArbitrageModuleAddress: simpleArbitrageModuleAddress,
    };
}

// --- CORE AGENT LOGIC ---
class OqiaAgent {
    constructor(config) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.owner = new ethers.Wallet(config.ownerPrivateKey, this.provider);

        console.log(chalk.cyan("🤖 Agent Initializing..."));
        console.log(`   - ${chalk.cyan("Owner:")}          ${this.owner.address}`);
        console.log(`   - ${chalk.cyan("Bot Wallet:")}     ${config.botWalletAddress}`);
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async runDecisionLoop() {
        console.log(chalk.yellow("\n💡 Starting decision loop... Monitoring for opportunities."));
        // This loop will only run once for the test, then exit.
        for (let i = 0; i < 1; i++) {
            try {
                console.log(chalk.gray(`[${new Date().toISOString()}] Monitoring prices...`));
                const marketData = {};

                const opportunity = this.analyzeOpportunities(marketData);
                if (opportunity) {
                    await this.executeTrade(opportunity);
                }

            } catch (error) {
                console.error(chalk.red("   - 🔥 Error in decision loop:"), error.message);
            }
            await this.sleep(2000);
        }
    }

    analyzeOpportunities(marketData) {
        // Placeholder logic
        if (marketData) {}
        return {
            tokenA: ethers.getAddress("0x7b79995e5f793a07bc00c21412e50ea03298c081"), // Dummy addresses
            tokenB: ethers.getAddress("0x6b175474e89094c44da98b954eedeac495271d0f"),
            amountIn: ethers.parseEther("0.001"),
        };
    }

    async executeTrade(opportunity) {
        console.log(chalk.yellow("\n🚀 Executing trade via OqiaAgentWallet..."));

        // The owner directly calls the agent wallet
        const agentWallet = new ethers.Contract(this.config.botWalletAddress, this.config.agentWalletAbi, this.owner);
        const moduleInterface = new ethers.Interface(this.config.simpleArbitrageModuleAbi);

        // Encode the call to the SimpleArbitrageModule
        const callData = moduleInterface.encodeFunctionData("executeArbitrage", [
            this.config.botWalletAddress, // The module needs to know the safe address
            opportunity.tokenA,
            opportunity.tokenB,
            opportunity.amountIn,
        ]);

        try {
            // The owner calls the `execute` function on the agent wallet
            const tx = await agentWallet.execute(
                this.config.simpleArbitrageModuleAddress,
                0, // value
                callData
            );

            console.log(`   - Transaction sent: ${chalk.cyan(tx.hash)}`);
            const receipt = await tx.wait(1);
            console.log(chalk.bold.green("   - ✅ Trade executed successfully!"), `Block: ${receipt.blockNumber}`);

            // Log for success criteria
            console.log(`First autonomous decision executed at block #${receipt.blockNumber}`);

        } catch (error) {
            console.error(chalk.red("   - 🔥 Error executing trade:"), error.reason || error.message);
        }
    }

    async run() {
        console.log(chalk.green("\n🚀 Agent is live and ready to operate."));
        await this.runDecisionLoop();
    }
}

// --- MAIN EXECUTION ---
async function main() {
    try {
        const config = loadConfig();
        const agent = new OqiaAgent(config);
        await agent.run();
    } catch (error) {
        console.error(chalk.red("\n🚨 A critical error occurred:"), error.message);
        process.exit(1);
    }
}

main();