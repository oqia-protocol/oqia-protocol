// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISafe.sol";
import "./OqiaAgentWallet.sol";

/// @title OqiaSessionKeyManager
/// @notice Manages ephemeral session keys for Oqia Agent Wallets.
/// @dev This contract must be authorized as a module on an Agent Wallet to be able to execute transactions.
contract OqiaSessionKeyManager {

    // --- Data Structures ---

    struct SessionKey {
        bool authorized;        // Flag to check for key existence and authorization.
        bytes4 func;            // 4-byte selector of the allowed function. 0x00000000 for any function.
        uint256 validUntil;     // Expiration timestamp for the session key.
        uint256 valueAllowance; // Maximum total value (in wei) that can be spent by this key.
        uint256 spent;          // Total value spent so far by this key.
    }

    // --- State Variables ---

    // Mapping: safe address => session key address => SessionKey data
    mapping(address => mapping(address => SessionKey)) public sessionKeys;

    // --- Events ---

    event SessionKeyAuthorized(address indexed safe, address indexed sessionKey, bytes4 func, uint256 validUntil, uint256 valueAllowance);
    event SessionKeyRevoked(address indexed safe, address indexed sessionKey);
    event SessionKeyUsed(address indexed safe, address indexed sessionKey, uint256 value);

    // --- External Functions ---

    /// @notice Authorizes a new session key for a given agent wallet.
    /// @dev Can only be called by the owner of the safe.
    /// @param safe The address of the agent wallet.
    /// @param sessionKey The address of the ephemeral key to be authorized.
    /// @param func The 4-byte selector of the function the session key is allowed to call. Use 0x00000000 for any function.
    /// @param validUntil The timestamp until which the session key is valid.
    /// @param valueAllowance The maximum total value (in wei) that can be spent by this session key.
    function authorizeSessionKey(address safe, address sessionKey, bytes4 func, uint256 validUntil, uint256 valueAllowance) external {
        require(ISafe(safe).owner() == msg.sender, "Caller is not the owner of the safe");
        require(validUntil > block.timestamp, "Expiration must be in the future");

        sessionKeys[safe][sessionKey] = SessionKey({
            authorized: true,
            func: func,
            validUntil: validUntil,
            valueAllowance: valueAllowance,
            spent: 0
        });
        emit SessionKeyAuthorized(safe, sessionKey, func, validUntil, valueAllowance);
    }

    /// @notice Revokes a session key for a given safe.
    /// @dev Can only be called by the owner of the safe.
    /// @param safe The address of the agent wallet.
    /// @param sessionKey The address of the session key to revoke.
    function revokeSessionKey(address safe, address sessionKey) external {
        require(ISafe(safe).owner() == msg.sender, "Caller is not the owner of the safe");
        delete sessionKeys[safe][sessionKey];
        emit SessionKeyRevoked(safe, sessionKey);
    }

    /// @notice Executes a transaction on behalf of a safe using a session key.
    /// @dev The session key holder (`msg.sender`) must be authorized for the `safe`.
    /// @dev This contract (OqiaSessionKeyManager) must be an authorized module on the `safe`.
    /// @param safe The address of the agent wallet to execute the transaction from.
    /// @param to The destination address of the transaction.
    /// @param value The value (in wei) to be sent.
    /// @param data The calldata of the transaction.
    function executeTransaction(address safe, address to, uint256 value, bytes calldata data) external {
        SessionKey storage sk = sessionKeys[safe][msg.sender];
        require(sk.authorized, "Session key not authorized");
        require(block.timestamp < sk.validUntil, "Session key has expired");

        uint256 newTotalSpent = sk.spent + value;
        require(newTotalSpent <= sk.valueAllowance, "Transaction value exceeds allowance");

        if (sk.func != 0x00000000) {
            require(bytes4(data) == sk.func, "Transaction data does not match authorized function");
        }

        sk.spent = newTotalSpent;

        // This call will succeed only if this contract (OqiaSessionKeyManager) has been
        // authorized as a module on the target `safe` wallet. The underlying `execute`
        // function on the wallet will handle the actual `to.call{value: value}(data)`.
        (bool success, ) = OqiaAgentWallet(payable(safe)).execute(to, value, data);
        require(success, "Agent Wallet transaction failed");

        emit SessionKeyUsed(safe, msg.sender, value);
    }
}