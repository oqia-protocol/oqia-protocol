// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./OqiaAgentWallet.sol";

/**
 * @title OqiaBotFactory
 * @dev Factory contract for creating Oqia agent wallets with ERC721 ownership tokens
 */
contract OqiaBotFactory is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
{
    uint256 private _tokenIdCounter;
    address public agentWalletImplementation;
    
    mapping(uint256 => address) public botWalletOf;
    mapping(address => uint256) public tokenOfWallet;
    mapping(uint256 => string) private _tokenURIs;
    
    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet);
    event AgentCreated(uint256 indexed tokenId, address indexed owner, address agentWallet);
    
    error InvalidOwner();
    error WalletCreationFailed();
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _agentWalletImplementation) public initializer {
        __ERC721_init("Oqia Agent", "OQIA");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        agentWalletImplementation = _agentWalletImplementation;
        _tokenIdCounter = 1; // Start from 1
    }
    
    function createBot(address botOwner) external onlyOwner nonReentrant returns (address) {
        if (botOwner == address(0)) revert InvalidOwner();
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create a clone of the agent wallet implementation
        address agentWalletClone = Clones.clone(agentWalletImplementation);
        
        // Initialize the cloned wallet
        OqiaAgentWallet(payable(agentWalletClone)).initialize(botOwner);
        
        // Mint the ownership NFT
        _safeMint(botOwner, tokenId);
        
        // Store mappings
        botWalletOf[tokenId] = agentWalletClone;
        tokenOfWallet[agentWalletClone] = tokenId;
        
        emit BotCreated(tokenId, botOwner, agentWalletClone);
        emit AgentCreated(tokenId, botOwner, agentWalletClone);
        
        return agentWalletClone;
    }
    
    // Legacy function for backward compatibility
    function mintAgent(address to) external onlyOwner returns (uint256) {
        address wallet = createBot(to);
        return tokenOfWallet[wallet];
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory uri = _tokenURIs[tokenId];
        if (bytes(uri).length > 0) {
            return uri;
        }
        
        // Default metadata
        return string(abi.encodePacked(
            "data:application/json;base64,",
            "eyJuYW1lIjoiT3FpYSBBZ2VudCAj",
            _toString(tokenId),
            "IiwgImRlc2NyaXB0aW9uIjoiQXV0b25vbW91cyBBSSBBZ2VudCBvbiB0aGUgYmxvY2tjaGFpbiJ9"
        ));
    }
    
    function setTokenURI(uint256 tokenId, string calldata uri) external onlyOwner {
        _requireOwned(tokenId);
        _tokenURIs[tokenId] = uri;
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}