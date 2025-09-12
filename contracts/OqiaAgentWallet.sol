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

    constructor() { _disableInitializers(); }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function authorizeModule(address module, bool isAuthorized) external onlyOwner {
        isModuleAuthorized[module] = isAuthorized;
        emit ModuleAuthorized(module, isAuthorized);
    }

    function execute(address to, uint256 value, bytes calldata data) external onlyAuthorized returns (bool success, bytes memory result) {
        (success, result) = to.call{value: value}(data);
    }

    receive() external payable {}
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
