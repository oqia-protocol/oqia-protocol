// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A mock Gnosis Safe for testing purposes
contract MockSafe {
    address[] public owners;
    mapping(address => bool) public isOwner;

    event ExecutionSuccess(address to, uint256 value, bytes data);
    event ExecutionFailure(address to, uint256 value, bytes data);

    constructor(address[] memory _owners) {
        for (uint i = 0; i < _owners.length; i++) {
            owners.push(_owners[i]);
            isOwner[_owners[i]] = true;
        }
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    // This is a mock function. In a real Safe, this would be a call to the module.
    function execTransactionFromModule(address to, uint256 value, bytes calldata data, uint8 /*operation*/)
        external
        returns (bool success)
    {
        (success, ) = to.call{value: value}(data);
        if (success) {
            emit ExecutionSuccess(to, value, data);
        } else {
            emit ExecutionFailure(to, value, data);
        }
    }
}
