// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/ISafe.sol";

contract OqiaBotFactory is Initializable, ERC721Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    error InvalidOwner();
    error InvalidMultisigSetup();
    error SaltAlreadyUsed();
    error ProxyCreationFailed();
    error NonexistentToken();
    CountersUpgradeable.Counter private _tokenIdCounter;
    address public safeSingleton;
    address public safeProxyFactory;
    address public entryPoint;
    mapping(uint256 => address) public botWalletOf;
    mapping(address => uint256) public tokenOfWallet;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bool) public usedSalts;
    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet, string metadataURI);

    constructor() { _disableInitializers(); }

    function initialize(string memory name_, string memory symbol_, address _safeSingleton, address _safeProxyFactory, address _entryPoint) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        safeSingleton = _safeSingleton;
        safeProxyFactory = _safeProxyFactory;
        entryPoint = _entryPoint;
    }

    function createBot(address botOwner, address[] calldata owners, uint256 threshold, address fallbackHandler, string calldata metadataURI, uint256 saltNonce) external whenNotPaused nonReentrant returns (address proxy) {
        if (botOwner == address(0)) revert InvalidOwner();
        if (owners.length == 0 || threshold == 0 || threshold > owners.length) revert InvalidMultisigSetup();
        if (usedSalts[saltNonce]) revert SaltAlreadyUsed();
        usedSalts[saltNonce] = true;
        bytes memory initializer = abi.encodeWithSelector(ISafe.setup.selector, owners, threshold, address(0), bytes(""), fallbackHandler, address(0), 0, payable(address(0)));
        proxy = ISafeProxyFactory(safeProxyFactory).createProxyWithNonce(safeSingleton, initializer, saltNonce);
        if (proxy == address(0)) revert ProxyCreationFailed();
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        botWalletOf[tokenId] = proxy;
        tokenOfWallet[proxy] = tokenId;
        _safeMint(botOwner, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        emit BotCreated(tokenId, botOwner, proxy, metadataURI);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert NonexistentToken();
        return _tokenURIs[tokenId];
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
