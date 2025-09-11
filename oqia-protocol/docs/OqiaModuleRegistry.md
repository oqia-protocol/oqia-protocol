# OqiaModuleRegistry Contract Documentation

This document provides an overview of the `OqiaModuleRegistry` contract.

**Contract Name:** `OqiaModuleRegistry`

**Inherits:** `Initializable`, `ERC721Upgradeable`, `OwnableUpgradeable`, `PausableUpgradeable`, `UUPSUpgradeable`, `ReentrancyGuardUpgradeable` (all from OpenZeppelin)

**Dependencies:**
*   `@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol`
*   `@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol`

**Errors:**
*   `ModuleAlreadyRegistered()`: Thrown when attempting to register a module that is already registered.
*   `ModuleNotRegistered()`: Thrown when attempting to mint a license for a module that is not registered.
*   `InvalidModuleOwner()`: Thrown when attempting to mint a license to an invalid address (address(0)).
*   `InvalidModuleAddress()`: Thrown when an invalid module address (address(0)) is provided during registration.

**State Variables:**
*   `_moduleIdCounter`: Internal counter for module IDs.
*   `moduleAddressOf`: Mapping from `moduleId => module contract address`.
*   `moduleIdOfAddress`: Mapping from `module contract address => moduleId`.
*   `_moduleURIs`: Mapping from `moduleId => metadata URI` for the module license NFT.

**Events:**
*   `ModuleRegistered(uint256 indexed moduleId, address indexed moduleAddress, address indexed owner, string metadataURI)`: Emitted when a new module is registered.
*   `ModuleLicenseMinted(uint256 indexed moduleId, address indexed to, uint256 indexed licenseId)`: Emitted when a module license is minted.

**Functions:**

*   `initialize(string memory name_, string memory symbol_) public initializer`:
    *   Initializes the contract, setting the ERC721 name and symbol for the module licenses.
    *   Initializes inherited OpenZeppelin upgradeable contracts.

*   `registerModule(address moduleAddress, string calldata metadataURI) external onlyOwner whenNotPaused nonReentrant returns (uint256 moduleId)`:
    *   Allows the contract owner to register a new module.
    *   Requires a valid `moduleAddress` and that the module is not already registered.
    *   Assigns a new `moduleId`, stores the module's address and metadata URI.
    *   Emits a `ModuleRegistered` event.
    *   Returns the newly assigned `moduleId`.

*   `mintModuleLicense(uint256 moduleId, address to) external onlyOwner whenNotPaused nonReentrant`:
    *   Allows the contract owner to mint a module license (ERC721 token) for a registered module.
    *   Requires the `moduleId` to be registered and `to` to be a valid address.
    *   Mints an ERC721 token (using `moduleId` as `licenseId`) to the `to` address.
    *   Emits a `ModuleLicenseMinted` event.

*   `tokenURI(uint256 tokenId) public view override returns (string memory)`:
    *   Returns the metadata URI for a given `tokenId` (module license).
    *   Requires the `tokenId` to exist.

*   `pause() external onlyOwner`:
    *   Allows the contract owner to pause the contract, preventing certain operations like `registerModule` and `mintModuleLicense`.

*   `unpause() external onlyOwner`:
    *   Allows the contract owner to unpause the contract.

*   `_authorizeUpgrade(address newImplementation) internal override onlyOwner`:
    *   Internal function for UUPS upgradeability, ensuring only the owner can authorize upgrades.
