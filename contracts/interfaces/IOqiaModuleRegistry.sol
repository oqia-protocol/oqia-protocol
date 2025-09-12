// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IOqiaModuleRegistry {
    function hasModuleLicense(address botWallet, uint256 moduleId) external view returns (bool);
}
