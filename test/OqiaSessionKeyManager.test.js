const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OqiaSessionKeyManager", function () {
    let OqiaSessionKeyManager, sessionManager;
    let MockSafe, mockSafe;
    let MockTarget, mockTarget;
    let owner, safeOwner, sessionKey, other;

    beforeEach(async function () {
        [owner, safeOwner, sessionKey, other] = await ethers.getSigners();

        // Deploy MockTarget contract
        const MockTargetFactory = await ethers.getContractFactory("MockERC20"); // Using MockERC20 as a target for function calls
        mockTarget = await MockTargetFactory.deploy("Mock Target", "MT");
        await mockTarget.waitForDeployment();

        // Deploy MockSafe contract with safeOwner as the owner
        const MockSafeFactory = await ethers.getContractFactory("MockSafe");
        mockSafe = await MockSafeFactory.deploy([safeOwner.address]);
        await mockSafe.waitForDeployment();

        // Deploy OqiaSessionKeyManager
        const OqiaSessionKeyManagerFactory = await ethers.getContractFactory("OqiaSessionKeyManager");
        sessionManager = await OqiaSessionKeyManagerFactory.deploy();
        await sessionManager.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the deployer as the owner", async function () {
            expect(await sessionManager.owner()).to.equal(owner.address);
        });
    });

    describe("Session Key Authorization and Execution", function () {
        let permissions;
        const valueLimit = ethers.parseEther("1");
        let validUntil;

        beforeEach(async function () {
            validUntil = (await time.latest()) + 3600; // 1 hour from now
            // Define a permission for the mockTarget's `approve` function
            const approveSelector = mockTarget.interface.getFunction("approve").selector;
            permissions = [{
                target: mockTarget.target,
                functionSelector: approveSelector
            }];

            // Authorize the session key from the safeOwner's account (no rate limit)
            await sessionManager.connect(safeOwner).authorizeSessionKey(
                mockSafe.target,
                sessionKey.address,
                validUntil,
                valueLimit,
                permissions,
                0, // rateLimitPeriodSeconds
                0  // rateLimitTxCount
            );
        });

        it("Should correctly authorize a session key with permissions", async function () {
            const sk = await sessionManager.sessionKeys(mockSafe.target);
            expect(sk.key).to.equal(sessionKey.address);
            expect(sk.validUntil).to.equal(validUntil);
            expect(sk.valueLimit).to.equal(valueLimit);

            const permissionHash = ethers.solidityPackedKeccak256(
                ["address", "address", "address", "bytes4"],
                [mockSafe.target, sessionKey.address, permissions[0].target, permissions[0].functionSelector]
            );
            expect(await sessionManager.isPermissioned(permissionHash)).to.be.true;
        });

        it("Should allow a session key to execute a permitted function call", async function () {
            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);

            await expect(
                sessionManager.connect(sessionKey).executeTransaction(
                    mockSafe.target,
                    mockTarget.target,
                    0,
                    approveTxData
                )
            ).to.emit(mockSafe, "ExecutionSuccess");
        });

        it("Should REJECT an expired session key", async function () {
            const expiredTime = (await time.latest()) - 1; // 1 second ago
            await sessionManager.connect(safeOwner).authorizeSessionKey(
                mockSafe.target, sessionKey.address, expiredTime, valueLimit, permissions, 0, 0
            );

            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);
            await expect(
                sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData)
            ).to.be.revertedWith("Session key has expired");
        });
    });

    describe("Rate Limiting", function() {
        let permissions;
        const valueLimit = ethers.parseEther("1");
        let validUntil;
        const rateLimitPeriod = 60 * 60; // 1 hour
        const rateLimitCount = 3;

        beforeEach(async function () {
            validUntil = (await time.latest()) + 3600 * 2; // 2 hours from now
            const approveSelector = mockTarget.interface.getFunction("approve").selector;
            permissions = [{ target: mockTarget.target, functionSelector: approveSelector }];

            await sessionManager.connect(safeOwner).authorizeSessionKey(
                mockSafe.target,
                sessionKey.address,
                validUntil,
                valueLimit,
                permissions,
                rateLimitPeriod,
                rateLimitCount
            );
        });

        it("Should allow transactions within the rate limit", async function() {
            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, "1"]);
            for (let i = 0; i < rateLimitCount; i++) {
                await expect(sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData))
                    .to.not.be.reverted;
            }
        });

        it("Should REJECT a transaction that exceeds the rate limit", async function() {
            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, "1"]);
             for (let i = 0; i < rateLimitCount; i++) {
                await sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData);
            }

            await expect(sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData))
                .to.be.revertedWith("Rate limit exceeded");
        });

        it("Should reset the rate limit after the period expires", async function() {
            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, "1"]);
            for (let i = 0; i < rateLimitCount; i++) {
                await sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData);
            }

            // Exceed limit
            await expect(sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData))
                .to.be.revertedWith("Rate limit exceeded");

            // Increase time to reset the period
            await time.increase(rateLimitPeriod + 1);

            // Should now be able to execute again
            await expect(sessionManager.connect(sessionKey).executeTransaction(mockSafe.target, mockTarget.target, 0, approveTxData))
                .to.not.be.reverted;

            const sk = await sessionManager.sessionKeys(mockSafe.target);
            expect(sk.txCount).to.equal(1);
        });
    });
});
