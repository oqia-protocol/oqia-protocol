// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract OqiaModuleRegistry is Initializable, ERC721Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    error ModuleAlreadyRegistered();
    error ModuleNotRegistered();
    error InvalidModuleOwner();

    uint256 private _moduleIdCounter;
    mapping(uint256 => address) public moduleAddressOf; // tokenId => module contract address
    mapping(address => uint256) public moduleIdOfAddress; // module contract address => tokenId
    mapping(uint256 => string) private _moduleURIs; // tokenId => metadata URI

    event ModuleRegistered(uint256 indexed moduleId, address indexed moduleAddress, address indexed owner, string metadataURI);
    event ModuleLicenseMinted(uint256 indexed moduleId, address indexed to, uint256 indexed licenseId);

    function initialize(string memory name_, string memory symbol_) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    error InvalidModuleAddress();

    function registerModule(address moduleAddress, string calldata metadataURI) external onlyOwner whenNotPaused nonReentrant returns (uint256 moduleId) {
        if (moduleAddress == address(0)) revert InvalidModuleAddress();
        if (moduleIdOfAddress[moduleAddress] != 0) revert ModuleAlreadyRegistered();

        moduleId = ++_moduleIdCounter;
        moduleAddressOf[moduleId] = moduleAddress;
        moduleIdOfAddress[moduleAddress] = moduleId;
        _moduleURIs[moduleId] = metadataURI;

        emit ModuleRegistered(moduleId, moduleAddress, msg.sender, metadataURI);
    }

    function mintModuleLicense(uint256 moduleId, address to) external onlyOwner whenNotPaused nonReentrant {
        if (moduleAddressOf[moduleId] == address(0)) revert ModuleNotRegistered();
        if (to == address(0)) revert InvalidModuleOwner();

        _safeMint(to, moduleId); // Using moduleId as licenseId for simplicity for now
        emit ModuleLicenseMinted(moduleId, to, moduleId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");
        return _moduleURIs[tokenId];
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
