const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;

describe("Simple Interaction Test", function () {
    let deployer;
    let agentWallet;
    let module;
    let token;

    before(async function () {
        [deployer] = await ethers.getSigners();

        // Deploy Mock ERC20
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        token = await MockERC20.deploy("Token A", "TKA");
        await token.waitForDeployment();

    // Deploy OqiaAgentWallet as an upgradeable proxy using initializer(initialOwner)
    const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
    agentWallet = await upgrades.deployProxy(OqiaAgentWallet, [deployer.address], { initializer: "initialize", kind: "uups" });
    await agentWallet.waitForDeployment();

        // Deploy SimpleArbitrageModule with dummy addresses for dependencies
        const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
        const mockRegistry = await (await ethers.getContractFactory("OqiaModuleRegistry")).deploy();
        await mockRegistry.waitForDeployment();
        // initialize the registry if it uses an initializer
        try {
            await mockRegistry.initialize("Test", "TEST", deployer.address);
        } catch (e) {
            // ignore if initialize is not available
        }

        module = await SimpleArbitrageModule.deploy(ethers.ZeroAddress, mockRegistry.target, 1);
        await module.waitForDeployment();
    });

    it("should allow module to transferFrom wallet after approval", async function () {
        // 1. Mint tokens to the agent wallet
        await token.connect(deployer).mint(agentWallet.target, ethers.parseEther("10"));

        // 2. Approve the module from the agent wallet
        await agentWallet.connect(deployer).approveModule(token.target, module.target, ethers.MaxUint256);

        // 3. Have the wallet execute the arbitrage call
        // We need to bypass the requiresLicense check for this isolated test.
        // For now, we expect this to fail, but we want to see the specific error.
        const moduleInterface = new ethers.Interface((await hre.artifacts.readArtifact("SimpleArbitrageModule")).abi);
        const arbitrageCalldata = moduleInterface.encodeFunctionData("executeArbitrage", [agentWallet.target, token.target, ethers.ZeroAddress, ethers.parseEther("1")]);

        const registryAddress = await module.moduleRegistry();
        const registry = await ethers.getContractAt("OqiaModuleRegistry", registryAddress);
        const factoryAddress = await registry.oqiaBotFactory();
        console.log("Factory address in mock registry:", factoryAddress);

        // We expect this to succeed, against our initial hypothesis.
        await expect(
            agentWallet.connect(deployer).execute(module.target, 0, arbitrageCalldata)
        ).to.not.be.reverted;
    });
});
