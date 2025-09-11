const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaModuleRegistry", function () {
    let OqiaModuleRegistry;
    let registryProxy;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
        registryProxy = await upgrades.deployProxy(
            OqiaModuleRegistry,
            ["Oqia Module License", "OML"],
            { initializer: "initialize", kind: "uups" }
        );
        await registryProxy.waitForDeployment();
    });

    describe("Deployment and Initialization", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await registryProxy.name()).to.equal("Oqia Module License");
            expect(await registryProxy.symbol()).to.equal("OML");
        });

        it("Should set the deployer as the owner", async function () {
            expect(await registryProxy.owner()).to.equal(owner.address);
        });
    });

    describe("Module Registration", function () {
        it("Should allow the owner to register a module", async function () {
            const moduleAddress = addr1.address;
            const metadataURI = "ipfs://module1";

            await expect(registryProxy.registerModule(moduleAddress, metadataURI))
                .to.emit(registryProxy, "ModuleRegistered")
                .withArgs(1, moduleAddress, owner.address, metadataURI);

            expect(await registryProxy.moduleAddressOf(1)).to.equal(moduleAddress);
            expect(await registryProxy.moduleIdOfAddress(moduleAddress)).to.equal(1);
      
        });

        it("Should not allow non-owners to register a module", async function () {
            const moduleAddress = addr1.address;
            const metadataURI = "ipfs://module1";

            await expect(
                registryProxy.connect(addr1).registerModule(moduleAddress, metadataURI)
            ).to.be.revertedWithCustomError(registryProxy, "OwnableUnauthorizedAccount");
        });

        it("Should not allow registering a module with address zero", async function () {
            const moduleAddress = ethers.ZeroAddress;
            const metadataURI = "ipfs://module1";

            await expect(
                registryProxy.registerModule(moduleAddress, metadataURI)
            ).to.be.revertedWithCustomError(registryProxy, "InvalidModuleAddress");
        });

        it("Should not allow registering the same module twice", async function () {
            const moduleAddress = addr1.address;
            const metadataURI = "ipfs://module1";

            await registryProxy.registerModule(moduleAddress, metadataURI);

            await expect(
                registryProxy.registerModule(moduleAddress, metadataURI)
            ).to.be.revertedWithCustomError(registryProxy, "ModuleAlreadyRegistered");
        });
    });

    describe("Module License Minting", function () {
        beforeEach(async function () {
            const moduleAddress = addr1.address;
            const metadataURI = "ipfs://module1";
            await registryProxy.registerModule(moduleAddress, metadataURI);
        });

        it("Should allow the owner to mint a module license", async function () {
            const moduleId = 1;
            const to = addr2.address;

            await expect(registryProxy.mintModuleLicense(moduleId, to))
                .to.emit(registryProxy, "ModuleLicenseMinted")
                .withArgs(moduleId, to, moduleId);

            expect(await registryProxy.ownerOf(moduleId)).to.equal(to);
            expect(await registryProxy.balanceOf(to)).to.equal(1);
        });

        it("Should not allow non-owners to mint a module license", async function () {
            const moduleId = 1;
            const to = addr2.address;

            await expect(
                registryProxy.connect(addr1).mintModuleLicense(moduleId, to)
            ).to.be.revertedWithCustomError(registryProxy, "OwnableUnauthorizedAccount");
        });

        it("Should not allow minting a license for a nonexistent module", async function () {
            const nonexistentModuleId = 99;
            const to = addr2.address;

            await expect(
                registryProxy.mintModuleLicense(nonexistentModuleId, to)
            ).to.be.revertedWithCustomError(registryProxy, "ModuleNotRegistered");
        });

        it("Should not allow minting a license to address zero", async function () {
            const moduleId = 1;
            const to = ethers.ZeroAddress;

            await expect(
                registryProxy.mintModuleLicense(moduleId, to)
            ).to.be.revertedWithCustomError(registryProxy, "InvalidModuleOwner");
        });
    });

    describe("Pausable", function () {
        it("Should allow owner to pause and unpause", async function () {
            await registryProxy.pause();
            expect(await registryProxy.paused()).to.be.true;

            await expect(
                registryProxy.registerModule(addr1.address, "ipfs://paused")
            ).to.be.revertedWithCustomError(registryProxy, "EnforcedPause");

            await registryProxy.unpause();
            expect(await registryProxy.paused()).to.be.false;

            await expect(registryProxy.registerModule(addr1.address, "ipfs://unpaused"))
                .to.not.be.reverted;
        });

        it("Should not allow non-owner to pause or unpause", async function () {
            await expect(registryProxy.connect(addr1).pause()).to.be.revertedWithCustomError(
                registryProxy, "OwnableUnauthorizedAccount"
            );
            await expect(registryProxy.connect(addr1).unpause()).to.be.revertedWithCustomError(
                registryProxy, "OwnableUnauthorizedAccount"
            );
        });
    });

    describe("UUPS Upgradability", function () {
        it("Should allow owner to upgrade the contract", async function () {
            const OqiaModuleRegistryV2 = await ethers.getContractFactory("OqiaModuleRegistry");
            const upgradedRegistry = await upgrades.upgradeProxy(registryProxy.target, OqiaModuleRegistryV2);
            await upgradedRegistry.waitForDeployment();
            expect(upgradedRegistry.target).to.equal(registryProxy.target);
        });

        it("Should not allow non-owner to upgrade the contract", async function () {
            const OqiaModuleRegistryV2 = await ethers.getContractFactory("OqiaModuleRegistry");
            await expect(
                upgrades.upgradeProxy(registryProxy.target, OqiaModuleRegistryV2.connect(addr1))
            ).to.be.revertedWithCustomError(registryProxy, "OwnableUnauthorizedAccount");
        });
    });
});