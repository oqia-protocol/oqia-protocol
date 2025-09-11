// File: contracts/mocks/MockERC20.sol

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 with a mint function for testing
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // Helper for tests: mint tokens directly to an address
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
