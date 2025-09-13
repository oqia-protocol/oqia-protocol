const { ethers } = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");

async function main() {
    console.log(chalk.blue.bold("🚀 Deploying All Oqia Protocol Contracts..."));
    const [deployer] = await ethers.getSigners();
    console.log(chalk.cyan("👤 Deployer account:"), deployer.address);
    console.log(chalk.gray("----------------------------------------------------"));

    const deployments = {};

    console.log(chalk.yellow("\n1. Deploying OqiaBotFactory..."));
    const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    const factory = await OqiaBotFactory.deploy(deployer.address);
    await factory.waitForDeployment();
    deployments.OqiaBotFactory = factory.target;
    console.log(chalk.green("   ✅ OqiaBotFactory deployed to:"), chalk.bold(deployments.OqiaBotFactory));

    console.log(chalk.yellow("\n2. Deploying OqiaModuleRegistry..."));
    const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
    const registry = await OqiaModuleRegistry.deploy("Oqia Modules", "OQM", deployer.address, deployer.address);
    await registry.waitForDeployment();
    deployments.OqiaModuleRegistry = registry.target;
    console.log(chalk.green("   ✅ OqiaModuleRegistry deployed to:"), chalk.bold(deployments.OqiaModuleRegistry));

    console.log(chalk.yellow("\n3. Deploying Mock ERC20 Tokens..."));
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const tokenA = await MockERC20.deploy("Token A", "TKA");
    await tokenA.waitForDeployment();
    deployments.MockERC20A = tokenA.target;
    console.log(chalk.green("   ✅ MockERC20A deployed to:"), chalk.bold(deployments.MockERC20A));
    const tokenB = await MockERC20.deploy("Token B", "TKB");
    await tokenB.waitForDeployment();
    deployments.MockERC20B = tokenB.target;
    console.log(chalk.green("   ✅ MockERC20B deployed to:"), chalk.bold(deployments.MockERC20B));

    console.log(chalk.yellow("\n4. Deploying MockUniswapRouter..."));
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    const mockRouter = await MockUniswapRouter.deploy();
    await mockRouter.waitForDeployment();
    deployments.MockUniswapRouter = mockRouter.target;
    console.log(chalk.green("   ✅ MockUniswapRouter deployed to:"), chalk.bold(deployments.MockUniswapRouter));

    console.log(chalk.yellow("\n5. Deploying SimpleArbitrageModule..."));
    const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
    const arbitrageModule = await SimpleArbitrageModule.deploy(deployments.MockUniswapRouter, deployments.OqiaModuleRegistry, 1);
    await arbitrageModule.waitForDeployment();
    deployments.SimpleArbitrageModule = arbitrageModule.target;
    console.log(chalk.green("   ✅ SimpleArbitrageModule deployed to:"), chalk.bold(deployments.SimpleArbitrageModule));

    console.log(chalk.yellow("\n6. Deploying OqiaSessionKeyManager..."));
    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionManager = await OqiaSessionKeyManager.deploy();
    await sessionManager.waitForDeployment();
    deployments.OqiaSessionKeyManager = sessionManager.target;
    console.log(chalk.green("   ✅ OqiaSessionKeyManager deployed to:"), chalk.bold(deployments.OqiaSessionKeyManager));

    console.log(chalk.yellow("\n7. Configuring contracts..."));
    await registry.connect(deployer).setBotFactoryAddress(deployments.OqiaBotFactory);
    console.log(chalk.green("   ✅ OqiaModuleRegistry factory address set."));

    console.log(chalk.yellow("\n8. Saving deployment addresses..."));
    fs.writeFileSync("deployed_contracts.json", JSON.stringify(deployments, null, 2));
    console.log(chalk.green("   ✅ Deployment addresses saved to deployed_contracts.json"));

    console.log(chalk.green.bold("\n🎉🎉🎉 All contracts deployed successfully! 🎉🎉🎉"));
    console.log(chalk.white(JSON.stringify(deployments, null, 2)));

    // Create a bot
    console.log(chalk.blue.bold("\n🤖 Creating a new bot..."));
    const oqiaBotFactory = await ethers.getContractAt("OqiaBotFactory", deployments.OqiaBotFactory);
    const newWallet = ethers.Wallet.createRandom();

    try {
        const tx = await oqiaBotFactory.createBot(newWallet.address);
        const receipt = await tx.wait();
        const botCreatedEvent = receipt.logs.find((e) => e.eventName === "BotCreated");

        if (botCreatedEvent) {
            const newBotAddress = botCreatedEvent.args.wallet;
            console.log(chalk.green("   ✅ Bot created successfully! Address:"), chalk.bold(newBotAddress));
            fs.writeFileSync("bot_address.txt", newBotAddress);
        } else {
            console.error(chalk.red("   Could not find BotCreated event in transaction receipt."));
        }
    } catch (error) {
        console.error(chalk.red("\n❌ Error creating bot:"), error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});