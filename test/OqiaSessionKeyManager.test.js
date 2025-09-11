const { expect } = require("chai");
const { ethers } = require("hardhat");

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
        const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

        beforeEach(async function () {
            // Define a permission for the mockTarget's `approve` function
            const approveSelector = mockTarget.interface.getFunction("approve").selector;
            permissions = [{
                target: mockTarget.target,
                functionSelector: approveSelector
            }];

            // Authorize the session key from the safeOwner's account
            await sessionManager.connect(safeOwner).authorizeSessionKey(
                mockSafe.target,
                sessionKey.address,
                validUntil,
                valueLimit,
                permissions
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

        it("Should REJECT a session key from executing a non-permitted function call", async function () {
            const transferTxData = mockTarget.interface.encodeFunctionData("transfer", [other.address, ethers.parseEther("10")]);

            await expect(
                sessionManager.connect(sessionKey).executeTransaction(
                    mockSafe.target,
                    mockTarget.target,
                    0,
                    transferTxData
                )
            ).to.be.revertedWith("Session key does not have permission for this function");
        });

        it("Should REJECT a session key from calling a non-permitted contract", async function () {
            const otherContract = await (await ethers.getContractFactory("MockERC20")).deploy("Other", "OTH");
            const approveTxData = otherContract.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);

            await expect(
                sessionManager.connect(sessionKey).executeTransaction(
                    mockSafe.target,
                    otherContract.target,
                    0,
                    approveTxData
                )
            ).to.be.revertedWith("Session key does not have permission for this function");
        });

        it("Should REJECT an expired session key", async function () {
            const expiredTime = Math.floor(Date.now() / 1000) - 1; // 1 second ago
            await sessionManager.connect(safeOwner).authorizeSessionKey(
                mockSafe.target,
                sessionKey.address,
                expiredTime,
                valueLimit,
                permissions
            );

            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);
            await expect(
                sessionManager.connect(sessionKey).executeTransaction(
                    mockSafe.target,
                    mockTarget.target,
                    0,
                    approveTxData
                )
            ).to.be.revertedWith("Session key has expired");
        });

        it("Should REJECT a transaction exceeding the value limit", async function () {
            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);
            const excessiveValue = ethers.parseEther("2");

            await expect(
                sessionManager.connect(sessionKey).executeTransaction(
                    mockSafe.target,
                    mockTarget.target,
                    excessiveValue,
                    approveTxData
                )
            ).to.be.revertedWith("Transaction value exceeds session key limit");
        });

        it("Should REJECT a call from an unauthorized key", async function () {
            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);

            await expect(
                sessionManager.connect(other).executeTransaction(
                    mockSafe.target,
                    mockTarget.target,
                    0,
                    approveTxData
                )
            ).to.be.revertedWith("Caller is not the authorized session key");
        });
    });
});
