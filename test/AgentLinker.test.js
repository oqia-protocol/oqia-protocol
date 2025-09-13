const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("AgentLinker", function () {
    let agentLinker;
    let owner;
    let agentA;
    let agentB;
    let otherAccount;

    beforeEach(async function () {
        [owner, agentA, agentB, otherAccount] = await ethers.getSigners();

        const AgentLinkerFactory = await ethers.getContractFactory("AgentLinker");
        agentLinker = await upgrades.deployProxy(AgentLinkerFactory, [owner.address], { initializer: 'initialize' });
        await agentLinker.waitForDeployment();
    });

    it("Should set the right owner", async function () {
        expect(await agentLinker.owner()).to.equal(owner.address);
    });

    describe("createConnection", function () {
        it("Should create a connection between two agents", async function () {
            const connectionType = ethers.encodeBytes32String("test");
            await expect(agentLinker.createConnection(agentA.address, agentB.address, connectionType))
                .to.emit(agentLinker, "ConnectionCreated");

            const connections = await agentLinker.getAgentConnections(agentA.address);
            expect(connections.length).to.equal(1);
        });

        it("Should revert if one of the agent addresses is the zero address", async function () {
            const connectionType = ethers.encodeBytes32String("test");
            await expect(agentLinker.createConnection(ethers.ZeroAddress, agentB.address, connectionType))
                .to.be.revertedWithCustomError(agentLinker, "InvalidAgentAddress");
        });

        it("Should revert if an agent tries to connect to itself", async function () {
            const connectionType = ethers.encodeBytes32String("test");
            await expect(agentLinker.createConnection(agentA.address, agentA.address, connectionType))
                .to.be.revertedWithCustomError(agentLinker, "SelfConnectionNotAllowed");
        });
    });

    describe("toggleConnection", function () {
        let connectionId;
        const connectionType = ethers.encodeBytes32String("test");

        beforeEach(async function () {
            const tx = await agentLinker.createConnection(agentA.address, agentB.address, connectionType);
            const receipt = await tx.wait();
            const eventFragment = agentLinker.interface.getEvent("ConnectionCreated");
            const eventTopic = eventFragment.topicHash;
            const log = receipt.logs.find(l => l.topics[0] === eventTopic);
            const event = agentLinker.interface.parseLog(log);
            connectionId = event.args.connectionId;
        });

        it("Should deactivate an active connection", async function () {
            await expect(agentLinker.connect(agentA).toggleConnection(connectionId))
                .to.emit(agentLinker, "ConnectionDeactivated");

            const connection = await agentLinker.connections(connectionId);
            expect(connection.isActive).to.be.false;
        });

        it("Should activate an inactive connection", async function () {
            await agentLinker.connect(agentB).toggleConnection(connectionId);
            await expect(agentLinker.connect(agentA).toggleConnection(connectionId))
                .to.emit(agentLinker, "ConnectionActivated");

            const connection = await agentLinker.connections(connectionId);
            expect(connection.isActive).to.be.true;
        });

        it("Should revert if the connection does not exist", async function () {
            const invalidConnectionId = ethers.encodeBytes32String("invalid");
            await expect(agentLinker.toggleConnection(invalidConnectionId))
                .to.be.revertedWithCustomError(agentLinker, "ConnectionDoesNotExist");
        });

        it("Should revert if a non-participant tries to toggle the connection", async function () {
            await expect(agentLinker.connect(otherAccount).toggleConnection(connectionId))
                .to.be.revertedWithCustomError(agentLinker, "UnauthorizedToggler");
        });
    });

    describe("getAgentConnections", function () {
        const connectionType = ethers.encodeBytes32String("test");

        it("Should return all connection IDs for a given agent", async function () {
            await agentLinker.createConnection(agentA.address, agentB.address, connectionType);

            const agentAConnections = await agentLinker.getAgentConnections(agentA.address);
            expect(agentAConnections.length).to.equal(1);

            const agentBConnections = await agentLinker.getAgentConnections(agentB.address);
            expect(agentBConnections.length).to.equal(1);

            expect(agentAConnections[0]).to.equal(agentBConnections[0]);
        });

        it("Should return an empty array for an agent with no connections", async function () {
            const connections = await agentLinker.getAgentConnections(otherAccount.address);
            expect(connections.length).to.equal(0);
        });
    });
});