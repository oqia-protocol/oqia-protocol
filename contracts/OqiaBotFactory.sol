// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OqiaAgentWallet.sol";

contract OqiaBotFactory is ERC721, Ownable {

    uint256 private _tokenIdCounter;

    mapping(uint256 => address) public botWalletOf;
    mapping(address => uint256) public tokenOfWallet;

    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet);

    constructor(address initialOwner) ERC721("Oqia Bot NFT", "OQIA") Ownable(initialOwner) {
    }

    function createBot(address botOwner) external returns (address) {
        require(botOwner != address(0), "Invalid owner");
        uint256 tokenId = ++_tokenIdCounter;

        OqiaAgentWallet wallet = new OqiaAgentWallet(botOwner);
        address walletAddress = address(wallet);

        botWalletOf[tokenId] = walletAddress;
        tokenOfWallet[walletAddress] = tokenId;
        _safeMint(botOwner, tokenId);

        emit BotCreated(tokenId, botOwner, walletAddress);
        return walletAddress;
    }
}
