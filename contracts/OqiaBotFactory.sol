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
    mapping(address => uint256) public tokenOfWallet;

    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet);

    function initialize(string memory name, string memory symbol, address initialOwner) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        _tokenCounter = 0;
    }

    function createBot(address botOwner) external onlyOwner returns (address) {
        require(botOwner != address(0), "Invalid owner");
        uint256 tokenId = _tokenCounter;
        _safeMint(botOwner, tokenId);

        OqiaAgentWallet agentWallet = new OqiaAgentWallet();
        agentWallet.initialize(botOwner);
        address walletAddress = address(agentWallet);

        agentWallets[tokenId] = walletAddress;
        tokenOfWallet[walletAddress] = tokenId;


        emit BotCreated(tokenId, botOwner, walletAddress);

        _tokenCounter++;
        return walletAddress;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
