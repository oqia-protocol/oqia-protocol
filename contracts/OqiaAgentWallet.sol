// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OqiaAgentWallet
 * @notice Smart contract wallet for autonomous AI agents with module system and session keys.
 * @dev Supports module authorization and session key management for secure agent operations.
 */
contract OqiaAgentWallet is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    
    /// @notice Tracks authorized modules for the agent wallet
    mapping(address => bool) public authorizedModules;
    
    // Session key management
    /**
     * @notice Represents a session key with permissions and limits
     * @param isActive Whether the session key is active
     * @param validUntil Expiry timestamp
     * @param valueLimit Maximum value allowed
     * @param valueUsed Value already used
     * @param allowedFunction Allowed function selector (0x00000000 for any)
     */
    struct SessionKey {
        bool isActive;
        uint256 validUntil;
        uint256 valueLimit;
        uint256 valueUsed;
        bytes4 allowedFunction;
    }
    /// @notice Maps session key addresses to SessionKey structs
    mapping(address => SessionKey) public sessionKeys;
    /// @notice List of currently active session key addresses
    address[] public activeSessionKeys;
    
    /// @notice Emitted when a module is authorized or deauthorized
    event ModuleAuthorized(address indexed module, bool authorized);
    /// @notice Emitted when a session key is created
    event SessionKeyCreated(address indexed sessionKey, uint256 validUntil, uint256 valueLimit, bytes4 allowedFunction);
    /// @notice Emitted when a session key is revoked
    event SessionKeyRevoked(address indexed sessionKey);
    /// @notice Emitted when execution succeeds
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);
    /// @notice Emitted when execution fails
    event ExecutionFailure(address indexed target, uint256 value, bytes data, string reason);
    /// @notice Emitted when the wallet receives ETH
    event Received(address indexed sender, uint256 value);
    
    /// @notice Thrown when a module is not authorized
    error UnauthorizedModule();
    /// @notice Thrown when a session key is not authorized
    error UnauthorizedSessionKey();
    /// @notice Thrown when a session key is expired
    error SessionKeyExpired();
    /// @notice Thrown when value limit is exceeded
    error ValueLimitExceeded();
    /// @notice Thrown when a function is not allowed
    error FunctionNotAllowed();
    /// @notice Thrown when execution fails
    error ExecutionFailed();
    /// @notice Thrown when a session key is invalid
    error InvalidSessionKey();
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }
    
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    
    // Module Management
    function authorizeModule(address module, bool authorized) external onlyOwner {
        authorizedModules[module] = authorized;
        emit ModuleAuthorized(module, authorized);
    }
    
    // Session Key Management
    function createSessionKey(
        address sessionKey,
        uint256 validUntil,
        uint256 valueLimit,
        bytes4 allowedFunction
    ) external onlyOwner {
        require(sessionKey != address(0), "Invalid session key");
        require(validUntil > block.timestamp, "Invalid expiry time");
        
        SessionKey storage key = sessionKeys[sessionKey];
        
        // If this is a new session key, add it to active list
        if (!key.isActive) {
            activeSessionKeys.push(sessionKey);
        }
        
        key.isActive = true;
        key.validUntil = validUntil;
        key.valueLimit = valueLimit;
        key.valueUsed = 0;
        key.allowedFunction = allowedFunction;
        
        emit SessionKeyCreated(sessionKey, validUntil, valueLimit, allowedFunction);
    }
    
    function revokeSessionKey(address sessionKey) external onlyOwner {
        SessionKey storage key = sessionKeys[sessionKey];
        require(key.isActive, "Session key not active");
        
        key.isActive = false;
        
        // Remove from active list
        for (uint256 i = 0; i < activeSessionKeys.length; i++) {
            if (activeSessionKeys[i] == sessionKey) {
                activeSessionKeys[i] = activeSessionKeys[activeSessionKeys.length - 1];
                activeSessionKeys.pop();
                break;
            }
        }
        
        emit SessionKeyRevoked(sessionKey);
    }
    
    // Execution Functions
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external nonReentrant returns (bool success, bytes memory returnData) {
        // Check if caller is owner
        if (msg.sender == owner()) {
            return _executeCall(target, value, data);
        }
        
        // Check if caller is authorized module
        if (authorizedModules[msg.sender]) {
            return _executeCall(target, value, data);
        }
        
        // Check if caller is valid session key
        SessionKey storage key = sessionKeys[msg.sender];
        if (!key.isActive) revert UnauthorizedSessionKey();
        if (block.timestamp > key.validUntil) revert SessionKeyExpired();
        if (key.valueUsed + value > key.valueLimit) revert ValueLimitExceeded();
        
        // Check function selector if restricted
        if (key.allowedFunction != bytes4(0) && data.length >= 4) {
            bytes4 functionSelector = bytes4(data[:4]);
            if (functionSelector != key.allowedFunction) revert FunctionNotAllowed();
        }
        
        key.valueUsed += value;
        return _executeCall(target, value, data);
    }
    
    function _executeCall(
        address target,
        uint256 value,
        bytes calldata data
    ) internal returns (bool success, bytes memory returnData) {
        (success, returnData) = target.call{value: value}(data);
        
        if (success) {
            emit ExecutionSuccess(target, value, data);
        } else {
            string memory reason = returnData.length > 0 ? string(returnData) : "Unknown error";
            emit ExecutionFailure(target, value, data, reason);
        }
    }
    
    // Legacy functions for backward compatibility
    function approveModule(address token, address module, uint256 amount) external onlyOwner {
        IERC20(token).approve(module, amount);
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getActiveSessionKeys() external view returns (address[] memory) {
        return activeSessionKeys;
    }
    
    function isValidSessionKey(address sessionKey) external view returns (bool) {
        SessionKey storage key = sessionKeys[sessionKey];
        return key.isActive && block.timestamp <= key.validUntil;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}