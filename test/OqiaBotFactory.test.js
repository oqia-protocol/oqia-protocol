const { expect } = require("chai");
const { upgrades } = require("hardhat");

describe("OqiaBotFactory (Refactored)", function () {
    let OqiaBotFactory, OqiaAgentWallet, factoryProxy, agentWalletImplementation, owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        // 1. Deploy the master OqiaAgentWallet implementation
        OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();

        // 2. Deploy the OqiaBotFactory proxy
        OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
        factoryProxy = await upgrades.deployProxy(
            OqiaBotFactory,
            [agentWalletImplementation.target], // New initializer with one argument
            { initializer: "initialize", kind: "uups" }
        );
        await factoryProxy.waitForDeployment();
    });

    it("Should initialize with the correct name and symbol", async function () {
        expect(await factoryProxy.name()).to.equal("Oqia Bot NFT");
        expect(await factoryProxy.symbol()).to.equal("OQIA");
    });

    it("Should set the correct agent wallet implementation address", async function () {
        expect(await factoryProxy.agentWalletImplementation()).to.equal(agentWalletImplementation.target);
    });

    it("Should allow an owner to create a new bot", async function () {
        const botOwner = owner.address;
        const tx = await factoryProxy.createBot(botOwner);
        const receipt = await tx.wait();

        // Find the event in the transaction receipt
        const event = receipt.logs.find(e => e.eventName === 'BotCreated');
        expect(event).to.not.be.undefined;

        const tokenId = event.args.tokenId;
        const walletAddress = event.args.wallet;

        expect(tokenId).to.equal(1);
        expect(await factoryProxy.ownerOf(tokenId)).to.equal(botOwner);
        expect(await factoryProxy.botWalletOf(tokenId)).to.equal(walletAddress);
        expect(await factoryProxy.tokenOfWallet(walletAddress)).to.equal(tokenId);
    });

    it("Should revert if creating a bot with a zero address owner", async function () {
        await expect(factoryProxy.createBot(ethers.ZeroAddress)).to.be.revertedWith("Invalid owner");
    });
});
