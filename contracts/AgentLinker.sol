// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AgentLinker
 * @dev Enables secure agent-to-agent communication and collaboration
 */
contract AgentLinker is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    struct AgentConnection {
        address agentA;
        address agentB;
        bool isActive;
        uint256 createdAt;
        bytes32 connectionType; // e.g., "collaboration", "data_sharing", "trading_pair"
    }
    
    mapping(bytes32 => AgentConnection) public connections;
    mapping(address => bytes32[]) public agentConnections;
    
    event ConnectionCreated(bytes32 indexed connectionId, address indexed agentA, address indexed agentB, bytes32 connectionType);
    event ConnectionActivated(bytes32 indexed connectionId);
    event ConnectionDeactivated(bytes32 indexed connectionId);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }
    
    function createConnection(
        address agentA,
        address agentB,
        bytes32 connectionType
    ) external returns (bytes32 connectionId) {
        require(agentA != address(0) && agentB != address(0), "Invalid agent addresses");
        require(agentA != agentB, "Cannot connect agent to itself");
        
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
    
    function toggleConnection(bytes32 connectionId) external {
        AgentConnection storage connection = connections[connectionId];
        require(connection.agentA != address(0), "Connection does not exist");
        
        connection.isActive = !connection.isActive;
        
        if (connection.isActive) {
            emit ConnectionActivated(connectionId);
        } else {
            emit ConnectionDeactivated(connectionId);
        }
    }
    
    function getAgentConnections(address agent) external view returns (bytes32[] memory) {
        return agentConnections[agent];
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}