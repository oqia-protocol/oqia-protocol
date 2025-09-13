// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IOqiaBotFactory.sol";

/**
 * @title OqiaSessionKeyManager
 * @dev Manages ephemeral session keys for agent wallets with granular permissions
 */
contract OqiaSessionKeyManager is Ownable, ReentrancyGuard {
    
    struct SessionKey {
        address sessionKey;
        bytes4 allowedFunction; // 0x00000000 for any function
        uint256 validUntil;
        uint256 valueLimit;
        uint256 valueUsed;
        bool isActive;
    }
    
    // agentWallet => sessionKey => SessionKey data
    mapping(address => mapping(address => SessionKey)) public sessionKeys;
    
    // agentWallet => array of active session keys
    mapping(address => address[]) public activeSessionKeys;
    
    IOqiaBotFactory public immutable botFactory;
    
    event SessionKeyAuthorized(
        address indexed agentWallet,
        address indexed sessionKey,
        bytes4 allowedFunction,
        uint256 validUntil,
        uint256 valueLimit
    );
    
    event SessionKeyRevoked(address indexed agentWallet, address indexed sessionKey);
    event TransactionExecuted(address indexed agentWallet, address indexed sessionKey, address indexed target, uint256 value);
    
    error UnauthorizedSessionKey();
    error SessionKeyExpired();
    error ValueLimitExceeded();
    error FunctionNotAllowed();
    error InvalidAgentWallet();
    error ExecutionFailed();
    
    constructor() Ownable(msg.sender) {
        // For testing, we'll make botFactory optional
        botFactory = IOqiaBotFactory(address(0));
    }
    
    modifier onlyAgentOwner(address agentWallet) {
        if (address(botFactory) != address(0)) {
            uint256 tokenId = botFactory.tokenOfWallet(agentWallet);
            require(tokenId != 0, "Invalid agent wallet");
            require(botFactory.ownerOf(tokenId) == msg.sender, "Not agent owner");
        }
        _;
    }
    
    function authorizeSessionKey(
        address agentWallet,
        address sessionKey,
        bytes4 allowedFunction,
        uint256 validUntil,
        uint256 valueLimit
    ) external onlyAgentOwner(agentWallet) {
        require(sessionKey != address(0), "Invalid session key");
        require(validUntil > block.timestamp, "Invalid expiry time");
        
        SessionKey storage key = sessionKeys[agentWallet][sessionKey];
        
        // If this is a new session key, add it to the active list
        if (!key.isActive) {
            activeSessionKeys[agentWallet].push(sessionKey);
        }
        
        key.sessionKey = sessionKey;
        key.allowedFunction = allowedFunction;
        key.validUntil = validUntil;
        key.valueLimit = valueLimit;
        key.valueUsed = 0;
        key.isActive = true;
        
        emit SessionKeyAuthorized(agentWallet, sessionKey, allowedFunction, validUntil, valueLimit);
    }
    
    function revokeSessionKey(address agentWallet, address sessionKey) external onlyAgentOwner(agentWallet) {
        SessionKey storage key = sessionKeys[agentWallet][sessionKey];
        require(key.isActive, "Session key not active");
        
        key.isActive = false;
        
        // Remove from active list
        address[] storage activeKeys = activeSessionKeys[agentWallet];
        for (uint256 i = 0; i < activeKeys.length; i++) {
            if (activeKeys[i] == sessionKey) {
                activeKeys[i] = activeKeys[activeKeys.length - 1];
                activeKeys.pop();
                break;
            }
        }
        
        emit SessionKeyRevoked(agentWallet, sessionKey);
    }
    
    function executeTransaction(
        address agentWallet,
        address target,
        uint256 value,
        bytes calldata data
    ) external nonReentrant returns (bool success, bytes memory returnData) {
        SessionKey storage key = sessionKeys[agentWallet][msg.sender];
        
        if (!key.isActive) revert UnauthorizedSessionKey();
        if (block.timestamp > key.validUntil) revert SessionKeyExpired();
        if (key.valueUsed + value > key.valueLimit) revert ValueLimitExceeded();
        
        // Check function selector if restricted
        if (key.allowedFunction != bytes4(0) && data.length >= 4) {
            bytes4 functionSelector = bytes4(data[:4]);
            if (functionSelector != key.allowedFunction) revert FunctionNotAllowed();
        }
        
        key.valueUsed += value;
        
        // Execute the transaction through the agent wallet
        (success, returnData) = agentWallet.call(
            abi.encodeWithSignature("execute(address,uint256,bytes)", target, value, data)
        );
        
        if (!success) revert ExecutionFailed();
        
        emit TransactionExecuted(agentWallet, msg.sender, target, value);
    }
    
    function getActiveSessionKeys(address agentWallet) external view returns (address[] memory) {
        return activeSessionKeys[agentWallet];
    }
    
    function isValidSessionKey(address agentWallet, address sessionKey) external view returns (bool) {
        SessionKey storage key = sessionKeys[agentWallet][sessionKey];
        return key.isActive && block.timestamp <= key.validUntil;
    }
}