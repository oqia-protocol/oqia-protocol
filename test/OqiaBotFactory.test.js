const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaBotFactory", function () {
    let OqiaBotFactory, botFactory, owner, otherAccount;
    let agentWalletImplementation;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();

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

    describe("Supports Interface", function() {
        it("Should support the ERC721 and ERC2981 interfaces", async function () {
            const erc721InterfaceId = "0x80ac58cd";
            const erc2981InterfaceId = "0x2a55205a";
            expect(await botFactory.supportsInterface(erc721InterfaceId)).to.be.true;
            expect(await botFactory.supportsInterface(erc2981InterfaceId)).to.be.true;
        });
    });

    describe("Pausable", function() {
        it("Should pause and unpause the contract", async function () {
            const fee = await botFactory.agentCreationFee();

            await botFactory.connect(owner).pause();
            expect(await botFactory.paused()).to.be.true;

            await expect(
                botFactory.connect(owner).createBot(otherAccount.address, { value: fee })
            ).to.be.revertedWithCustomError(botFactory, "EnforcedPause");

            await expect(
                botFactory.connect(owner).mintAgent(otherAccount.address, { value: fee })
            ).to.be.revertedWithCustomError(botFactory, "EnforcedPause");

            await botFactory.connect(owner).unpause();
            expect(await botFactory.paused()).to.be.false;

            await botFactory.connect(owner).createBot(otherAccount.address, { value: fee });
            expect(await botFactory.ownerOf(1)).to.equal(otherAccount.address);
        });

        it("Should prevent non-owners from pausing or unpausing", async function () {
            await expect(botFactory.connect(otherAccount).pause())
                .to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount.address);

            await botFactory.connect(owner).pause();

            await expect(botFactory.connect(otherAccount).unpause())
                .to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount.address);
        });
    });

    describe("Upgrades", function() {
        it("Should allow the owner to upgrade the contract", async function () {
            const OqiaBotFactoryV2 = await ethers.getContractFactory("OqiaBotFactory");
            const upgradedBotFactory = await upgrades.upgradeProxy(botFactory.target, OqiaBotFactoryV2, {
                call: { fn: "reinitialize", args: [2] }
            });
            await upgradedBotFactory.waitForDeployment();

            expect(await upgradedBotFactory.version()).to.equal("2");
        });

        it("Should prevent non-owners from upgrading the contract", async function () {
            const OqiaBotFactoryV2 = await ethers.getContractFactory("OqiaBotFactory");
            await expect(
                upgrades.upgradeProxy(botFactory.target, OqiaBotFactoryV2.connect(otherAccount))
            ).to.be.revertedWithCustomError(botFactory, 'OwnableUnauthorizedAccount').withArgs(otherAccount.address);
        });
    });

    describe("Agent Minting", function () {
        it("Should mint a new agent using the legacy mintAgent function", async function () {
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
    });

    describe("createBot", function () {
        it("Should create a new bot, mint an NFT, and emit events", async function () {
            const fee = await botFactory.agentCreationFee();
            const tx = await botFactory.connect(owner).createBot(otherAccount.address, { value: fee });
            const receipt = await tx.wait();

            // Find the BotCreated event
            const botCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsedLog = botFactory.interface.parseLog(log);
                    return parsedLog.name === "BotCreated";
                } catch (e) {
                    return false;
                }
            });
            const { tokenId, owner: eventOwner, wallet: agentWalletAddress } = botCreatedEvent.args;

            // Check NFT ownership
            expect(await botFactory.ownerOf(tokenId)).to.equal(otherAccount.address);
            expect(eventOwner).to.equal(otherAccount.address);

            // Check wallet creation
            const agentWallet = await ethers.getContractAt("OqiaAgentWallet", agentWalletAddress);
            expect(await agentWallet.owner()).to.equal(otherAccount.address);
            const code = await ethers.provider.getCode(agentWalletAddress);
            expect(code).to.not.equal("0x");

            // Check mappings
            expect(await botFactory.botWalletOf(tokenId)).to.equal(agentWalletAddress);
            expect(await botFactory.tokenOfWallet(agentWalletAddress)).to.equal(tokenId);
        });

        it("Should require the correct agent creation fee and send it to the fee recipient", async function () {
            // Set a custom fee and recipient
            const fee = ethers.parseEther("0.01");
            await botFactory.connect(owner).setAgentCreationFee(fee);
            await botFactory.connect(owner).setRoyaltyInfo(otherAccount.address, 50);

            // Try creating without fee
            await expect(
                botFactory.connect(owner).createBot(otherAccount.address, { value: 0 })
            ).to.be.revertedWithCustomError(botFactory, "IncorrectFee");

            // Create with correct fee
            const recipientBalanceBefore = await ethers.provider.getBalance(otherAccount.address);
            const tx = await botFactory.connect(owner).createBot(otherAccount.address, { value: fee });
            await tx.wait();
            const recipientBalanceAfter = await ethers.provider.getBalance(otherAccount.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(fee);
        });

        it("Should revert if the owner address is the zero address", async function () {
            const fee = await botFactory.agentCreationFee();
            await expect(
                botFactory.connect(owner).createBot(ethers.ZeroAddress, { value: fee })
            ).to.be.revertedWithCustomError(botFactory, "InvalidOwner");
        });
    });

    describe("Token URI", function () {
        let tokenId;
        const fee = ethers.parseEther("0.001");

        beforeEach(async function () {
            const tx = await botFactory.connect(owner).createBot(otherAccount.address, { value: fee });
            const receipt = await tx.wait();
            const botCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsedLog = botFactory.interface.parseLog(log);
                    return parsedLog.name === "BotCreated";
                } catch (e) {
                    return false;
                }
            });
            tokenId = botCreatedEvent.args.tokenId;
        });

        it("Should return the default token URI", async function () {
            const defaultURI = await botFactory.connect(otherAccount).tokenURI(tokenId);
            const expectedURIPart = "data:application/json;base64,";
            expect(defaultURI).to.contain(expectedURIPart);
        });

        it("Should set and retrieve a custom token URI", async function () {
            const customURI = "https://example.com/token/1";
            await botFactory.connect(owner).setTokenURI(tokenId, customURI);
            expect(await botFactory.connect(otherAccount).tokenURI(tokenId)).to.equal(customURI);
        });

        it("Should prevent non-owners from setting the token URI", async function () {
            const customURI = "https://example.com/token/1";
            await expect(
                botFactory.connect(otherAccount).setTokenURI(tokenId, customURI)
            ).to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
            .withArgs(otherAccount.address);
        });
    });

    describe("Admin Functions", function () {
        describe("setAgentCreationFee", function () {
            it("Should update the agent creation fee and emit an event", async function () {
                const newFee = ethers.parseEther("0.02");
                await expect(botFactory.connect(owner).setAgentCreationFee(newFee))
                    .to.emit(botFactory, "AgentCreationFeeUpdated")
                    .withArgs(newFee);
                expect(await botFactory.agentCreationFee()).to.equal(newFee);
            });

            it("Should prevent non-owners from setting the agent creation fee", async function () {
                const newFee = ethers.parseEther("0.02");
                await expect(
                    botFactory.connect(otherAccount).setAgentCreationFee(newFee)
                ).to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount.address);
            });
        });

        describe("setRoyaltyInfo", function () {
            it("Should update the royalty info and emit an event", async function () {
                const newRecipient = otherAccount.address;
                const newBps = 1000; // 10%
                await expect(botFactory.connect(owner).setRoyaltyInfo(newRecipient, newBps))
                    .to.emit(botFactory, "RoyaltyInfoUpdated")
                    .withArgs(newRecipient, newBps);
                expect(await botFactory.feeRecipient()).to.equal(newRecipient);
                expect(await botFactory.royaltyBps()).to.equal(newBps);
            });

            it("Should prevent non-owners from setting the royalty info", async function () {
                const newRecipient = otherAccount.address;
                const newBps = 1000;
                await expect(
                    botFactory.connect(otherAccount).setRoyaltyInfo(newRecipient, newBps)
                ).to.be.revertedWithCustomError(botFactory, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount.address);
            });
        });
    });

    describe("ERC-2981 Royalty Standard", function () {
        it("Should return the correct royalty info", async function () {
            const salePrice = ethers.parseEther("1");
            const expectedRoyalty = (salePrice * 50n) / 10000n; // 0.5%
            const [recipient, royaltyAmount] = await botFactory.royaltyInfo(1, salePrice);
            expect(recipient).to.equal(owner.address);
            expect(royaltyAmount).to.equal(expectedRoyalty);
        });

        it("Should support the ERC-2981 interface", async function () {
            const erc2981InterfaceId = "0x2a55205a";
            expect(await botFactory.supportsInterface(erc2981InterfaceId)).to.be.true;
        });
    });

    describe("Security", function () {
        it("Should prevent reentrancy attacks on createBot", async function () {
            // Deploy the attacker contract
            const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
            const attacker = await Attacker.deploy(botFactory.target);
            await attacker.waitForDeployment();

            // Attempt the attack
            const fee = await botFactory.agentCreationFee();
            await expect(
                attacker.attack({ value: fee })
            ).to.be.reverted;
        });
    });
});