const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("End-to-End Test: Autonomous Agent Execution", function () {
    let deployer, other;
    let deployments;
    const ANY_FUNCTION = "0x00000000";

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
        const registryProxy = await upgrades.deployProxy(OqiaModuleRegistry, ["Test", "TEST", deployer.address, deployer.address]);
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
        const tokenA = await MockERC20.deploy("Token A", "TKA", 0);
        await tokenA.waitForDeployment();
        deployments.MockERC20A = tokenA.target;
        const tokenB = await MockERC20.deploy("Token B", "TKB", 0);
        await tokenB.waitForDeployment();
        deployments.MockERC20B = tokenB.target;

    const OqiaSessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
    const sessionManager = await OqiaSessionKeyManager.deploy();
        await sessionManager.waitForDeployment();
        deployments.OqiaSessionKeyManager = sessionManager.target;
    });

    it("should successfully run the full flow: mint, authorize, and execute an autonomous trade", async function () {
        this.timeout(60000);

        const factory = await ethers.getContractAt("OqiaBotFactory", deployments.OqiaBotFactory);
        const fee = await factory.agentCreationFee();
        const tx = await factory.connect(deployer).createBot(deployer.address, { value: fee });
        const receipt = await tx.wait();
        const botCreatedEvent = receipt.logs.find(log => log.fragment && log.fragment.name === "BotCreated");
        const botAddress = botCreatedEvent.args.wallet;
        const agentWallet = await ethers.getContractAt("OqiaAgentWallet", botAddress);

        const mockERC20A = await ethers.getContractAt("MockERC20", deployments.MockERC20A);
        await mockERC20A.connect(deployer).mint(botAddress, ethers.parseEther("10"));

        const mockRouter = await ethers.getContractAt("MockUniswapRouter", deployments.MockUniswapRouter);
        await mockRouter.setSwapResults([ethers.parseEther("0.5"), ethers.parseEther("10.5")]);

        const registry = await ethers.getContractAt("OqiaModuleRegistry", deployments.OqiaModuleRegistry);
        await registry.connect(deployer).registerModule(deployments.SimpleArbitrageModule, deployer.address, 0, 0, "uri");
        await registry.connect(deployer).mintModuleLicense(1, deployer.address);

        const sessionKey = ethers.Wallet.createRandom();
        const sessionManager = await ethers.getContractAt("OqiaSessionKeyManager", deployments.OqiaSessionKeyManager);
        const validUntil = (await time.latest()) + 3600;
        await sessionManager.connect(deployer).authorizeSessionKey(botAddress, sessionKey.address, ANY_FUNCTION, validUntil, ethers.parseEther("100"));

        await agentWallet.connect(deployer).approveModule(deployments.MockERC20A, deployments.SimpleArbitrageModule, ethers.MaxUint256);
        await agentWallet.connect(deployer).authorizeModule(deployments.OqiaSessionKeyManager, true);
        await agentWallet.connect(deployer).authorizeModule(deployments.SimpleArbitrageModule, true);

        await deployer.sendTransaction({ to: sessionKey.address, value: ethers.parseEther("1.0") });

        const sessionKeySigner = sessionKey.connect(ethers.provider);
        const moduleInterface = new ethers.Interface((await hre.artifacts.readArtifact("SimpleArbitrageModule")).abi);
        const txAutonomous = await sessionManager.connect(sessionKeySigner).executeTransaction(
            botAddress,
            deployments.SimpleArbitrageModule,
            0,
            moduleInterface.encodeFunctionData("executeArbitrage", [botAddress, deployments.MockERC20A, deployments.MockERC20B, ethers.parseEther("1")])
        );

        const finalReceipt = await txAutonomous.wait();

        expect(finalReceipt.hash).to.be.a("string");
        expect(finalReceipt.status).to.equal(1);

        console.log(`\n✅ E2E TEST PASSED! Autonomous transaction hash: ${finalReceipt.hash}`);
    });
});
