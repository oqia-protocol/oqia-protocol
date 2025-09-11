// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface ISafe {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success);
}

contract OqiaSessionKeyManager is Ownable { // Removed ISafeModule inheritance
    using ECDSA for bytes32;

    // Struct to define the permissions of a session key
    struct SessionKey {
        address signer;
        address target; // The contract the session key is allowed to interact with
        bytes4 selector; // The function selector of the allowed function
        uint256 valueLimit; // Maximum value that can be transferred per transaction
        uint256 expiration; // Timestamp when the session key expires
        uint256 dailyLimit; // Maximum total value that can be transferred per day
        uint256 lastDay; // Last day the daily limit was reset
        uint256 spentToday; // Value spent today
        bool active;
    }

    // Mapping from Safe address => session key signer => SessionKey details
    mapping(address => mapping(address => SessionKey)) public sessionKeys;
    // Mapping from Safe address => module enabled status (This will be managed by the Safe itself, not this contract directly)
    // We will need a way to know which Safe this module is associated with.
    // For now, let's assume `msg.sender` in `addSessionKey` and `revokeSessionKey` is the Safe.

    event SessionKeyAdded(address indexed safe, address indexed signer, address target, bytes4 selector, uint256 expiration);
    event SessionKeyRevoked(address indexed safe, address indexed signer);
    event SessionKeyUsed(address indexed safe, address indexed signer, address target, bytes4 selector, uint256 value);

    // The address of the Safe this module is managing
    address public safeAddress;

    constructor(address _safeAddress) Ownable(_safeAddress) {
        safeAddress = _safeAddress;
    }

    // Modifier to ensure the call comes from the associated Safe
    modifier onlySafe() {
        require(msg.sender == safeAddress, "OSKM: Not called from the associated Safe");
        _;
    }

    // Function to add a session key
    function addSessionKey(
        address _signer,
        address _target,
        bytes4 _selector,
        uint256 _valueLimit,
        uint256 _expiration,
        uint256 _dailyLimit
    ) external onlySafe {
        require(_signer != address(0), "OSKM: Invalid signer address");
        require(_expiration > block.timestamp, "OSKM: Expiration must be in the future");

        sessionKeys[safeAddress][_signer] = SessionKey({
            signer: _signer,
            target: _target,
            selector: _selector,
            valueLimit: _valueLimit,
            expiration: _expiration,
            dailyLimit: _dailyLimit,
            lastDay: block.timestamp / 1 days, // Initialize with current day
            spentToday: 0,
            active: true
        });

        emit SessionKeyAdded(safeAddress, _signer, _target, _selector, _expiration);
    }

    // Function to revoke a session key
    function revokeSessionKey(address _signer) external onlySafe {
        require(sessionKeys[safeAddress][_signer].active, "OSKM: Session key not active");
        sessionKeys[safeAddress][_signer].active = false;
        emit SessionKeyRevoked(safeAddress, _signer);
    }

    // Function to validate a session key and its permissions
    function isValidSessionKey(
        address _safe,
        address _signer,
        address _target,
        bytes4 _selector,
        uint256 _value,
        bytes32 _dataHash,
        bytes memory _signature
    ) public view returns (bool) {
        // This module is designed to be associated with a single Safe.
        // So, the _safe parameter should match the safeAddress of this contract.
        if (_safe != safeAddress) return false;

        SessionKey storage key = sessionKeys[_safe][_signer];

        // 1. Check if session key is active
        if (!key.active) return false;

        // 2. Check expiration
        if (block.timestamp > key.expiration) return false;

        // 3. Check target contract
        if (key.target != address(0) && key.target != _target) return false;

        // 4. Check function selector
        if (key.selector != bytes4(0) && key.selector != _selector) return false;

        // 5. Check value limit
        if (key.valueLimit != 0 && _value > key.valueLimit) return false;

        // 6. Check daily limit (this is a view function, so we can't modify state)
        uint256 currentDay = block.timestamp / 1 days;
        if (key.dailyLimit != 0) {
            if (currentDay == key.lastDay) {
                if (key.spentToday + _value > key.dailyLimit) return false;
            } else {
                if (_value > key.dailyLimit) return false;
            }
        }

        // 7. Verify signature
        address recoveredSigner = _dataHash.recover(_signature);
        if (recoveredSigner != _signer) return false;

        return true;
    }

    // This function will be called by the Safe to execute a transaction
    // if the session key is valid.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) external returns (bool success) {
        // Only the associated Safe can call this function
        require(msg.sender == safeAddress, "OSKM: Not called from the associated Safe");

        // We need to recover the signer from the transaction data and signature
        // This part is complex as the signature is for the entire Safe transaction,
        // not just the module's execution. For now, let's assume the `tx.origin`
        // is the session key signer for simplicity in this placeholder.
        // In a real implementation, the session key's signature would be part of the `data`
        // or passed as an additional parameter.

        // For now, let's use a placeholder for the signer
        address sessionKeySigner = tx.origin; // Placeholder: In reality, this needs to be recovered from the signature in `data`

        // Validate the session key
        // This validation should ideally happen *before* calling execTransactionFromModule
        // by the Safe's pre-check logic. For now, we'll do a basic check here.
        bytes4 selector = bytes4(data); // Assuming the first 4 bytes of data is the selector
        if (!isValidSessionKey(safeAddress, sessionKeySigner, to, selector, value, bytes32(0), bytes(""))) { // Simplified signature check
            revert("OSKM: Invalid session key or permissions");
        }

        // Update daily limit if applicable
        SessionKey storage key = sessionKeys[safeAddress][sessionKeySigner];
        uint256 currentDay = block.timestamp / 1 days;

        if (key.dailyLimit != 0 && key.active) {
            if (currentDay != key.lastDay) {
                key.lastDay = currentDay;
                key.spentToday = 0;
            }
            key.spentToday = key.spentToday + value; // Using native addition for Solidity 0.8.x
            emit SessionKeyUsed(safeAddress, sessionKeySigner, to, selector, value);
        }

        // Execute the transaction using the Safe's internal execute function
        // This requires the OqiaSessionKeyManager to have an interface to the Safe it's managing.
        // For now, we'll use a direct call, but this needs to be refined to interact with the Safe's `execTransactionFromModule`
        // or a similar function that the Safe provides for modules to execute transactions.
        (success, ) = safeAddress.call{value: value}(abi.encodeWithSelector(ISafe(safeAddress).execTransactionFromModule.selector, to, value, data, operation));
    }
}