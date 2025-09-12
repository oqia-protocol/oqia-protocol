// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOqiaModuleRegistry {
    function hasModuleLicense(uint256 moduleId, address user) external view returns (bool);
}
