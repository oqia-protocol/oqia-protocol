// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract OqiaAgentWallet is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    mapping(address => bool) public isModuleAuthorized;

    event ModuleAuthorized(address indexed module, bool isAuthorized);

    modifier onlyAuthorized() {
        require(owner() == msg.sender || isModuleAuthorized[msg.sender], "Not Owner or Authorized Module");
        _;
    }

    // Note: avoid defining a constructor to keep the contract upgrade-safe for OpenZeppelin upgrades.
    // Initializer sets the owner to the provided address.
    function initialize(address initialOwner) public initializer {
        // Some OpenZeppelin OwnableUpgradeable versions expect an address in __Ownable_init
        // so pass the initialOwner directly to match the imported OZ version.
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function authorizeModule(address module, bool isAuthorized) external onlyOwner {
        isModuleAuthorized[module] = isAuthorized;
        emit ModuleAuthorized(module, isAuthorized);
    }

    // Backwards-compatible helper used by tests (alias)
    function approveModule(address token, address module, uint256 /*amount*/) external onlyOwner {
        // For this wallet, approving a module means marking it authorized
        isModuleAuthorized[module] = true;
        emit ModuleAuthorized(module, true);
    }

    function execute(address to, uint256 value, bytes calldata data) external onlyAuthorized returns (bool success, bytes memory result) {
        (success, result) = to.call{value: value}(data);
    }

    receive() external payable {}
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
