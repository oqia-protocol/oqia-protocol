// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./OqiaAgentWallet.sol";

contract OqiaBotFactory is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 private _tokenCounter;
    mapping(uint256 => address) public agentWallets;

    event AgentCreated(uint256 indexed tokenId, address indexed agentWallet, address indexed owner);

    function initialize(string memory name, string memory symbol, address initialOwner) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        _tokenCounter = 0;
    }

    function mintAgent(address agentOwner) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenCounter;
        _safeMint(agentOwner, tokenId);

        OqiaAgentWallet agentWallet = new OqiaAgentWallet();
        agentWallet.initialize(agentOwner);
        agentWallets[tokenId] = address(agentWallet);

        emit AgentCreated(tokenId, address(agentWallet), agentOwner);

        _tokenCounter++;
        return tokenId;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
