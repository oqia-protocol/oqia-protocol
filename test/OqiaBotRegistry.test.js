const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaBotRegistry", function () {
    let OqiaBotRegistry, registry, owner, otherAccount;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        OqiaBotRegistry = await ethers.getContractFactory("OqiaBotRegistry");
        registry = await upgrades.deployProxy(OqiaBotRegistry, [owner.address], { initializer: 'initialize' });
        await registry.waitForDeployment();
    });

    it("Should allow the owner to register a bot", async function () {
        const tokenId = 1;
        await expect(registry.connect(owner).registerBot(tokenId, otherAccount.address))
            .to.emit(registry, "BotRegistered")
            .withArgs(tokenId, otherAccount.address);

        const bot = await registry.botData(tokenId);
        expect(bot.owner).to.equal(otherAccount.address);
    });

    it("Should prevent non-owners from registering a bot", async function () {
        const tokenId = 1;
        await expect(registry.connect(otherAccount).registerBot(tokenId, otherAccount.address))
            .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
            .withArgs(otherAccount.address);
    });

    it("Should allow the bot owner to set a profile", async function () {
        const tokenId = 1;
        await registry.connect(owner).registerBot(tokenId, otherAccount.address);

        const profile = "This is my bot's profile.";
        await expect(registry.connect(otherAccount).setProfile(tokenId, profile))
            .to.emit(registry, "ProfileUpdated")
            .withArgs(tokenId, profile);

        const bot = await registry.botData(tokenId);
        expect(bot.profile).to.equal(profile);
    });

    it("Should prevent non-bot-owners from setting a profile", async function () {
        const tokenId = 1;
        await registry.connect(owner).registerBot(tokenId, otherAccount.address);

        const profile = "This is an invalid profile update.";
        await expect(registry.connect(owner).setProfile(tokenId, profile))
            .to.be.revertedWith("Not the bot owner");
    });

    it("Should return the correct profile", async function () {
        const tokenId = 1;
        const profile = "Test profile";
        await registry.connect(owner).registerBot(tokenId, otherAccount.address);
        await registry.connect(otherAccount).setProfile(tokenId, profile);

        expect(await registry.getProfile(tokenId)).to.equal(profile);
    });
});
