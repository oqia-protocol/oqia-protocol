const { ethers, upgrades } = require("hardhat");
const chalk = require("chalk");

async function main() {
    console.log(chalk.blue.bold("🚀 Deploying All Oqia Protocol Contracts..."));
    const [deployer] = await ethers.getSigners();
    console.log(chalk.cyan("👤 Deployer account:"), deployer.address);
    console.log(chalk.gray("----------------------------------------------------"));

    const deployments = {};

    // 1. Deploy OqiaAgentWallet implementation
    console.log(chalk.yellow("\n1. Deploying OqiaAgentWallet..."));
    const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
    const agentWalletImplementation = await OqiaAgentWallet.deploy();
    await agentWalletImplementation.waitForDeployment();
    deployments.OqiaAgentWallet = agentWalletImplementation.target;
    console.log(chalk.green("   ✅ OqiaAgentWallet implementation deployed to:"), chalk.bold(deployments.OqiaAgentWallet));

    // 2. Deploy OqiaBotFactory (Proxy)
    console.log(chalk.yellow("\n2. Deploying OqiaBotFactory..."));
    const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    const factoryProxy = await upgrades.deployProxy(OqiaBotFactory, [deployments.OqiaAgentWallet]);
    await factoryProxy.waitForDeployment();
    deployments.OqiaBotFactory = factoryProxy.target;
    console.log(chalk.green("   ✅ OqiaBotFactory (Proxy) deployed to:"), chalk.bold(deployments.OqiaBotFactory));

    // 3. Deploy OqiaModuleRegistry (Proxy)
    console.log(chalk.yellow("\n3. Deploying OqiaModuleRegistry..."));
    const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
    const registryProxy = await upgrades.deployProxy(OqiaModuleRegistry, ["Oqia Modules", "OQM", deployer.address]);
    await registryProxy.waitForDeployment();
    deployments.OqiaModuleRegistry = registryProxy.target;
    console.log(chalk.green("   ✅ OqiaModuleRegistry (Proxy) deployed to:"), chalk.bold(deployments.OqiaModuleRegistry));

    // 4. Deploy MockERC20 Tokens
    console.log(chalk.yellow("\n4. Deploying Mock ERC20 Tokens..."));
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const tokenA = await MockERC20.deploy("Token A", "TKA");
    await tokenA.waitForDeployment();
    deployments.MockERC20A = tokenA.target;
    console.log(chalk.green("   ✅ MockERC20A deployed to:"), chalk.bold(deployments.MockERC20A));
    const tokenB = await MockERC20.deploy("Token B", "TKB");
    await tokenB.waitForDeployment();
    deployments.MockERC20B = tokenB.target;
    console.log(chalk.green("   ✅ MockERC20B deployed to:"), chalk.bold(deployments.MockERC20B));

    // 5. Deploy MockUniswapRouter
    console.log(chalk.yellow("\n5. Deploying MockUniswapRouter..."));
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    const mockRouter = await MockUniswapRouter.deploy();
    await mockRouter.waitForDeployment();
    deployments.MockUniswapRouter = mockRouter.target;
    console.log(chalk.green("   ✅ MockUniswapRouter deployed to:"), chalk.bold(deployments.MockUniswapRouter));

    // 6. Deploy SimpleArbitrageModule
    console.log(chalk.yellow("\n6. Deploying SimpleArbitrageModule..."));
    const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
    const arbitrageModule = await SimpleArbitrageModule.deploy(deployments.MockUniswapRouter, deployments.OqiaModuleRegistry, 1);
    await arbitrageModule.waitForDeployment();
    deployments.SimpleArbitrageModule = arbitrageModule.target;
    console.log(chalk.green("   ✅ SimpleArbitrageModule deployed to:"), chalk.bold(deployments.SimpleArbitrageModule));

    // 7. Deploy OqiaSessionKeyManager
    console.log(chalk.yellow("\n7. Deploying OqiaSessionKeyManager..."));
    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionManager = await OqiaSessionKeyManager.deploy();
    await sessionManager.waitForDeployment();
    deployments.OqiaSessionKeyManager = sessionManager.target;
    console.log(chalk.green("   ✅ OqiaSessionKeyManager deployed to:"), chalk.bold(deployments.OqiaSessionKeyManager));

    // 8. Configure contracts
    console.log(chalk.yellow("\n8. Configuring contracts..."));
    await registryProxy.connect(deployer).setBotFactoryAddress(deployments.OqiaBotFactory);
    console.log(chalk.green("   ✅ OqiaModuleRegistry factory address set."));

    console.log(chalk.green.bold("\n🎉🎉🎉 All contracts deployed successfully! 🎉🎉🎉"));
    console.log(chalk.white(JSON.stringify(deployments, null, 2)));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
