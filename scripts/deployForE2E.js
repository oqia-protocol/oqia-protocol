const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

async function main() {
    console.log(chalk.blue.bold("🚀 Starting End-to-End Deployment for Autonomous Agent Test..."));
    const [deployer] = await ethers.getSigners();
    console.log(chalk.cyan("👤 Deployer account:"), deployer.address);
    console.log(chalk.gray("----------------------------------------------------"));

    const deployments = {};

    // 1. Deploy OqiaAgentWallet implementation
    console.log(chalk.yellow("\n1. Deploying OqiaAgentWallet (Implementation)..."));
    const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
    const agentWalletImplementation = await OqiaAgentWallet.deploy();
    await agentWalletImplementation.waitForDeployment();
    deployments.OqiaAgentWallet = agentWalletImplementation.target;
    console.log(chalk.green("   ✅ Deployed to:"), chalk.bold(deployments.OqiaAgentWallet));

    // 2. Deploy OqiaBotFactory
    console.log(chalk.yellow("\n2. Deploying OqiaBotFactory..."));
    const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    const factoryProxy = await upgrades.deployProxy(OqiaBotFactory, [deployments.OqiaAgentWallet]);
    await factoryProxy.waitForDeployment();
    deployments.OqiaBotFactory = factoryProxy.target;
    console.log(chalk.green("   ✅ Deployed to:"), chalk.bold(deployments.OqiaBotFactory));

    // 3. Deploy OqiaSessionKeyManager
    console.log(chalk.yellow("\n3. Deploying OqiaSessionKeyManager..."));
    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    // Pass the factory address to the constructor
    const sessionManager = await OqiaSessionKeyManager.deploy(deployments.OqiaBotFactory);
    await sessionManager.waitForDeployment();
    deployments.OqiaSessionKeyManager = sessionManager.target;
    console.log(chalk.green("   ✅ Deployed to:"), chalk.bold(deployments.OqiaSessionKeyManager));

    // 4. Deploy Mock Uniswap Router
    console.log(chalk.yellow("\n4. Deploying Mock Uniswap Router..."));
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    const mockRouter = await MockUniswapRouter.deploy();
    await mockRouter.waitForDeployment();
    deployments.MockUniswapRouter = mockRouter.target;
    console.log(chalk.green("   ✅ Deployed to:"), chalk.bold(deployments.MockUniswapRouter));

    // 5. Deploy SimpleArbitrageModule
    console.log(chalk.yellow("\n5. Deploying SimpleArbitrageModule..."));
    const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
    const arbitrageModule = await SimpleArbitrageModule.deploy(
        deployments.MockUniswapRouter,
        ethers.ZeroAddress, // Mock registry address, not needed for this E2E test
        1 // Mock module ID
    );
    await arbitrageModule.waitForDeployment();
    deployments.SimpleArbitrageModule = arbitrageModule.target;
    console.log(chalk.green("   ✅ Deployed to:"), chalk.bold(deployments.SimpleArbitrageModule));

    // 6. Write deployment addresses to DEPLOYED_CONTRACTS.md
    console.log(chalk.blue.bold("\n📝 Writing addresses to DEPLOYED_CONTRACTS.md..."));
    let content = "# Deployed Contracts (Local Testnet)\n\n";
    for (const [name, address] of Object.entries(deployments)) {
        content += `*   **${name}:** \`${address}\`\n`;
    }
    fs.writeFileSync(path.resolve(__dirname, "..", "DEPLOYED_CONTRACTS.md"), content);
    console.log(chalk.green("   ✅ DEPLOYED_CONTRACTS.md created successfully."));

    console.log(chalk.green.bold("\n🎉🎉🎉 E2E Deployment complete! 🎉🎉🎉"));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
