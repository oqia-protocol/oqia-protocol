// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOqiaBotFactory {
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenOfWallet(address wallet) external view returns (uint256);
}
