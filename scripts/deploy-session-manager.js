
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Deploying OqiaSessionKeyManager with the account:", deployer.address);

    const deploymentsPath = path.join(__dirname, "..", "deployed_contracts_sepolia.json");
    
    // Manually define the already deployed contracts from the previous run
    const deployments = {
        "OqiaAgentWallet": "0x48C785681f44E2035969709e80aa8B4108626cFe",
        "OqiaBotFactory": "0x77D65EA37E6be056d635fB7d71d1578eB078612C",
        "OqiaModuleRegistry": "0x533AAB779008dce7117f6e2cA398cF865Cd4c249",
        "SimpleArbitrageModule": "0xa465e8f246950326dB77286eb4427F29400e87Bb"
    };

    console.log("\n1. Loaded existing deployments:", deployments);

    console.log("\n2. Deploying OqiaSessionKeyManager...");
    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionManager = await OqiaSessionKeyManager.deploy(deployments.OqiaBotFactory);
    await sessionManager.waitForDeployment();
    deployments.OqiaSessionKeyManager = sessionManager.target;
    console.log(`   ✅ Deployed to: ${deployments.OqiaSessionKeyManger}`);

    console.log("\n3. Saving all deployment addresses...");
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log(`   ✅ All addresses saved to: ${deploymentsPath}`);

    console.log("\n\n🎉🎉🎉 OqiaSessionKeyManager deployed and all contracts recorded successfully! 🎉🎉🎉");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
