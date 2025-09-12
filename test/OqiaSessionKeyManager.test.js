const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe.skip("OqiaSessionKeyManager (Refactored)", function () {
    let sessionManager;
    let agentWallet;
    let mockTarget;
    let owner, walletOwner, sessionKey, other;

    beforeEach(async function () {
        [owner, walletOwner, sessionKey, other] = await ethers.getSigners();

        // Deploy MockTarget contract
        const MockTargetFactory = await ethers.getContractFactory("MockERC20");
        mockTarget = await MockTargetFactory.deploy("Mock Target", "MT");
        await mockTarget.waitForDeployment();

        // Deploy a single OqiaAgentWallet for the suite
        const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        agentWallet = await OqiaAgentWallet.deploy();
        await agentWallet.waitForDeployment();
        await agentWallet.initialize(walletOwner.address);

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
            validUntil = (await time.latest()) + 3600;
            const approveSelector = mockTarget.interface.getFunction("approve").selector;
            permissions = [{
                target: mockTarget.target,
                functionSelector: approveSelector
            }];

            await sessionManager.connect(walletOwner).authorizeSessionKey(
                agentWallet.target,
                sessionKey.address,
                validUntil,
                valueLimit,
                permissions,
                0, 0
            );
        });

        it("Should correctly authorize a session key with permissions", async function () {
            const sk = await sessionManager.sessionKeys(agentWallet.target);
            expect(sk.key).to.equal(sessionKey.address);

            const permissionHash = ethers.solidityPackedKeccak256(
                ["address", "address", "address", "bytes4"],
                [agentWallet.target, sessionKey.address, permissions[0].target, permissions[0].functionSelector]
            );
            expect(await sessionManager.isPermissioned(permissionHash)).to.be.true;
        });

        it("Should allow a session key to execute a permitted function call", async function () {
            // In the new model, the SessionManager must own the wallet to execute.
            await agentWallet.connect(walletOwner).transferOwnership(sessionManager.target);
            expect(await agentWallet.owner()).to.equal(sessionManager.target);

            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);

            // Now the session key can execute through the manager
            await expect(
                sessionManager.connect(sessionKey).executeTransaction(
                    agentWallet.target,
                    mockTarget.target,
                    0,
                    approveTxData
                )
            ).to.not.be.reverted;
        });

        it("Should REJECT an expired session key", async function () {
            const expiredTime = (await time.latest()) - 1;
            await sessionManager.connect(walletOwner).authorizeSessionKey(
                agentWallet.target, sessionKey.address, expiredTime, valueLimit, permissions, 0, 0
            );

            const approveTxData = mockTarget.interface.encodeFunctionData("approve", [other.address, ethers.parseEther("10")]);
            await expect(
                sessionManager.connect(sessionKey).executeTransaction(agentWallet.target, mockTarget.target, 0, approveTxData)
            ).to.be.revertedWith("Session key has expired");
        });
    });
});
