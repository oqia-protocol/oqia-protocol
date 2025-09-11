// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISafe {
    // Minimal interface for a Safe wallet, if needed.
    // For SimpleArbitrageModule, we only check msg.sender == safe.
    // Add any other functions if the module were to interact with the Safe directly.
}