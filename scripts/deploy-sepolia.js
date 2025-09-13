
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// --- CONFIGURATION ---
// IMPORTANT: Please update this with the official Uniswap V2 Router address on Sepolia
const UNISWAP_V2_ROUTER_SEPOLIA = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // FIXME: Update with a valid Sepolia router

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`🚀 Deploying contracts to Sepolia with account: ${deployer.address}`);

    const deployments = {};

    console.log("\n1. Deploying OqiaAgentWallet (Implementation)...");
    const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
    const agentWalletImplementation = await OqiaAgentWallet.deploy();
    await agentWalletImplementation.waitForDeployment();
    deployments.OqiaAgentWallet = agentWalletImplementation.target;
    console.log(`   ✅ Deployed to: ${deployments.OqiaAgentWallet}`);

    console.log("\n2. Deploying OqiaBotFactory (Proxy)...");
    const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    const factoryProxy = await upgrades.deployProxy(OqiaBotFactory, [deployments.OqiaAgentWallet], { initializer: "initialize", kind: "uups" });
    await factoryProxy.waitForDeployment();
    deployments.OqiaBotFactory = factoryProxy.target;
    console.log(`   ✅ Deployed to: ${deployments.OqiaBotFactory}`);

    console.log("\n3. Deploying OqiaModuleRegistry (Proxy)...");
    const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
    const moduleRegistryProxy = await upgrades.deployProxy(OqiaModuleRegistry, ["Oqia Modules", "OQIAM", deployer.address, deployer.address], { initializer: 'initialize', kind: "uups" });
    await moduleRegistryProxy.waitForDeployment();
    deployments.OqiaModuleRegistry = moduleRegistryProxy.target;
    console.log(`   ✅ Deployed to: ${deployments.OqiaModuleRegistry}`);

    console.log("\n   - Linking OqiaBotFactory to OqiaModuleRegistry...");
    await moduleRegistryProxy.setBotFactoryAddress(deployments.OqiaBotFactory);
    console.log("   ✅ Link successful.");

    // The first module registered will have ID 1. We deploy the module with this assumption.
    const expectedModuleId = 1; 

    console.log(`\n4. Deploying SimpleArbitrageModule (for Module ID: ${expectedModuleId})...`);
    const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
    const arbitrageModule = await SimpleArbitrageModule.deploy(
        UNISWAP_V2_ROUTER_SEPOLIA,
        deployments.OqiaModuleRegistry,
        expectedModuleId
    );
    await arbitrageModule.waitForDeployment();
    deployments.SimpleArbitrageModule = arbitrageModule.target;
    console.log(`   ✅ Deployed to: ${deployments.SimpleArbitrageModule}`);

    console.log("\n5. Registering SimpleArbitrageModule...");
    const registrationTx = await moduleRegistryProxy.registerModule(
        deployments.SimpleArbitrageModule,
        deployer.address, // developer
        ethers.parseEther("0.001"), // price
        500, // 5% royalty
        "ipfs://QmSimpleArbitrageModuleMetadata"
    );
    await registrationTx.wait();
    const registeredModuleId = await moduleRegistryProxy.moduleIdOfAddress(deployments.SimpleArbitrageModule);
    console.log(`   ✅ Module registered with ID: ${registeredModuleId}`);
    if (registeredModuleId != expectedModuleId) {
        console.error("   🚨 CRITICAL: Module ID mismatch! Expected ${expectedModuleId}, got ${registeredModuleId}.");
    }

    console.log("\n6. Deploying OqiaSessionKeyManager...");
    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionManager = await OqiaSessionKeyManager.deploy(deployments.OqiaBotFactory);
    await sessionManager.waitForDeployment();
    deployments.OqiaSessionKeyManager = sessionManager.target;
    console.log(`   ✅ Deployed to: ${deployments.OqiaSessionKeyManager}`);

    console.log("\n\n💾 Saving deployment addresses...");
    const deploymentsPath = path.join(__dirname, "..", "deployed_contracts_sepolia.json");
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log(`   ✅ Addresses saved to: ${deploymentsPath}`);

    console.log("\n\n🎉🎉🎉 All contracts deployed to Sepolia successfully! 🎉🎉🎉");
    console.log("NOTE: The SimpleArbitrageModule was deployed with a placeholder Uniswap Router address.");
    console.log("Please update the address in the deployment script and redeploy if needed.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

