// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title OqiaBotRegistry
 * @notice Registry for Oqia bots and their profiles
 * @dev Stores bot ownership and profile information
 */
contract OqiaBotRegistry is Initializable, OwnableUpgradeable {

    /**
     * @notice Stores bot ownership and profile data
     * @param owner Address of the bot owner
     * @param profile Profile string for the bot
     */
    struct BotData {
        address owner;
        string profile;
    }

    /// @notice Maps token IDs to BotData
    mapping(uint256 => BotData) public botData;

    /// @notice Emitted when a bot is registered
    event BotRegistered(uint256 indexed tokenId, address indexed owner);
    /// @notice Emitted when a bot profile is updated
    event ProfileUpdated(uint256 indexed tokenId, string profile);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the registry contract
     * @param initialOwner The address of the contract owner
     */
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    /**
     * @notice Registers a new bot
     * @param tokenId The bot's token ID
     * @param owner The address of the bot owner
     */
    function registerBot(uint256 tokenId, address owner) external onlyOwner {
        botData[tokenId] = BotData(owner, "");
        emit BotRegistered(tokenId, owner);
    }

    /**
     * @notice Sets the profile for a bot
     * @param tokenId The bot's token ID
     * @param profile The profile string
     */
    function setProfile(uint256 tokenId, string calldata profile) external {
        require(msg.sender == botData[tokenId].owner, "Not the bot owner");
        botData[tokenId].profile = profile;
        emit ProfileUpdated(tokenId, profile);
    }

    /**
     * @notice Gets the profile for a bot
     * @param tokenId The bot's token ID
     * @return The profile string
     */
    function getProfile(uint256 tokenId) external view returns (string memory) {
        return botData[tokenId].profile;
    }
}
