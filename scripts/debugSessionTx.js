// scripts/debugSessionTx.js
const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// Respect SKIP_DEPLOY for safety when running checks
if (process.env.SKIP_DEPLOY) {
    console.log("SKIP_DEPLOY is set — aborting debugSessionTx script.");
    process.exit(0);
}

async function debugSessionKeyCall() {
    console.log("=== Oqia Debug Script with Impersonation ===\n");

    // --- Values from the last failing test run ---
    const agentWalletAddr = "0x75537828f2ce51be7289709686A69CbFDbB714F1";
    const sessionManagerAddr = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
    const moduleAddr = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
    const tokenAddr = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
    const sessionKeyAddr = "0x1B310E48be5AC0fD17c0b2261Aace9e68eec1a92";

    // 1. Get a contract instance for the Session Manager
    const sessionManager = await ethers.getContractAt("OqiaSessionKeyManager", sessionManagerAddr);

    // 2. Impersonate the session key account
    console.log(`Impersonating account: ${sessionKeyAddr}`);
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [sessionKeyAddr],
    });
    const sessionKeySigner = await ethers.getSigner(sessionKeyAddr);

    // 3. Connect the impersonated signer to the contract
    const contractAsSessionKey = sessionManager.connect(sessionKeySigner);

    // 4. Prepare the arguments for the function call
    const moduleInterface = new ethers.Interface((await hre.artifacts.readArtifact("SimpleArbitrageModule")).abi);
    const callData = moduleInterface.encodeFunctionData("executeArbitrage", [
        agentWalletAddr,
        tokenAddr,
        "0x610178da211fef7d417bc0e6fed39f05609ad788", // Mock token B
        ethers.parseEther("1"),
    ]);

    // 5. Attempt the call using the connected contract instance
    console.log("\n[Transaction Simulation]");
    try {
        console.log("Attempting to call executeTransaction as the session key...");
        const result = await contractAsSessionKey.executeTransaction.staticCall(
            agentWalletAddr,
            moduleAddr,
            0,
            callData
        );
        console.log("✅ Call Succeeded! Result:", result);
    } catch (error) {
        console.error("❌ The call reverted. This is the full error object:", error);
    }

    console.log("\n=== End of Debug Script ===");
}

debugSessionKeyCall().catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
});
