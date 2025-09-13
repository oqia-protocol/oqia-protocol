// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IOqiaModule.sol";

contract EmptyModule is IOqiaModule {
    function execute(address from, bytes calldata data) external pure override returns (bytes memory) {
        // This module does nothing.
        return "";
    }
}
