const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SimpleArbitrageModule (Refactored)", function () {
    let simpleArbitrageModule, factory, mockRegistry, mockUniswapRouter;
    let deployer, other;
    let mockERC20A, mockERC20B; // Make tokens available to the whole suite
    const DUMMY_MODULE_ID = 1;

    before(async function () {
        [deployer, other] = await ethers.getSigners();

        // Deploy Agent Wallet Implementation
        const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        const agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();

        // Deploy Factory
        const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
        factory = await upgrades.deployProxy(OqiaBotFactory, [agentWalletImplementation.target]);
        await factory.waitForDeployment();

        // Deploy Registry and link it to the factory
        const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
        mockRegistry = await upgrades.deployProxy(OqiaModuleRegistry, ["Test", "TEST", deployer.address, deployer.address]);
        await mockRegistry.waitForDeployment();
        await mockRegistry.setBotFactoryAddress(factory.target);

        // Deploy Mock ERC20s
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        mockERC20A = await MockERC20Factory.deploy("Token A", "TKA", 0);
        await mockERC20A.waitForDeployment();
        mockERC20B = await MockERC20Factory.deploy("Token B", "TKB", 0);
        await mockERC20B.waitForDeployment();

        // Deploy Mock Uniswap Router and fund it
        const MockUniswapRouterFactory = await ethers.getContractFactory("MockUniswapRouter");
        mockUniswapRouter = await MockUniswapRouterFactory.deploy();
        await mockUniswapRouter.waitForDeployment();
        await mockERC20A.mint(mockUniswapRouter.target, ethers.parseEther("2000"));
        await mockERC20B.mint(mockUniswapRouter.target, ethers.parseEther("2000"));

        // Deploy SimpleArbitrageModule
        const SimpleArbitrageModuleFactory = await ethers.getContractFactory("SimpleArbitrageModule");
        simpleArbitrageModule = await SimpleArbitrageModuleFactory.deploy(
            mockUniswapRouter.target,
            mockRegistry.target,
            DUMMY_MODULE_ID
        );
        await simpleArbitrageModule.waitForDeployment();

        // Register the module
        await mockRegistry.registerModule(
            simpleArbitrageModule.target,
            deployer.address,
            ethers.parseEther("0.01"),
            500,
            "ipfs://test"
        );
    });

    it("Should execute a trade successfully WHEN LICENSED", async function () {
        // 1. Create a new bot wallet via the factory, owned by 'other' signer
        const tx = await factory.createBot(other.address);
        const receipt = await tx.wait();
        const event = receipt.logs.find(e => e.eventName === "BotCreated");
        const agentWalletAddress = event.args.wallet;
        const agentWallet = await ethers.getContractAt("OqiaAgentWallet", agentWalletAddress);

        // 2. Mint a license for the bot's owner
        await mockRegistry.connect(other).mintModuleLicense(DUMMY_MODULE_ID, other.address, { value: ethers.parseEther("0.01") });

        // 3. Fund and approve the agent wallet for the trade
        const amountIn = ethers.parseEther("100");
        await mockERC20A.mint(agentWallet.target, amountIn);

        const approveData = mockERC20A.interface.encodeFunctionData("approve", [simpleArbitrageModule.target, amountIn]);
        await agentWallet.connect(other).execute(mockERC20A.target, 0, approveData);

        // 4. Set up mock router and execute trade
        await mockUniswapRouter.setSwapResults([ethers.parseEther("90"), ethers.parseEther("105")]);

        const moduleInterface = simpleArbitrageModule.interface;
        const executeArbitrageData = moduleInterface.encodeFunctionData("executeArbitrage", [
            agentWallet.target,
            mockERC20A.target,
            mockERC20B.target,
            amountIn
        ]);

        await agentWallet.connect(other).execute(simpleArbitrageModule.target, 0, executeArbitrageData);

        // 5. Check final balance
        expect(await mockERC20A.balanceOf(agentWallet.target)).to.equal(ethers.parseEther("105"));
    });
});
