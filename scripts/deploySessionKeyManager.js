const { ethers, run } = require("hardhat");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    console.log("Starting OqiaSessionKeyManager deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionKeyManager = await OqiaSessionKeyManager.deploy();
    await sessionKeyManager.waitForDeployment();
    const implementationAddress = sessionKeyManager.target;
  
    console.log(`✅ OqiaSessionKeyManager deployed to: ${implementationAddress}`);

    console.log("\nWaiting 30s for Etherscan indexing...");
    await sleep(30000);

    try {
        console.log("Verifying OqiaSessionKeyManager implementation...");
        await run("verify:verify", { address: implementationAddress });
        console.log("✅ OqiaSessionKeyManager Verification successful.");
    } catch (error) {
        console.error(`🔥 OqiaSessionKeyManager Verification failed: ${error.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});