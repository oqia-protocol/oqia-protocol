const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaAgentWallet", function () {
    let OqiaAgentWallet, wallet, EmptyModule, emptyModule, owner, otherAccount;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        // Deploy the OqiaAgentWallet contract
        OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        wallet = await upgrades.deployProxy(OqiaAgentWallet, [owner.address], { initializer: 'initialize' });
        await wallet.waitForDeployment();

        // Deploy the EmptyModule contract
        EmptyModule = await ethers.getContractFactory("EmptyModule");
        emptyModule = await EmptyModule.deploy();
        await emptyModule.waitForDeployment();
    });

    it("Should allow the owner to install a module", async function () {
        const signature = ethers.id("test()").substring(0, 10);
        await expect(wallet.connect(owner).installModule(signature, emptyModule.target))
            .to.emit(wallet, "ModuleInstalled")
            .withArgs(signature, emptyModule.target);

        expect(await wallet.installedModules(signature)).to.equal(emptyModule.target);
    });

    it("Should prevent non-owners from installing a module", async function () {
        const signature = ethers.id("test()").substring(0, 10);
        await expect(wallet.connect(otherAccount).installModule(signature, emptyModule.target))
            .to.be.revertedWithCustomError(wallet, "OwnableUnauthorizedAccount")
            .withArgs(otherAccount.address);
    });

    it("Should allow the owner to uninstall a module", async function () {
        const signature = ethers.id("test()").substring(0, 10);
        await wallet.connect(owner).installModule(signature, emptyModule.target);

        await expect(wallet.connect(owner).uninstallModule(signature))
            .to.emit(wallet, "ModuleUninstalled")
            .withArgs(signature);

        expect(await wallet.installedModules(signature)).to.equal(ethers.ZeroAddress);
    });

    it("Should execute a call through a module", async function () {
        const signature = ethers.id("test()").substring(0, 10);
        await wallet.connect(owner).installModule(signature, emptyModule.target);

        const data = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["hello"]);
        const result = await wallet.connect(otherAccount).executeModule.staticCall(signature, data);

        // The EmptyModule returns an empty string
        expect(result).to.equal("0x");
    });

    it("Should allow the owner to execute a call", async function () {
        const to = otherAccount.address;
        const value = ethers.parseEther("1.0");
        const data = "0x";

        await owner.sendTransaction({ to: wallet.target, value: value });

        const initialBalance = await ethers.provider.getBalance(to);
        await wallet.connect(owner).executeCall(to, value, data);
        const finalBalance = await ethers.provider.getBalance(to);

        expect(finalBalance - initialBalance).to.equal(value);
    });
});
