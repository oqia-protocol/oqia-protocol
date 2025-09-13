const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaBotFactory", function () {
    let OqiaBotFactory, botFactory, owner, otherAccount;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        // Deploy the OqiaBotFactory contract as a proxy
        OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
        botFactory = await upgrades.deployProxy(OqiaBotFactory, ["OqiaBot", "OQB", owner.address], { kind: 'uups' });
        await botFactory.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await botFactory.owner()).to.equal(owner.address);
        });

        it("Should set the correct name and symbol for the ERC721 token", async function () {
            expect(await botFactory.name()).to.equal("OqiaBot");
            expect(await botFactory.symbol()).to.equal("OQB");
        });
    });

    describe("Agent Minting", function () {
        it("Should mint a new agent, create an agent wallet, and emit an event", async function () {
            const mintTx = await botFactory.connect(owner).mintAgent(otherAccount.address);
            const receipt = await mintTx.wait();

            const agentCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsedLog = botFactory.interface.parseLog(log);
                    return parsedLog.name === "AgentCreated";
                } catch (e) {
                    return false;
                }
            });

            expect(agentCreatedEvent).to.not.be.undefined;

            const { tokenId, agentWallet: agentWalletAddress, owner: eventOwner } = agentCreatedEvent.args;

            expect(await botFactory.ownerOf(tokenId)).to.equal(otherAccount.address);
            expect(eventOwner).to.equal(otherAccount.address);

            const agentWallet = await ethers.getContractAt("OqiaAgentWallet", agentWalletAddress);
            expect(await agentWallet.owner()).to.equal(otherAccount.address);

            const code = await ethers.provider.getCode(agentWalletAddress);
            expect(code).to.not.equal("0x");
        });

        it("Should prevent non-owners from minting agents", async function () {
            await expect(botFactory.connect(otherAccount).mintAgent(otherAccount.address))
                .to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount.address);
        });
    });
});
