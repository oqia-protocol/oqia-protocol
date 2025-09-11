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
    struct SessionKey {
        address key;
        uint256 validUntil; // Unix timestamp
        uint256 valueLimit; // Max value in wei per transaction
    }

    // Mapping: Safe wallet => SessionKey struct
    mapping(address => SessionKey) public sessionKeys;

    event SessionKeyAuthorized(
        address indexed safe, address indexed sessionKey, uint256 validUntil, uint256 valueLimit
    );
    event SessionKeyUsed(address indexed safe, address indexed sessionKey, address to, uint256 value);

    constructor() Ownable(msg.sender) {}

    /// @notice Authorizes a session key for a given Safe wallet.
    /// @dev The caller (msg.sender) must be an owner of the Safe.
    function authorizeSessionKey(address safe, address sessionKey, uint256 validUntil, uint256 valueLimit) external {
        // Only an owner of the Safe can authorize a session key for it.
        require(ISafe(safe).isOwner(msg.sender), "Caller is not a Safe owner");

        sessionKeys[safe] = SessionKey({key: sessionKey, validUntil: validUntil, valueLimit: valueLimit});

        emit SessionKeyAuthorized(safe, sessionKey, validUntil, valueLimit);
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

        // 4. Execute the transaction from the Safe via this module
        // The `execTransactionFromModule` function is a core part of the Safe architecture.
        bool success = ISafe(safe).execTransactionFromModule(to, value, data, 0); // 0 for CALL operation
        require(success, "Safe transaction failed");

        emit SessionKeyUsed(safe, msg.sender, to, value);
    }
}
