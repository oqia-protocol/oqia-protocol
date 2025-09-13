// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOqiaModule {
    function execute(address from, bytes calldata data) external returns (bytes memory);
}
