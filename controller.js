// Oqia Protocol - Off-Chain AI Controller (v3.0 - Definitive)
// This version implements the correct "authorize module" flow.

const { ethers } = require("ethers");
require("dotenv").config();

// --- CONFIGURATION ---
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const SESSION_KEY_MANAGER_ADDRESS = process.env.SESSION_KEY_MANAGER_ADDRESS;
const ALCHEMY_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// --- ABIs ---
const FACTORY_ABI = ["function botWalletOf(uint256 tokenId) view returns (address)"];
const AGENT_WALLET_ABI = ["function authorizeModule(address module, bool isAuthorized)"];
const SESSION_KEY_MANAGER_ABI = [
    "function authorizeSessionKey(address safe, address sessionKey, uint256 validUntil, uint256 valueLimit)",
    "function executeTransaction(address safe, address to, uint256 value, bytes calldata data)"
];

// --- LOGIC ---
class OqiaAgent {
    constructor(nftId, owner) {
        this.nftId = nftId;
        this.owner = owner;
        this.provider = owner.provider;
        this.sessionKey = ethers.Wallet.createRandom();
        console.log(`🔑 New Session Key: ${this.sessionKey.address}`);
    }

    async initialize() {
        console.log(`\n🔎 Finding Agent Wallet for NFT #${this.nftId}...`);
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.owner);
        this.agentWalletAddress = await factory.botWalletOf(this.nftId);
        if (this.agentWalletAddress === ethers.ZeroAddress) throw new Error("Agent not found.");
        console.log(`🤖 Agent Wallet Found: ${this.agentWalletAddress}`);

        console.log(`\n💰 Funding Agent Wallet with 0.1 ETH...`);
        const tx = await this.owner.sendTransaction({
            to: this.agentWalletAddress,
            value: ethers.parseEther("0.1")
        });
        await tx.wait();
        console.log(`   ✅ Wallet funded.`);

        this.agentWallet = new ethers.Contract(this.agentWalletAddress, AGENT_WALLET_ABI, this.owner);
        this.sessionManager = new ethers.Contract(SESSION_KEY_MANAGER_ADDRESS, SESSION_KEY_MANAGER_ABI, this.owner);

        await this.setupPermissions();
    }

    async setupPermissions() {
        console.log("\n⚙️  Setting up on-chain permissions...");

        let nonce = await this.provider.getTransactionCount(this.owner.address, 'latest');

        // Step 1: Owner authorizes the Session Key Manager as a module on the Agent Wallet
        console.log("   1. Authorizing Session Manager as a module...");
        const authTx = await this.agentWallet.authorizeModule(SESSION_KEY_MANAGER_ADDRESS, true, { nonce: nonce++ });
        await authTx.wait();
        console.log("      ✅ Module authorized.");

        // Step 2: Owner tells the Session Key Manager to create a session key
        console.log("   2. Authorizing temporary session key...");
        const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const valueLimit = ethers.parseEther("0.001");
        const keyTx = await this.sessionManager.authorizeSessionKey(this.agentWalletAddress, this.sessionKey.address, validUntil, valueLimit, { nonce: nonce++ });
        await keyTx.wait();
        console.log("      ✅ Session key authorized.");

        // Step 3: Owner sends gas money to the session key
        console.log("   3. Funding session key for gas...");
        const fundTx = await this.owner.sendTransaction({
            to: this.sessionKey.address,
            value: ethers.parseEther("0.1"), // Send ETH for gas
            nonce: nonce++
        });
        await fundTx.wait();
        console.log("      ✅ Session key funded.");
    }

    async executeAutonomousTransaction() {
        console.log("\n🚀 Executing autonomous transaction via session key...");
        const managerWithSessionKey = this.sessionManager.connect(this.sessionKey.connect(this.provider));

        const targetAddress = this.owner.address; // For demo, we send ETH to the owner
        const value = ethers.parseEther("0.0001");

        try {
            const execTx = await managerWithSessionKey.executeTransaction(this.agentWalletAddress, targetAddress, value, "0x");
            console.log(`   - Transaction sent: ${execTx.hash}`);
            await execTx.wait();
            console.log("   - ✅ AUTONOMOUS TRANSACTION SUCCEEDED!");
        } catch (error) {
            console.error("   - 🔥 AUTONOMOUS TRANSACTION FAILED:", error.reason);
        }
    }
}

async function main() {
    const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, new ethers.JsonRpcProvider(ALCHEMY_RPC_URL));
    const agent = new OqiaAgent(1, ownerWallet); // Controlling Bot #1

    await agent.initialize();
    await agent.executeAutonomousTransaction();

    console.log("\n🎉 Full workflow complete.");
}

main().catch(error => {
    console.error("\n🚨 A critical error occurred:", error);
    process.exit(1);
});
