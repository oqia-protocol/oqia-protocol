// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./OqiaAgentWallet.sol";

/**
 * @title OqiaBotFactory
 * @notice Factory contract for creating Oqia agent wallets with ERC721 ownership tokens.
 * @dev Deploys agent wallets and mints ERC721 tokens representing ownership.
 */
contract OqiaBotFactory is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    /// @notice Fee required to create a new agent
    uint256 public agentCreationFee;
    /// @notice Royalty basis points (e.g., 50 = 0.5%)
    uint96 public royaltyBps;
    /// @notice Address that receives fees and royalties
    address public feeRecipient;

    string public version;

    /// @notice Emitted when agent creation fee is updated
    event AgentCreationFeeUpdated(uint256 newFee);
    /// @notice Emitted when royalty info is updated
    event RoyaltyInfoUpdated(address recipient, uint96 bps);

    /// @notice Thrown when fee is incorrect
    error IncorrectFee();

    /// @dev ERC-2981 interface id
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;
    /// @notice Address of the agent wallet implementation contract
    address public agentWalletImplementation;
    /// @notice Maps token IDs to bot wallet addresses
    mapping(uint256 => address) public botWalletOf;
    /// @notice Maps wallet addresses to token IDs
    mapping(address => uint256) public tokenOfWallet;
    /// @notice Maps token IDs to their metadata URIs
    mapping(uint256 => string) private _tokenURIs;
    
    /// @notice Emitted when a bot is created
    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet);
    /// @notice Emitted when an agent is created
    event AgentCreated(uint256 indexed tokenId, address indexed owner, address agentWallet);
    
    /// @notice Thrown when the owner address is invalid
    error InvalidOwner();
    /// @notice Thrown when wallet creation fails
    error WalletCreationFailed();
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initializes the factory contract
     * @param _agentWalletImplementation The address of the agent wallet implementation
     */
    function initialize(address _agentWalletImplementation) public initializer {
        __ERC721_init("Oqia Agent", "OQIA");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        agentWalletImplementation = _agentWalletImplementation;
        _tokenIdCounter = 1; // Start from 1
        agentCreationFee = 0.001 ether;
        royaltyBps = 50; // 0.5%
        feeRecipient = msg.sender;
        version = "1";
    }

    function reinitialize(uint256 _version) public reinitializer(2) {
        version = string(abi.encodePacked(_toString(_version)));
    }
    
    function createBot(address botOwner) external payable onlyOwner nonReentrant whenNotPaused returns (address) {
        return _createBot(botOwner, msg.value);
    }

    function _createBot(address botOwner, uint256 feeAmount) internal returns (address) {
        if (botOwner == address(0)) revert InvalidOwner();
        if (feeAmount != agentCreationFee) revert IncorrectFee();

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

        // Transfer fee to recipient
        payable(feeRecipient).transfer(feeAmount);

        emit BotCreated(tokenId, botOwner, agentWalletClone);
        emit AgentCreated(tokenId, botOwner, agentWalletClone);

        return agentWalletClone;
    }
    
    // Legacy function for backward compatibility
    function mintAgent(address to) public payable onlyOwner whenNotPaused returns (uint256) {
        address wallet = _createBot(to, msg.value);
        return tokenOfWallet[wallet];
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
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

    /// @notice Set agent creation fee
    function setAgentCreationFee(uint256 fee) external onlyOwner {
        agentCreationFee = fee;
        emit AgentCreationFeeUpdated(fee);
    }

    /// @notice Set royalty info
    function setRoyaltyInfo(address recipient, uint96 bps) external onlyOwner {
        feeRecipient = recipient;
        royaltyBps = bps;
        emit RoyaltyInfoUpdated(recipient, bps);
    }

    /// @dev ERC-2981 royalty info
    function royaltyInfo(uint256, uint256 salePrice) external view returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyBps) / 10000;
        return (feeRecipient, royaltyAmount);
    }

    /// @dev ERC165 support for ERC-2981
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId) || interfaceId == _INTERFACE_ID_ERC2981;
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