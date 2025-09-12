// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A simple mock for the OqiaBotFactory to facilitate testing of the OqiaModuleRegistry.
contract MockOqiaBotFactory {
    mapping(uint256 => address) private _owners;
    mapping(uint256 => address) private _wallets;
    mapping(address => uint256) private _tokens;

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _owners[tokenId];
    }

    function tokenOfWallet(address wallet) public view returns (uint256) {
        return _tokens[wallet];
    }

    // --- Test setup functions ---

    function setOwner(address owner, uint256 tokenId) external {
        _owners[tokenId] = owner;
    }

    function setWallet(address wallet, uint256 tokenId) external {
        _wallets[tokenId] = wallet;
        _tokens[wallet] = tokenId;
    }
}
