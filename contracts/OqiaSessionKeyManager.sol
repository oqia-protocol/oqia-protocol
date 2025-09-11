// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// This is a simplified interface for a Gnosis Safe wallet.
interface ISafe {
    function getOwners() external view returns (address[] memory);
    function isOwner(address owner) external view returns (bool);
    function execTransactionFromModule(address to, uint256 value, bytes calldata data, uint8 operation)
        external
        returns (bool success);
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
    struct SessionKey {
        address key;
        uint256 validUntil;
        uint256 valueLimit;
        FunctionPermission[] permissions;
    }

    // Mapping: Safe wallet => SessionKey struct
    mapping(address => SessionKey) public sessionKeys;

    // Mapping to quickly check if a function is allowed for a given Safe and session key
    // keccak256(safe, sessionKey, target, selector) => bool
    mapping(bytes32 => bool) public isPermissioned;


    event SessionKeyAuthorized(
        address indexed safe,
        address indexed sessionKey,
        uint256 validUntil,
        uint256 valueLimit,
        FunctionPermission[] permissions
    );
    event SessionKeyUsed(address indexed safe, address indexed sessionKey, address to, uint256 value);

    constructor() Ownable(msg.sender) {}

    /// @notice Authorizes a session key for a given Safe wallet with specific functional permissions.
    /// @dev The caller (msg.sender) must be an owner of the Safe.
    /// @param safe The address of the Safe wallet.
    /// @param sessionKey The address of the session key to authorize.
    /// @param validUntil The Unix timestamp until which the key is valid.
    /// @param valueLimit The maximum value in wei for a single transaction.
    /// @param permissions An array of functions the session key is permitted to call.
    function authorizeSessionKey(
        address safe,
        address sessionKey,
        uint256 validUntil,
        uint256 valueLimit,
        FunctionPermission[] calldata permissions
    ) external {
        // Only an owner of the Safe can authorize a session key for it.
        require(ISafe(safe).isOwner(msg.sender), "Caller is not a Safe owner");

        // Clear old permissions for this safe/sessionKey pair before setting new ones
        SessionKey storage oldSession = sessionKeys[safe];
        if (oldSession.key != address(0)) {
            for (uint i = 0; i < oldSession.permissions.length; i++) {
                FunctionPermission memory p = oldSession.permissions[i];
                bytes32 permissionHash = keccak256(abi.encodePacked(safe, oldSession.key, p.target, p.functionSelector));
                isPermissioned[permissionHash] = false;
            }
        }

        SessionKey storage sk = sessionKeys[safe];
        sk.key = sessionKey;
        sk.validUntil = validUntil;
        sk.valueLimit = valueLimit;

        // Clear the old permissions array
        delete sk.permissions;

        for (uint i = 0; i < permissions.length; i++) {
            sk.permissions.push(permissions[i]);
            FunctionPermission memory p = permissions[i];
            bytes32 permissionHash = keccak256(abi.encodePacked(safe, sessionKey, p.target, p.functionSelector));
            isPermissioned[permissionHash] = true;
        }

        emit SessionKeyAuthorized(safe, sessionKey, validUntil, valueLimit, permissions);
    }

    /// @notice Allows an authorized session key to execute a transaction from the Safe.
    /// @dev This contract must be an enabled module on the Safe wallet.
    function executeTransaction(address safe, address to, uint256 value, bytes calldata data) external {
        SessionKey memory sk = sessionKeys[safe];

        // 1. Check if the caller is the authorized session key
        require(msg.sender == sk.key, "Caller is not the authorized session key");

        // 2. Check if the session key is still valid
        require(block.timestamp < sk.validUntil, "Session key has expired");

        // 3. Check if the transaction value is within the limit
        require(value <= sk.valueLimit, "Transaction value exceeds session key limit");

        // 4. Check for functional permissions
        bytes4 selector = bytes4(data[:4]);
        bytes32 permissionHash = keccak256(abi.encodePacked(safe, sk.key, to, selector));
        require(isPermissioned[permissionHash], "Session key does not have permission for this function");

        // 5. Execute the transaction from the Safe via this module
        // The `execTransactionFromModule` function is a core part of the Safe architecture.
        bool success = ISafe(safe).execTransactionFromModule(to, value, data, 0); // 0 for CALL operation
        require(success, "Safe transaction failed");

        emit SessionKeyUsed(safe, msg.sender, to, value);
    }
}
