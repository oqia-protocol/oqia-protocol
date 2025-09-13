// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OqiaAgentWallet
 * @dev Smart contract wallet for autonomous AI agents with module system and session keys
 */
contract OqiaAgentWallet is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    
    // Module authorization mapping
    mapping(address => bool) public authorizedModules;
    
    // Session key management
    struct SessionKey {
        bool isActive;
        uint256 validUntil;
        uint256 valueLimit;
        uint256 valueUsed;
        bytes4 allowedFunction; // 0x00000000 for any function
    }
    
    mapping(address => SessionKey) public sessionKeys;
    address[] public activeSessionKeys;
    
    event ModuleAuthorized(address indexed module, bool authorized);
    event SessionKeyCreated(address indexed sessionKey, uint256 validUntil, uint256 valueLimit, bytes4 allowedFunction);
    event SessionKeyRevoked(address indexed sessionKey);
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);
    event ExecutionFailure(address indexed target, uint256 value, bytes data, string reason);
    event Received(address indexed sender, uint256 value);
    
    error UnauthorizedModule();
    error UnauthorizedSessionKey();
    error SessionKeyExpired();
    error ValueLimitExceeded();
    error FunctionNotAllowed();
    error ExecutionFailed();
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