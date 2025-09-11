// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract SimpleArbitrageLicense is ERC721, ERC721Enumerable, Ownable {
    uint256 public constant MINT_PRICE = 0.1 ether;
    uint256 private _tokenIdCounter;

    constructor() ERC721("Oqia Simple Arbitrage License", "OQIA-SA") Ownable(msg.sender) {}

    function mint(address to) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        _safeMint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _increaseBalance(address account, uint128 value) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
}