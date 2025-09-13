const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaAgentWallet", function () {
    let OqiaAgentWallet, wallet, owner, otherAccount, moduleAccount;

    beforeEach(async function () {
        [owner, otherAccount, moduleAccount] = await ethers.getSigners();

        // Deploy the OqiaAgentWallet contract
        OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        wallet = await upgrades.deployProxy(OqiaAgentWallet, [owner.address], { initializer: 'initialize' });
        await wallet.waitForDeployment();
    });

    it("Should allow the owner to authorize a module", async function () {
        await expect(wallet.connect(owner).authorizeModule(moduleAccount.address, true))
            .to.emit(wallet, "ModuleAuthorized")
            .withArgs(moduleAccount.address, true);

        expect(await wallet.authorizedModules(moduleAccount.address)).to.equal(true);
    });

    it("Should prevent non-owners from authorizing a module", async function () {
        await expect(wallet.connect(otherAccount).authorizeModule(moduleAccount.address, true))
            .to.be.revertedWithCustomError(wallet, "OwnableUnauthorizedAccount")
            .withArgs(otherAccount.address);
    });

    it("Should allow the owner to deauthorize a module", async function () {
        await wallet.connect(owner).authorizeModule(moduleAccount.address, true);

        await expect(wallet.connect(owner).authorizeModule(moduleAccount.address, false))
            .to.emit(wallet, "ModuleAuthorized")
            .withArgs(moduleAccount.address, false);

        expect(await wallet.authorizedModules(moduleAccount.address)).to.equal(false);
    });

    it("Should execute a call through a module", async function () {
        // Authorize the module account
        await wallet.connect(owner).authorizeModule(moduleAccount.address, true);

        const to = otherAccount.address;
        const value = ethers.parseEther("1.0");
        const data = "0x";

        // Fund the wallet
        await owner.sendTransaction({ to: wallet.target, value: value });
        const initialBalance = await ethers.provider.getBalance(to);

        // The module account calls execute on the wallet
        await wallet.connect(moduleAccount).execute(to, value, data);

        const finalBalance = await ethers.provider.getBalance(to);
        expect(finalBalance - initialBalance).to.equal(value);
    });

    it("Should allow the owner to execute a call", async function () {
        const to = otherAccount.address;
        const value = ethers.parseEther("1.0");
        const data = "0x";

        await owner.sendTransaction({ to: wallet.target, value: value });

        const initialBalance = await ethers.provider.getBalance(to);
        // The owner calls execute on the wallet
        await wallet.connect(owner).execute(to, value, data);
        const finalBalance = await ethers.provider.getBalance(to);

        expect(finalBalance - initialBalance).to.equal(value);
    });
});
