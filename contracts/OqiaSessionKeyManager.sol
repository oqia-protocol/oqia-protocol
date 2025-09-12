// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OqiaSessionKeyManager {
    struct SessionKey {
        address key;
        uint256 validUntil;
        uint256 valueLimit;
    }

    mapping(address => SessionKey) public sessionKeysForSafe;

    event SessionKeyAuthorized(address indexed safe, address indexed sessionKey);
    event SessionKeyUsed(address indexed safe, address indexed sessionKey);

    function authorizeSessionKey(address safe, address sessionKey, uint256 validUntil, uint256 valueLimit) external {
        sessionKeysForSafe[safe] = SessionKey(sessionKey, validUntil, valueLimit);
        emit SessionKeyAuthorized(safe, sessionKey);
    }

    function executeTransaction(address safe, address to, uint256 value, bytes calldata data) external {
        SessionKey memory sk = sessionKeysForSafe[safe];
        require(msg.sender == sk.key, "Caller is not the authorized session key");
        require(block.timestamp < sk.validUntil, "Session key has expired");
        require(value <= sk.valueLimit, "Transaction value exceeds limit");

        (bool success, ) = safe.call(abi.encodeWithSignature("execute(address,uint256,bytes)", to, value, data));
        require(success, "Agent Wallet transaction failed");

        emit SessionKeyUsed(safe, msg.sender);
    }
}
