const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;

describe("End-to-End Test: Autonomous Agent Execution", function () {
    let deployer, other;
    let deployments;

    before(async function () {
        this.timeout(120000);
        [deployer] = await ethers.getSigners();

        deployments = {};

        const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        const agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();
        deployments.OqiaAgentWallet = agentWalletImplementation.target;

        const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
        const factoryProxy = await upgrades.deployProxy(OqiaBotFactory, [deployments.OqiaAgentWallet]);
        await factoryProxy.waitForDeployment();
        deployments.OqiaBotFactory = factoryProxy.target;

        const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
        const registryProxy = await upgrades.deployProxy(OqiaModuleRegistry, ["Test", "TEST", deployer.address]);
        await registryProxy.waitForDeployment();
        deployments.OqiaModuleRegistry = registryProxy.target;
        await registryProxy.connect(deployer).setBotFactoryAddress(deployments.OqiaBotFactory);

        const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
        const mockRouter = await MockUniswapRouter.deploy();
        await mockRouter.waitForDeployment();
        deployments.MockUniswapRouter = mockRouter.target;

        const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
        const arbitrageModule = await SimpleArbitrageModule.deploy(deployments.MockUniswapRouter, deployments.OqiaModuleRegistry, 1);
        await arbitrageModule.waitForDeployment();
        deployments.SimpleArbitrageModule = arbitrageModule.target;

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const tokenA = await MockERC20.deploy("Token A", "TKA");
        await tokenA.waitForDeployment();
        deployments.MockERC20A = tokenA.target;
        const tokenB = await MockERC20.deploy("Token B", "TKB");
        await tokenB.waitForDeployment();
        deployments.MockERC20B = tokenB.target;

    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionManager = await OqiaSessionKeyManager.deploy();
        await sessionManager.waitForDeployment();
        deployments.OqiaSessionKeyManager = sessionManager.target;
    });

    it("should successfully run the full flow: mint, authorize, and execute an autonomous trade", async function () {
        this.timeout(60000);

        // 1. Mint a bot
        const factory = await ethers.getContractAt("OqiaBotFactory", deployments.OqiaBotFactory);
        const tx = await factory.connect(deployer).createBot(deployer.address);
        const receipt = await tx.wait();

        const botCreatedEventTopic = factory.interface.getEvent("BotCreated").topicHash;
        const eventLog = receipt.logs.find(log => log.topics[0] === botCreatedEventTopic);
        expect(eventLog, "BotCreated event log not found").to.not.be.undefined;

        const event = factory.interface.parseLog(eventLog);
        expect(event, "BotCreated event not parsed").to.not.be.undefined;

        const botAddress = event.args.wallet;
        const tokenId = event.args.tokenId;

        // Use getContractFactory and attach as an alternative to getContractAt
        const agentWalletFactory = await ethers.getContractFactory("OqiaAgentWallet");
        const agentWallet = agentWalletFactory.attach(botAddress);

        // 2. Fund the bot wallet with tokens
        const mockERC20A = await ethers.getContractAt("MockERC20", deployments.MockERC20A);
        await mockERC20A.connect(deployer).mint(botAddress, ethers.parseEther("10"));

        // 3. Configure the mock router
        const mockRouter = await ethers.getContractAt("MockUniswapRouter", deployments.MockUniswapRouter);
        await mockRouter.setSwapResults([ethers.parseEther("0.5"), ethers.parseEther("10.5")]);

        // 4. Register the module and mint a license
        const registry = await ethers.getContractAt("OqiaModuleRegistry", deployments.OqiaModuleRegistry);
        await registry.connect(deployer).registerModule(deployments.SimpleArbitrageModule, deployer.address, 0, 0, "uri");
        await registry.connect(deployer).mintModuleLicense(1, deployer.address);

        // 5. Authorize a session key
        const sessionKey = ethers.Wallet.createRandom();
        const sessionManager = await ethers.getContractAt("OqiaSessionKeyManager", deployments.OqiaSessionKeyManager);
        const moduleInterface = new ethers.Interface((await hre.artifacts.readArtifact("SimpleArbitrageModule")).abi);
        // The deployed SessionKeyManager uses authorizeSessionKey(safe, sessionKey, validUntil, valueLimit)
        const validUntil = Math.floor(Date.now() / 1000) + 3600;
        await sessionManager.connect(deployer).authorizeSessionKey(botAddress, sessionKey.address, validUntil, ethers.parseEther("100"));

        // 6. Approve the module from the agent wallet
        await agentWallet.connect(deployer).approveModule(deployments.MockERC20A, deployments.SimpleArbitrageModule, ethers.MaxUint256);

        // 7. Transfer ownership to the session manager
        await agentWallet.connect(deployer).transferOwnership(deployments.OqiaSessionKeyManager);

        // 8. Fund the session key with ETH for gas
        await deployer.sendTransaction({ to: sessionKey.address, value: ethers.parseEther("1.0") });

        // 9. Execute the trade autonomously using the session key
        const sessionKeySigner = sessionKey.connect(ethers.provider);
        const txAutonomous = await sessionManager.connect(sessionKeySigner).executeTransaction(
            botAddress,
            deployments.SimpleArbitrageModule,
            0,
            moduleInterface.encodeFunctionData("executeArbitrage", [botAddress, deployments.MockERC20A, deployments.MockERC20B, ethers.parseEther("1")])
        );

        const finalReceipt = await txAutonomous.wait();

        // 10. Assertions
        expect(finalReceipt.hash).to.be.a("string");
        expect(finalReceipt.status).to.equal(1);

        console.log(`\n✅ E2E TEST PASSED! Autonomous transaction hash: ${finalReceipt.hash}`);
    });
});
