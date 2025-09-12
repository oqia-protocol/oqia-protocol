// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title OqiaAgentWallet
/// @notice A simple, ownable, and upgradeable smart contract wallet for an Oqia agent.
contract OqiaAgentWallet is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    /// @notice Allows the wallet to receive Ether.
    receive() external payable {}

    /// @notice The core function allowing the owner (or an authorized module) to execute calls.
    /// @param to The address of the contract to call.
    /// @param value The amount of Ether to send.
    /// @param data The calldata for the function to be executed.
    function execute(address to, uint256 value, bytes calldata data) external onlyOwner returns (bool success, bytes memory result) {
        (success, result) = to.call{value: value}(data);
    }

    /// @dev Required by UUPS pattern. Restricts upgrade authorization to the owner.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
