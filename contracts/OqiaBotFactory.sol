// SPDX-License-Identifier: MIT
// Deployed Proxy Address (Sepolia): 0x4B1C1Ad87B6282314D3CaBE0FFF518b020c4dC61
// Deployed Implementation Address (Sepolia): 0x39570EF64a95e61D759ba2276f8abb163D62714C
// OqiaModuleRegistry Proxy Address (Sepolia): 0x5daa57C6cBACA0740abbd23Af85f8A5921cb5bC1
// OqiaModuleRegistry Implementation Address (Sepolia): 0xFc7A3B8646a0BD9C78fBF208EC0651f285837418
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "./vendor/safe-contracts/SafeProxyFactory.sol";

interface ISafe {
    function setup(
        address[] calldata _owners,
        uint256 _threshold,
        address to,
        bytes calldata data,
        address fallbackHandler,
        address paymentToken,
        uint256 payment,
        address payable paymentReceiver
    ) external;
}

contract OqiaBotFactory is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    error InvalidOwner();
    error InvalidMultisigSetup();
    error SaltAlreadyUsed();
    error ProxyCreationFailed();
    error NonexistentToken();

    uint256 private _tokenIdCounter;
    address public safeSingleton;
    address public safeProxyFactory;
    address public entryPoint;
    mapping(uint256 => address) public botWalletOf;
    mapping(address => uint256) public tokenOfWallet;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bool) public usedSalts;

    event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet, string metadataURI);

    function initialize(
        string memory name_,
        string memory symbol_,
        address _safeSingleton,
        address _safeProxyFactory,
        address _entryPoint
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        safeSingleton = _safeSingleton;
        safeProxyFactory = _safeProxyFactory;
        entryPoint = _entryPoint;
    }

    function createBot(
        address botOwner,
        address[] calldata owners,
        uint256 threshold,
        address fallbackHandler,
        string calldata metadataURI,
        uint256 saltNonce
    ) external whenNotPaused nonReentrant returns (address proxy) {
        if (botOwner == address(0)) revert InvalidOwner();
        if (owners.length == 0 || threshold == 0 || threshold > owners.length) revert InvalidMultisigSetup();
        if (usedSalts[saltNonce]) revert SaltAlreadyUsed();
        usedSalts[saltNonce] = true;
        bytes memory initializer = abi.encodeWithSelector(
            ISafe.setup.selector,
            owners,
            threshold,
            address(0),
            bytes(""),
            fallbackHandler,
            address(0),
            0,
            payable(address(0))
        );
        proxy = address(SafeProxyFactory(safeProxyFactory).createProxyWithNonce(safeSingleton, initializer, saltNonce));
        if (proxy == address(0)) revert ProxyCreationFailed();
        uint256 tokenId = ++_tokenIdCounter;
        botWalletOf[tokenId] = proxy;
        tokenOfWallet[proxy] = tokenId;
        _safeMint(botOwner, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        emit BotCreated(tokenId, botOwner, proxy, metadataURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
