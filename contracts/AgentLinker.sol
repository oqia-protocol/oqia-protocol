// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AgentLinker
 * @notice Enables secure agent-to-agent communication and collaboration.
 * @dev This contract manages connections between autonomous agents, allowing for collaboration, data sharing, and other types of relationships.
 */
contract AgentLinker is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    // --- Errors ---
    /// @notice Thrown when an agent address is invalid
    error InvalidAgentAddress();
    /// @notice Thrown when an agent tries to connect to itself
    error SelfConnectionNotAllowed();
    /// @notice Thrown when a connection does not exist
    error ConnectionDoesNotExist();
    /// @notice Thrown when a non-participant tries to toggle a connection
    error UnauthorizedToggler();

    // --- Structs ---
    /**
     * @notice Represents a connection between two agents
     * @param agentA First agent address
     * @param agentB Second agent address
     * @param isActive Whether the connection is active
     * @param createdAt Timestamp of creation
     * @param connectionType Type of connection (e.g., collaboration, data_sharing, trading_pair)
     */
    struct AgentConnection {
        address agentA;
        address agentB;
        bool isActive;
        uint256 createdAt;
        bytes32 connectionType;
    }

    // --- Storage ---
    /// @notice Maps connection IDs to AgentConnection structs
    mapping(bytes32 => AgentConnection) public connections;
    /// @notice Maps agent addresses to their connection IDs
    mapping(address => bytes32[]) public agentConnections;

    // --- Events ---
    /// @notice Emitted when a new connection is created
    event ConnectionCreated(bytes32 indexed connectionId, address indexed agentA, address indexed agentB, bytes32 connectionType);
    /// @notice Emitted when a connection is activated
    event ConnectionActivated(bytes32 indexed connectionId);
    /// @notice Emitted when a connection is deactivated
    event ConnectionDeactivated(bytes32 indexed connectionId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with the initial owner
     * @param initialOwner The address of the contract owner
     */
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    /**
     * @notice Creates a new connection between two agents
     * @param agentA Address of the first agent
     * @param agentB Address of the second agent
     * @param connectionType Type of connection (e.g., collaboration, data_sharing)
     * @return connectionId The unique identifier for the connection
     */
    function createConnection(
        address agentA,
        address agentB,
        bytes32 connectionType
    ) external returns (bytes32 connectionId) {
        if (agentA == address(0) || agentB == address(0)) revert InvalidAgentAddress();
        if (agentA == agentB) revert SelfConnectionNotAllowed();

        connectionId = keccak256(abi.encodePacked(agentA, agentB, connectionType, block.timestamp));

        connections[connectionId] = AgentConnection({
            agentA: agentA,
            agentB: agentB,
            isActive: true,
            createdAt: block.timestamp,
            connectionType: connectionType
        });

        agentConnections[agentA].push(connectionId);
        agentConnections[agentB].push(connectionId);

        emit ConnectionCreated(connectionId, agentA, agentB, connectionType);
        return connectionId;
    }

    /**
     * @notice Toggles the active state of a connection
     * @param connectionId The unique identifier for the connection
     */
    function toggleConnection(bytes32 connectionId) external {
        AgentConnection storage connection = connections[connectionId];
        if (connection.agentA == address(0)) revert ConnectionDoesNotExist();
        if (msg.sender != connection.agentA && msg.sender != connection.agentB) revert UnauthorizedToggler();

        connection.isActive = !connection.isActive;

        if (connection.isActive) {
            emit ConnectionActivated(connectionId);
        } else {
            emit ConnectionDeactivated(connectionId);
        }
    }

    /**
     * @notice Returns all connection IDs for a given agent
     * @param agent The address of the agent
     * @return Array of connection IDs
     */
    function getAgentConnections(address agent) external view returns (bytes32[] memory) {
        return agentConnections[agent];
    }

    /**
     * @dev Authorizes contract upgrades (UUPS)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}