// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title SimpleArbitrageLicense
 * @notice ERC721 license contract for Oqia Simple Arbitrage module
 * @dev Allows minting of licenses for arbitrage module usage
 */
contract SimpleArbitrageLicense is ERC721, ERC721Enumerable, Ownable {
    /// @notice Price to mint a license
    uint256 public constant MINT_PRICE = 0.1 ether;
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;

    /**
     * @notice Constructs the license contract
     */
    constructor() ERC721("Oqia Simple Arbitrage License", "OQIA-SA") Ownable(msg.sender) {}

    /**
     * @notice Mints a new license token
     * @param to The address to mint to
     */
    function mint(address to) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        _safeMint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }

    /**
     * @notice Checks supported interfaces
     * @param interfaceId The interface ID
     * @return True if supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Increases balance for an account
     * @param account The account address
     * @param value The value to increase
     */
    function _increaseBalance(address account, uint128 value) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Updates token ownership
     * @param to The new owner address
     * @param tokenId The token ID
     * @param auth The authorized address
     * @return The previous owner address
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
}