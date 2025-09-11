# OqiaBotFactory Contract Documentation

This document provides an overview of the `OqiaBotFactory` contract.

**Contract Name:** `OqiaBotFactory`

**Inherits:** `Initializable`, `ERC721Upgradeable`, `OwnableUpgradeable`, `PausableUpgradeable`, `UUPSUpgradeable`, `ReentrancyGuardUpgradeable` (all from OpenZeppelin)

**Dependencies:**
*   `@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol`
*   `@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol`
*   `@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol`
*   `@safe-global/safe-contracts/contracts/proxies/SafeProxyFactory.sol`
*   `ISafe` interface (locally defined within the contract for `setup` function)

**Errors:**
*   `InvalidOwner()`: Thrown when an invalid owner address (address(0)) is provided.
*   `InvalidMultisigSetup()`: Thrown when the multisig setup parameters (owners array or threshold) are invalid.
*   `SaltAlreadyUsed()`: Thrown when a `saltNonce` has already been used to create a bot.
*   `ProxyCreationFailed()`: Thrown if the Gnosis Safe proxy creation fails.
*   `NonexistentToken()`: Thrown when querying URI for a nonexistent token.

**State Variables:**
*   `_tokenIdCounter`: Internal counter for bot NFT token IDs.
*   `safeSingleton`: Address of the Gnosis Safe singleton contract.
*   `safeProxyFactory`: Address of the Gnosis Safe proxy factory contract.
*   `entryPoint`: Address of the Entry Point contract (for ERC-4337 compatibility).
*   `botWalletOf`: Mapping from `tokenId => bot wallet address` (Gnosis Safe proxy address).
*   `tokenOfWallet`: Mapping from `bot wallet address => tokenId`.
*   `_tokenURIs`: Mapping from `tokenId => metadata URI` for the bot NFT.
*   `usedSalts`: Mapping from `saltNonce => bool` to prevent reuse of salts for proxy creation.

**Events:**
*   `BotCreated(uint256 indexed tokenId, address indexed owner, address wallet, string metadataURI)`: Emitted when a new bot (Gnosis Safe proxy) is created and its NFT is minted.

**Functions:**

*   `initialize(string memory name_, string memory symbol_, address _safeSingleton, address _safeProxyFactory, address _entryPoint) public initializer`:
    *   Initializes the contract, setting the ERC721 name and symbol, and the addresses for the Safe singleton, Safe proxy factory, and Entry Point.
    *   Initializes inherited OpenZeppelin upgradeable contracts.

*   `createBot(address botOwner, address[] calldata owners, uint256 threshold, address fallbackHandler, string calldata metadataURI, uint256 saltNonce) external whenNotPaused nonReentrant returns (address proxy)`:
    *   Allows the contract owner to create a new Oqia Bot (Gnosis Safe proxy).
    *   Requires a valid `botOwner`, valid multisig setup (`owners` and `threshold`), and a unique `saltNonce`.
    *   Uses the `SafeProxyFactory` to create a new Gnosis Safe proxy with the provided `owners`, `threshold`, and `fallbackHandler`.
    *   Mints an ERC721 token to `botOwner` representing ownership of the new bot wallet.
    *   Stores the bot wallet address and its associated token ID.
    *   Emits a `BotCreated` event.
    *   Returns the address of the newly created proxy.

*   `tokenURI(uint256 tokenId) public view override returns (string memory)`:
    *   Returns the metadata URI for a given `tokenId`.
    *   Requires the `tokenId` to exist.

*   `pause() external onlyOwner`:
    *   Allows the contract owner to pause the contract, preventing certain operations like `createBot`.

*   `unpause() external onlyOwner`:
    *   Allows the contract owner to unpause the contract.

*   `_authorizeUpgrade(address newImplementation) internal override onlyOwner`:
    *   Internal function for UUPS upgradeability, ensuring only the owner can authorize upgrades.
