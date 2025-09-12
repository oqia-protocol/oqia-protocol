// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OqiaAgentWallet is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function execute(address to, uint256 value, bytes calldata data) external onlyOwner returns (bool, bytes memory) {
        (bool success, bytes memory result) = to.call{value: value}(data);
        return (success, result);
    }

    receive() external payable {}
}
