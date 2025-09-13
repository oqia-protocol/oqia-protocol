// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./modules/IOqiaModule.sol";

contract OqiaAgentWallet is Initializable, OwnableUpgradeable {
    mapping(bytes4 => address) public installedModules;

    event ModuleInstalled(bytes4 indexed signature, address indexed module);
    event ModuleUninstalled(bytes4 indexed signature);
    event Received(address indexed sender, uint256 value);

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function installModule(bytes4 signature, address module) external onlyOwner {
        installedModules[signature] = module;
        emit ModuleInstalled(signature, module);
    }

    function uninstallModule(bytes4 signature) external onlyOwner {
        address module = installedModules[signature];
        require(module != address(0), "Module not installed");
        delete installedModules[signature];
        emit ModuleUninstalled(signature);
    }

    function executeModule(bytes4 signature, bytes calldata data) external returns (bytes memory) {
        address module = installedModules[signature];
        require(module != address(0), "Module not installed");

        return IOqiaModule(module).execute(msg.sender, data);
    }

    function executeCall(address to, uint256 value, bytes calldata data) external onlyOwner returns (bool, bytes memory) {
        (bool success, bytes memory result) = to.call{value: value}(data);
        return (success, result);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function approveModule(address token, address module, uint256 /*amount*/) external onlyOwner {
        // This function is a placeholder for a planned approval mechanism.
        // It will be implemented in a future update.
    }
}
