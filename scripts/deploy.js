// scripts/deploy.js (v3.0 - Oqia-Native Wallet)
// This script deploys the Oqia-native agent wallet and a refactored factory,
// and automatically updates the .env file with the new factory address.

const { ethers, upgrades, run } = require("hardhat");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

// SAFETY: set SKIP_DEPLOY=1 to avoid running deployments in CI/local checks
if (process.env.SKIP_DEPLOY) {
    console.log("SKIP_DEPLOY is set — aborting deployment script.");
    process.exit(0);
}

// Helper to write data to a temporary file
function writeToTmpFile(filename, content) {
    const tmpPath = path.join("/tmp", filename);
    fs.writeFileSync(tmpPath, content);
    console.log(chalk.green(`   ✅ Data written to: ${tmpPath}`));
}

async function main() {
    console.log(chalk.blue.bold("🚀 Deploying Oqia Protocol with Oqia-Native Wallets..."));
    const [deployer] = await ethers.getSigners();
    console.log(chalk.cyan("👤 Deployer account:"), deployer.address);
    console.log(chalk.gray("----------------------------------------------------"));

    // 1. Deploy the master OqiaAgentWallet implementation contract
    console.log(chalk.yellow("\n1. Deploying OqiaAgentWallet implementation..."));
    const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
    const agentWalletImplementation = await OqiaAgentWallet.deploy();
    await agentWalletImplementation.waitForDeployment();
    console.log(chalk.green("   ✅ OqiaAgentWallet implementation deployed to:"), chalk.bold(agentWalletImplementation.target));

    // 2. Deploy the refactored OqiaBotFactory (as a UUPS proxy)
    console.log(chalk.yellow("\n2. Deploying OqiaBotFactory..."));
    const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    const factoryProxy = await upgrades.deployProxy(
        OqiaBotFactory,
        [agentWalletImplementation.target], // Pass implementation address to initializer
        { initializer: "initialize", kind: "uups" }
    );
    await factoryProxy.waitForDeployment();
    console.log(chalk.green("   ✅ OqiaBotFactory (Proxy) deployed to:"), chalk.bold(factoryProxy.target));

    // 3. Write the factory address to a temporary file
    console.log(chalk.blue.bold("\n🔄 Writing factory address to temporary file..."));
    writeToTmpFile("factory-address.tmp", factoryProxy.target);

    console.log(chalk.green.bold("\n🎉🎉🎉 Refactor deployment complete! 🎉🎉🎉"));
    console.log(chalk.white("You are now unblocked and ready to complete your final tests."));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
