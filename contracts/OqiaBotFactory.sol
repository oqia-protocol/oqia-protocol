// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./OqiaAgentWallet.sol";

/// @notice This version uses the Clones library to deploy lightweight proxy wallets,
/// removing the dependency on external Safe contracts for deployment.
contract OqiaBotFactory is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {

    // --- State Variables ---
    uint256 private _tokenIdCounter;
    address public agentWalletImplementation;

    mapping(uint256 => address) public botWalletOf;
    mapping(address => uint256) public tokenOfWallet;

    // --- Events ---
    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract.
    /// @param _agentWalletImplementation The address of the master OqiaAgentWallet implementation.
    function initialize(address _agentWalletImplementation) public initializer {
        __ERC721_init("Oqia Bot NFT", "OQIA");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        agentWalletImplementation = _agentWalletImplementation;
    }

    /// @dev Required by UUPS pattern. Restricts upgrade authorization to the owner.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Creates a new agent by deploying a clone of the OqiaAgentWallet
    /// and minting an NFT that represents ownership.
    /// @param botOwner The address that will own the new NFT and the wallet.
    function createBot(address botOwner) external returns (address proxy) {
        require(botOwner != address(0), "Invalid owner");

        // Deploy a new lightweight, clone proxy of the agent wallet
        proxy = Clones.clone(agentWalletImplementation);

        // Initialize the new clone, setting the botOwner as its owner
        OqiaAgentWallet(payable(proxy)).initialize(botOwner);

        uint256 tokenId = ++_tokenIdCounter;

        botWalletOf[tokenId] = proxy;
        tokenOfWallet[proxy] = tokenId;
        _safeMint(botOwner, tokenId);

        emit BotCreated(tokenId, botOwner, proxy);
    }
}
