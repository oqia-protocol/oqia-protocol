const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { setBalance, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OqiaSessionKeyManager", function () {
    let factory, sessionKeyManager, agentWallet, owner, other, sessionKey;
    let agentWalletImplementation, agentWalletAddress;

    const ANY_FUNCTION = "0x00000000";

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        sessionKey = ethers.Wallet.createRandom().connect(ethers.provider);

        await setBalance(sessionKey.address, ethers.parseEther("1.0"));

        const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        agentWalletImplementation = await OqiaAgentWallet.deploy();
        await agentWalletImplementation.waitForDeployment();

        const Factory = await ethers.getContractFactory("OqiaBotFactory");
        factory = await upgrades.deployProxy(Factory, [agentWalletImplementation.target]);
        await factory.waitForDeployment();

        const SessionKeyManager = await ethers.getContractFactory("OqiaSessionKeyManager");
        sessionKeyManager = await SessionKeyManager.deploy();
        await sessionKeyManager.waitForDeployment();

        const tx = await factory.createBot(owner.address);
        const receipt = await tx.wait();
        const event = receipt.logs.find(e => factory.interface.parseLog(e)?.name === "BotCreated");
        agentWalletAddress = event.args.wallet;
        agentWallet = await ethers.getContractAt("OqiaAgentWallet", agentWalletAddress);
    });

    describe("Authorization & Revocation", function () {
        it("should allow the safe owner to authorize a session key", async function () {
            const validUntil = (await time.latest()) + 3600;
            const valueAllowance = ethers.parseEther("0.1");

            await expect(
                sessionKeyManager.connect(owner).authorizeSessionKey(
                    agentWallet.target,
                    sessionKey.address,
                    ANY_FUNCTION,
                    validUntil,
                    valueAllowance
                )
            ).to.emit(sessionKeyManager, "SessionKeyAuthorized");

            const sk = await sessionKeyManager.sessionKeys(agentWallet.target, sessionKey.address);
            expect(sk.authorized).to.be.true;
        });

        it("should prevent a non-owner from authorizing a session key", async function () {
            const validUntil = (await time.latest()) + 3600;
            await expect(
                sessionKeyManager.connect(other).authorizeSessionKey(
                    agentWallet.target,
                    sessionKey.address,
                    ANY_FUNCTION,
                    validUntil,
                    ethers.parseEther("0.1")
                )
            ).to.be.revertedWith("Caller is not the owner of the safe");
        });

        it("should allow the safe owner to revoke a session key", async function () {
            const validUntil = (await time.latest()) + 3600;
            await sessionKeyManager.connect(owner).authorizeSessionKey(agentWallet.target, sessionKey.address, ANY_FUNCTION, validUntil, 0);

            await expect(
                sessionKeyManager.connect(owner).revokeSessionKey(agentWallet.target, sessionKey.address)
            ).to.emit(sessionKeyManager, "SessionKeyRevoked");

            const sk = await sessionKeyManager.sessionKeys(agentWallet.target, sessionKey.address);
            expect(sk.authorized).to.be.false;
        });

        it("should prevent a non-owner from revoking a session key", async function () {
            const validUntil = (await time.latest()) + 3600;
            await sessionKeyManager.connect(owner).authorizeSessionKey(agentWallet.target, sessionKey.address, ANY_FUNCTION, validUntil, 0);

            await expect(
                sessionKeyManager.connect(other).revokeSessionKey(agentWallet.target, sessionKey.address)
            ).to.be.revertedWith("Caller is not the owner of the safe");
        });
    });

    describe("Transaction Execution", function () {
        beforeEach(async function () {
            const validUntil = (await time.latest()) + 3600;
            const valueAllowance = ethers.parseEther("1.0");
            await sessionKeyManager.connect(owner).authorizeSessionKey(
                agentWallet.target,
                sessionKey.address,
                ANY_FUNCTION,
                validUntil,
                valueAllowance
            );
            await setBalance(agentWallet.target, ethers.parseEther("2.0"));
        });

        it("should FAIL to execute a transaction if SessionKeyManager is not an authorized module", async function () {
            await expect(
                sessionKeyManager.connect(sessionKey).executeTransaction(agentWallet.target, other.address, ethers.parseEther("0.5"), "0x")
            ).to.be.revertedWith("Not Owner or Authorized Module");
        });

        it("should SUCCEED in executing a transaction after SessionKeyManager is authorized", async function () {
            await agentWallet.connect(owner).authorizeModule(sessionKeyManager.target, true);
            const value = ethers.parseEther("0.5");
            const otherBalanceBefore = await ethers.provider.getBalance(other.address);

            await expect(
                sessionKeyManager.connect(sessionKey).executeTransaction(agentWallet.target, other.address, value, "0x")
            ).to.emit(sessionKeyManager, "SessionKeyUsed");

            const otherBalanceAfter = await ethers.provider.getBalance(other.address);
            expect(otherBalanceAfter).to.equal(otherBalanceBefore + value);
        });

        it("should FAIL to execute if session key is expired", async function () {
            const shortLivedSk = ethers.Wallet.createRandom().connect(ethers.provider);
            await setBalance(shortLivedSk.address, ethers.parseEther("1.0"));
            await agentWallet.connect(owner).authorizeModule(sessionKeyManager.target, true);
        
            const validUntil = (await time.latest()) + 100; // Valid for 100 seconds
            await sessionKeyManager.connect(owner).authorizeSessionKey(agentWallet.target, shortLivedSk.address, ANY_FUNCTION, validUntil, 0);
        
            await time.increase(101); // Increase time to expire the key
        
            await expect(
                sessionKeyManager.connect(shortLivedSk).executeTransaction(agentWallet.target, other.address, 0, "0x")
            ).to.be.revertedWith("Session key has expired");
        });

        it("should FAIL to execute if value exceeds allowance", async function () {
            await agentWallet.connect(owner).authorizeModule(sessionKeyManager.target, true);
            const value = ethers.parseEther("1.1");

            await expect(
                sessionKeyManager.connect(sessionKey).executeTransaction(agentWallet.target, other.address, value, "0x")
            ).to.be.revertedWith("Transaction value exceeds allowance");
        });

        it("should FAIL if the function selector does not match", async function () {
            const specificFuncSk = ethers.Wallet.createRandom().connect(ethers.provider);
            await setBalance(specificFuncSk.address, ethers.parseEther("1.0"));

            const functionSelector = agentWallet.interface.getFunction("authorizeModule").selector;
            const validUntil = (await time.latest()) + 3600;
            await sessionKeyManager.connect(owner).authorizeSessionKey(
                agentWallet.target,
                specificFuncSk.address,
                functionSelector,
                validUntil,
                0
            );
            await agentWallet.connect(owner).authorizeModule(sessionKeyManager.target, true);

            await expect(
                sessionKeyManager.connect(specificFuncSk).executeTransaction(agentWallet.target, other.address, 0, "0x12345678")
            ).to.be.revertedWith("Transaction data does not match authorized function");
        });

        it("should FAIL after the session key has been revoked", async function () {
            await agentWallet.connect(owner).authorizeModule(sessionKeyManager.target, true);
            await sessionKeyManager.connect(owner).revokeSessionKey(agentWallet.target, sessionKey.address);

            await expect(
                sessionKeyManager.connect(sessionKey).executeTransaction(agentWallet.target, other.address, 0, "0x")
            ).to.be.revertedWith("Session key not authorized");
        });
    });
});
