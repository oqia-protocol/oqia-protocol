const { expect } = require("chai");
const { upgrades, ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("OqiaModuleRegistry", function () {
    async function deployRegistryFixture() {
        const [owner, developer, user1, user2, protocolTreasury] = await ethers.getSigners();

        const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
        const registryProxy = await upgrades.deployProxy(
            OqiaModuleRegistry,
            ["Oqia Module License", "OML", protocolTreasury.address],
            { initializer: "initialize", kind: "uups" }
        );
        await registryProxy.waitForDeployment();

        return { registryProxy, owner, developer, user1, user2, protocolTreasury };
    }

    describe("Deployment and Initialization", function () {
        it("Should set the correct name, symbol, and protocol treasury", async function () {
            const { registryProxy, protocolTreasury } = await loadFixture(deployRegistryFixture);
            expect(await registryProxy.name()).to.equal("Oqia Module License");
            expect(await registryProxy.symbol()).to.equal("OML");
            expect(await registryProxy.protocolTreasury()).to.equal(protocolTreasury.address);
        });

        it("Should set the deployer as the owner", async function () {
            const { registryProxy, owner } = await loadFixture(deployRegistryFixture);
            expect(await registryProxy.owner()).to.equal(owner.address);
        });
    });

    describe("Module Registration", function () {
        let registryProxy, owner, developer, user1;
        const moduleAddress = "0x1234567890123456789012345678901234567890";
        const metadataURI = "ipfs://module1";
        const price = ethers.parseEther("0.1");
        const royaltyBps = 500; // 5%

        beforeEach(async function () {
            ({ registryProxy, owner, developer, user1 } = await loadFixture(deployRegistryFixture));
        });

        it("Should allow the owner to register a module", async function () {
            await expect(registryProxy.connect(owner).registerModule(moduleAddress, developer.address, price, royaltyBps, metadataURI))
                .to.emit(registryProxy, "ModuleRegistered")
                .withArgs(1, moduleAddress, developer.address, price, metadataURI);

            const moduleInfo = await registryProxy.moduleInfoOf(1);
            expect(moduleInfo.moduleAddress).to.equal(moduleAddress);
            expect(moduleInfo.developer).to.equal(developer.address);
            expect(moduleInfo.price).to.equal(price);
            expect(moduleInfo.royaltyBps).to.equal(royaltyBps);
            expect(moduleInfo.metadataURI).to.equal(metadataURI);
            expect(await registryProxy.moduleIdOfAddress(moduleAddress)).to.equal(1);
        });

        it("Should not allow non-owners to register a module", async function () {
            await expect(
                registryProxy.connect(user1).registerModule(moduleAddress, developer.address, price, royaltyBps, metadataURI)
            ).to.be.revertedWithCustomError(registryProxy, "OwnableUnauthorizedAccount");
        });

        it("Should revert with invalid developer address", async function () {
            await expect(
                registryProxy.connect(owner).registerModule(moduleAddress, ethers.ZeroAddress, price, royaltyBps, metadataURI)
            ).to.be.revertedWithCustomError(registryProxy, "InvalidDeveloperAddress");
        });
    });

    describe("Module License Minting and Economics", function () {
        let registryProxy, developer, user1, user2, protocolTreasury;
        const moduleAddress = "0x1234567890123456789012345678901234567890";
        const metadataURI = "ipfs://module1";
        const price = ethers.parseEther("1.0");
        const royaltyBps = 500; // 5%
        const moduleId = 1;

        beforeEach(async function () {
            ({ registryProxy, developer, user1, user2, protocolTreasury } = await loadFixture(deployRegistryFixture));
            await registryProxy.registerModule(moduleAddress, developer.address, price, royaltyBps, metadataURI);
        });

        it("Should allow a user to mint a license by sending the correct price", async function () {
            await expect(registryProxy.connect(user1).mintModuleLicense(moduleId, user1.address, { value: price }))
                .to.emit(registryProxy, "ModuleLicenseMinted")
                .withArgs(moduleId, 1, user1.address, price);

            expect(await registryProxy.ownerOf(1)).to.equal(user1.address);
            expect(await registryProxy.balanceOf(user1.address)).to.equal(1);
            expect(await registryProxy.licenseIdToModuleId(1)).to.equal(moduleId);
        });

        it("Should revert if the payment amount is incorrect", async function () {
            const incorrectPrice = ethers.parseEther("0.5");
            await expect(
                registryProxy.connect(user1).mintModuleLicense(moduleId, user1.address, { value: incorrectPrice })
            ).to.be.revertedWithCustomError(registryProxy, "IncorrectPayment");
        });

        it("Should distribute funds correctly between developer and treasury", async function () {
            const platformFeeBps = await registryProxy.PLATFORM_FEE_BPS();
            const expectedPlatformFee = (price * platformFeeBps) / 10000n;
            const expectedDeveloperShare = price - expectedPlatformFee;

            await expect(
                registryProxy.connect(user1).mintModuleLicense(moduleId, user1.address, { value: price })
            ).to.changeEtherBalances(
                [protocolTreasury, developer],
                [expectedPlatformFee, expectedDeveloperShare]
            );
        });

        it("Should allow minting multiple licenses for the same module", async function () {
            // User 1 mints license 1
            await registryProxy.connect(user1).mintModuleLicense(moduleId, user1.address, { value: price });
            expect(await registryProxy.ownerOf(1)).to.equal(user1.address);

            // User 2 mints license 2
            await registryProxy.connect(user2).mintModuleLicense(moduleId, user2.address, { value: price });
            expect(await registryProxy.ownerOf(2)).to.equal(user2.address);

            expect(await registryProxy.balanceOf(user1.address)).to.equal(1);
            expect(await registryProxy.balanceOf(user2.address)).to.equal(1);
        });

        it("Should return the correct token URI for a license", async function () {
            await registryProxy.connect(user1).mintModuleLicense(moduleId, user1.address, { value: price });
            expect(await registryProxy.tokenURI(1)).to.equal(metadataURI);
        });

        it("Should revert when querying URI for a nonexistent token", async function () {
            await expect(registryProxy.tokenURI(999)).to.be.revertedWithCustomError(registryProxy, "ERC721NonexistentToken");
        });
    });

    describe("ERC2981 Royalties", function () {
        it("Should return the correct royalty info for a license", async function () {
            const { registryProxy, developer, user1 } = await loadFixture(deployRegistryFixture);
            const salePrice = ethers.parseEther("2.0");
            const price = ethers.parseEther("0.1");
            const royaltyBps = 500; // 5%
            const expectedRoyalty = (salePrice * BigInt(royaltyBps)) / 10000n;
            const moduleAddress = ethers.Wallet.createRandom().address;

            await registryProxy.registerModule(moduleAddress, developer.address, price, royaltyBps, "uri");
            await registryProxy.connect(user1).mintModuleLicense(1, user1.address, { value: price });

            const royaltyInfo = await registryProxy.royaltyInfo(1, salePrice);
            expect(royaltyInfo.receiver).to.equal(developer.address);
            expect(royaltyInfo.royaltyAmount).to.equal(expectedRoyalty);
        });
    });
});
