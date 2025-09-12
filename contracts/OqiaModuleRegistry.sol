// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "./interfaces/IOqiaBotFactory.sol";

contract OqiaModuleRegistry is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC2981Upgradeable
{
    // --- Errors ---
    error ModuleAlreadyRegistered();
    error ModuleNotRegistered();
    error InvalidModuleOwner();
    error InvalidModuleAddress();
    error InvalidDeveloperAddress();
    error IncorrectPayment();
    error TransferFailed();
    error ZeroAddress();
    error FactoryNotSet();

    // --- Structs ---
    struct ModuleInfo {
        address moduleAddress;
        address developer;
        uint96 royaltyBps;
        uint256 price;
        string metadataURI;
    }

    // --- State Variables ---
    uint256 private _licenseIdCounter;
    uint256 private _moduleIdCounter;

    mapping(uint256 => ModuleInfo) public moduleInfoOf;
    mapping(address => uint256) public moduleIdOfAddress;
    mapping(uint256 => uint256) public licenseIdToModuleId;
    mapping(address => mapping(uint256 => uint256)) public licenseCount; // owner => moduleId => count

    address public protocolTreasury;
    IOqiaBotFactory public oqiaBotFactory;

    uint256 public constant PLATFORM_FEE_BPS = 2000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // --- Events ---
    event ModuleRegistered(uint256 indexed moduleId, address indexed moduleAddress, address indexed developer, uint256 price, string metadataURI);
    event ModuleLicenseMinted(uint256 indexed moduleId, uint256 indexed licenseId, address indexed to, uint256 price);
    event BotFactoryAddressSet(address indexed factoryAddress);

    // --- Initializer ---
    function initialize(string memory name_, string memory symbol_, address _protocolTreasury) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __ERC2981_init();
        if (_protocolTreasury == address(0)) revert ZeroAddress();
        protocolTreasury = _protocolTreasury;
    }

    // --- Owner Functions ---
    function setBotFactoryAddress(address _factoryAddress) external onlyOwner {
        if (_factoryAddress == address(0)) revert ZeroAddress();
        oqiaBotFactory = IOqiaBotFactory(_factoryAddress);
        emit BotFactoryAddressSet(_factoryAddress);
    }

    function registerModule(
        address moduleAddress,
        address developer,
        uint256 price,
        uint96 royaltyBps,
        string calldata metadataURI
    ) external onlyOwner whenNotPaused nonReentrant returns (uint256 moduleId) {
        if (moduleAddress == address(0)) revert InvalidModuleAddress();
        if (developer == address(0)) revert InvalidDeveloperAddress();
        if (moduleIdOfAddress[moduleAddress] != 0) revert ModuleAlreadyRegistered();

        moduleId = ++_moduleIdCounter;
        moduleIdOfAddress[moduleAddress] = moduleId;

        moduleInfoOf[moduleId] = ModuleInfo({
            moduleAddress: moduleAddress,
            developer: developer,
            royaltyBps: royaltyBps,
            price: price,
            metadataURI: metadataURI
        });

        emit ModuleRegistered(moduleId, moduleAddress, developer, price, metadataURI);
    }

    // --- Public Functions ---
    function mintModuleLicense(uint256 moduleId, address to) public payable whenNotPaused nonReentrant {
        ModuleInfo storage moduleInfo = moduleInfoOf[moduleId];
        if (moduleInfo.moduleAddress == address(0)) revert ModuleNotRegistered();
        if (to == address(0)) revert ZeroAddress();
        if (msg.value != moduleInfo.price) revert IncorrectPayment();

        uint256 platformFee = (moduleInfo.price * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 developerShare = moduleInfo.price - platformFee;

        (bool successTreasury, ) = protocolTreasury.call{value: platformFee}("");
        if (!successTreasury) revert TransferFailed();

        (bool successDev, ) = moduleInfo.developer.call{value: developerShare}("");
        if (!successDev) revert TransferFailed();

        uint256 licenseId = ++_licenseIdCounter;
        licenseIdToModuleId[licenseId] = moduleId;
        // The _beforeTokenTransfer hook will handle updating the licenseCount
        _safeMint(to, licenseId);

        emit ModuleLicenseMinted(moduleId, licenseId, to, moduleInfo.price);
    }

    // --- View Functions & Overrides ---
    function hasModuleLicense(address botWallet, uint256 moduleId) public view returns (bool) {
        if (address(oqiaBotFactory) == address(0)) revert FactoryNotSet();

        uint256 botTokenId = oqiaBotFactory.tokenOfWallet(botWallet);
        if (botTokenId == 0) return false; // Not a valid bot wallet

        address botOwner = oqiaBotFactory.ownerOf(botTokenId);
        if (botOwner == address(0)) return false; // Should not happen if token exists

        return licenseCount[botOwner][moduleId] > 0;
    }

    function tokenURI(uint256 licenseId) public view override returns (string memory) {
        _requireOwned(licenseId);
        uint256 moduleId = licenseIdToModuleId[licenseId];
        return moduleInfoOf[moduleId].metadataURI;
    }

    function royaltyInfo(uint256 licenseId, uint256 _salePrice)
        public
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        _requireOwned(licenseId);
        uint256 moduleId = licenseIdToModuleId[licenseId];
        ModuleInfo storage moduleInfo = moduleInfoOf[moduleId];
        receiver = moduleInfo.developer;
        royaltyAmount = (_salePrice * moduleInfo.royaltyBps) / BPS_DENOMINATOR;
        return (receiver, royaltyAmount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        uint256 moduleId = licenseIdToModuleId[tokenId];
        address from = _ownerOf(tokenId);

        // Update license count before the transfer
        if (from != address(0)) {
            licenseCount[from][moduleId] -= 1;
        }
        if (to != address(0)) {
            licenseCount[to][moduleId] += 1;
        }

        // The 'auth' parameter is new in v5 for transfer approvals.
        // We call the parent _update function to execute the actual transfer.
        return super._update(to, tokenId, auth);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
