// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract OqiaBotRegistry is Initializable, OwnableUpgradeable {

    struct BotData {
        address owner;
        string profile;
    }

    mapping(uint256 => BotData) public botData;

    event BotRegistered(uint256 indexed tokenId, address indexed owner);
    event ProfileUpdated(uint256 indexed tokenId, string profile);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function registerBot(uint256 tokenId, address owner) external onlyOwner {
        botData[tokenId] = BotData(owner, "");
        emit BotRegistered(tokenId, owner);
    }

    function setProfile(uint256 tokenId, string calldata profile) external {
        require(msg.sender == botData[tokenId].owner, "Not the bot owner");
        botData[tokenId].profile = profile;
        emit ProfileUpdated(tokenId, profile);
    }

    function getProfile(uint256 tokenId) external view returns (string memory) {
        return botData[tokenId].profile;
    }
}
