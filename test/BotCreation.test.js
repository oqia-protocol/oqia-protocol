const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Bot Creation", function () {
    let OqiaBotFactory, OqiaAgentWallet, factoryProxy, agentWalletImplementation, owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();

        OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
        factoryProxy = await upgrades.deployProxy(
            OqiaBotFactory,
            [agentWalletImplementation.target],
            { initializer: "initialize", kind: "uups" }
        );
        await factoryProxy.waitForDeployment();
    });

    it("Should emit a BotCreated event when a new bot is created", async function () {
        const botOwner = owner.address;
        await expect(factoryProxy.createBot(botOwner))
            .to.emit(factoryProxy, "BotCreated");
    });
});