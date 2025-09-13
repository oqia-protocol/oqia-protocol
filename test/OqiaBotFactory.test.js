const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaBotFactory", function () {
    let OqiaBotFactory, botFactory, owner, otherAccount;
    let agentWalletImplementation;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        // Deploy the OqiaAgentWallet implementation contract
        const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();

        // Deploy the OqiaBotFactory contract as a proxy
        OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
        botFactory = await upgrades.deployProxy(OqiaBotFactory, [agentWalletImplementation.target], { kind: 'uups' });
        await botFactory.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await botFactory.owner()).to.equal(owner.address);
        });

        it("Should set the correct name and symbol for the ERC721 token", async function () {
            expect(await botFactory.name()).to.equal("Oqia Agent");
            expect(await botFactory.symbol()).to.equal("OQIA");
        });
    });

    describe("Agent Minting", function () {
        it("Should mint a new agent, create an agent wallet, and emit an event", async function () {
            const fee = await botFactory.agentCreationFee();
            const mintTx = await botFactory.connect(owner).mintAgent(otherAccount.address, { value: fee });
            const receipt = await mintTx.wait();

            const agentCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsedLog = botFactory.interface.parseLog(log);
                    return parsedLog.name === "AgentCreated";
                } catch (e) {
                    return false;
                }
            });
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

        it("Should require the correct agent creation fee and send it to the fee recipient", async function () {
            // Set a custom fee and recipient
            const fee = ethers.parseEther("0.01");
            await botFactory.connect(owner).setAgentCreationFee(fee);
            await botFactory.connect(owner).setRoyaltyInfo(otherAccount.address, 50);

            // Try minting without fee
            await expect(
                botFactory.connect(owner).createBot(otherAccount.address, { value: 0 })
            ).to.be.revertedWithCustomError(botFactory, "IncorrectFee");

            // Mint with correct fee
            const recipientBalanceBefore = await ethers.provider.getBalance(otherAccount.address);
            const tx = await botFactory.connect(owner).createBot(otherAccount.address, { value: fee });
            await tx.wait();
            const recipientBalanceAfter = await ethers.provider.getBalance(otherAccount.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(fee);
        });
        it("Should prevent non-owners from minting agents", async function () {
            await expect(botFactory.connect(otherAccount).mintAgent(otherAccount.address))
                .to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount.address);
        });
        it("Should require the correct agent creation fee and send it to the fee recipient", async function () {
            // Set a custom fee and recipient
            const fee = ethers.parseEther("0.01");
            await botFactory.connect(owner).setAgentCreationFee(fee);
            await botFactory.connect(owner).setRoyaltyInfo(otherAccount.address, 50);

            // Try minting without fee
            await expect(
                botFactory.connect(owner).createBot(otherAccount.address, { value: 0 })
            ).to.be.revertedWithCustomError(botFactory, "IncorrectFee");

            // Mint with correct fee
            const recipientBalanceBefore = await ethers.provider.getBalance(otherAccount.address);
            const tx = await botFactory.connect(owner).createBot(otherAccount.address, { value: fee });
            await tx.wait();
            const recipientBalanceAfter = await ethers.provider.getBalance(otherAccount.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(fee);
        });
    });
});
