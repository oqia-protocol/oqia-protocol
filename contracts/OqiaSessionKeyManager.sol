// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// This is a simplified interface for an Ownable wallet.
interface IOwnableWallet {
    function owner() external view returns (address);
    function execute(address to, uint256 value, bytes calldata data) external returns (bool success, bytes memory result);
}

/// @title OqiaSessionKeyManager
/// @author Oqia Protocol
/// @notice Manages temporary, permissioned session keys for Safe wallets.
/// This contract acts as an authorized module for a Safe.
contract OqiaSessionKeyManager is Ownable {
    /// @param target The contract address that can be called.
    /// @param functionSelector The 4-byte function selector that can be called.
    struct FunctionPermission {
        address target;
        bytes4 functionSelector;
    }

    /// @param key The address of the session key.
    /// @param validUntil The Unix timestamp until which the key is valid.
    /// @param valueLimit The maximum value in wei that can be sent in a single transaction.
    /// @param permissions An array of specific functions the session key is allowed to call.
    /// @param txCount The number of transactions made in the current rate limit period.
    /// @param lastTxTimestamp The timestamp of the last transaction made.
    /// @param rateLimitPeriodSeconds The duration of the rate-limiting window in seconds.
    /// @param rateLimitTxCount The maximum number of transactions allowed within that period.
    struct SessionKey {
        address key;
        uint256 validUntil;
        uint256 valueLimit;
        FunctionPermission[] permissions;
        uint256 txCount;
        uint256 lastTxTimestamp;
        uint32 rateLimitPeriodSeconds;
        uint32 rateLimitTxCount;
    }

    // Mapping: agent wallet => SessionKey struct
    mapping(address => SessionKey) public sessionKeys;

    // Mapping to quickly check if a function is allowed for a given agent wallet and session key
    // keccak256(agentWallet, sessionKey, target, selector) => bool
    mapping(bytes32 => bool) public isPermissioned;


    event SessionKeyAuthorized(
        address indexed agentWallet,
        address indexed sessionKey,
        uint256 validUntil,
        uint256 valueLimit,
        FunctionPermission[] permissions,
        uint32 rateLimitPeriodSeconds,
        uint32 rateLimitTxCount
    );
    event SessionKeyUsed(address indexed safe, address indexed sessionKey, address to, uint256 value);
    event RateLimitExceeded(address indexed safe, address indexed sessionKey, uint256 txCount, uint256 limit);


    constructor() Ownable(msg.sender) {}

    /// @notice Authorizes a session key for a given Safe wallet with specific functional permissions.
    /// @dev The caller (msg.sender) must be an owner of the Safe.
    function authorizeSessionKey(
        address agentWallet,
        address sessionKey,
        uint256 validUntil,
        uint256 valueLimit,
        FunctionPermission[] calldata permissions,
        uint32 rateLimitPeriodSeconds,
        uint32 rateLimitTxCount
    ) external {
        // Only the owner of the Agent Wallet can authorize a session key for it.
        require(IOwnableWallet(agentWallet).owner() == msg.sender, "Caller is not the wallet owner");

        // Clear old permissions for this wallet/sessionKey pair before setting new ones
        SessionKey storage oldSession = sessionKeys[agentWallet];
        if (oldSession.key != address(0)) {
            for (uint i = 0; i < oldSession.permissions.length; i++) {
                FunctionPermission memory p = oldSession.permissions[i];
                bytes32 permissionHash = keccak256(abi.encodePacked(agentWallet, oldSession.key, p.target, p.functionSelector));
                isPermissioned[permissionHash] = false;
            }
        }

        SessionKey storage sk = sessionKeys[agentWallet];
        sk.key = sessionKey;
        sk.validUntil = validUntil;
        sk.valueLimit = valueLimit;
        sk.rateLimitPeriodSeconds = rateLimitPeriodSeconds;
        sk.rateLimitTxCount = rateLimitTxCount;
        sk.txCount = 0; // Reset rate limit counter on new authorization
        sk.lastTxTimestamp = 0;

        // Clear the old permissions array
        delete sk.permissions;

        for (uint i = 0; i < permissions.length; i++) {
            sk.permissions.push(permissions[i]);
            FunctionPermission memory p = permissions[i];
            bytes32 permissionHash = keccak256(abi.encodePacked(agentWallet, sessionKey, p.target, p.functionSelector));
            isPermissioned[permissionHash] = true;
        }

        emit SessionKeyAuthorized(agentWallet, sessionKey, validUntil, valueLimit, permissions, rateLimitPeriodSeconds, rateLimitTxCount);
    }

    /// @notice Allows an authorized session key to execute a transaction from the agent wallet.
    /// @dev This contract must be the owner of the agent wallet.
    function executeTransaction(address agentWallet, address to, uint256 value, bytes calldata data) external {
        SessionKey storage sk = sessionKeys[agentWallet];

        // 1. Check if the caller is the authorized session key
        require(msg.sender == sk.key, "Caller is not the authorized session key");

        // 2. Check if the session key is still valid
        require(block.timestamp < sk.validUntil, "Session key has expired");

        // 3. Check if the transaction value is within the limit
        require(value <= sk.valueLimit, "Transaction value exceeds session key limit");

        // 4. Check Rate Limiting
        if (sk.rateLimitTxCount > 0) {
            if (block.timestamp > sk.lastTxTimestamp + sk.rateLimitPeriodSeconds) {
                // Period has reset
                sk.txCount = 1;
            } else {
                // Within the same period
                sk.txCount++;
            }

            if (sk.txCount > sk.rateLimitTxCount) {
                emit RateLimitExceeded(agentWallet, msg.sender, sk.txCount, sk.rateLimitTxCount);
                revert("Rate limit exceeded");
            }
            sk.lastTxTimestamp = block.timestamp;
        }

        // 5. Check for functional permissions
        bytes4 selector = bytes4(data[:4]);
        bytes32 permissionHash = keccak256(abi.encodePacked(agentWallet, sk.key, to, selector));
        require(isPermissioned[permissionHash], "Session key does not have permission for this function");

        // 6. Execute the transaction by calling the Agent Wallet's `execute` function.
        // This session manager contract is NOT the owner, so this call will fail.
        // This highlights a design change: a session key manager for an Ownable wallet
        // needs to be the wallet's owner itself, or the wallet needs a module system.
        // For this test, we will assume this contract is the owner of the agent wallet.
        (bool success, ) = IOwnableWallet(agentWallet).execute(to, value, data);
        require(success, "Agent Wallet transaction failed");

        emit SessionKeyUsed(agentWallet, msg.sender, to, value);
    }
}
