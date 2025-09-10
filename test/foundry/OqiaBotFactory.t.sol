// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Test.sol";
import {OqiaBotFactory} from "../../src/OqiaBotFactory.sol";
import {ISafeProxyFactory} from "../../src/interfaces/ISafe.sol";

contract MockSafeProxyFactory is ISafeProxyFactory {
    function createProxyWithNonce(address, bytes memory, uint256) external returns (address proxy) {
        return address(0x1337);
    }
}
contract OqiaBotFactoryTest is Test {
    OqiaBotFactory public oqiaBotFactory;
    address public constant SAFE_SINGLETON_ADDR = 0x41675a0494595B422421fF325434152A62627264;
    address public constant ENTRY_POINT_ADDR = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;
    address public deployer = vm.addr(1);
    address public user1 = vm.addr(2);

    function setUp() public {
        MockSafeProxyFactory mockProxyFactory = new MockSafeProxyFactory();
        vm.prank(deployer);
        oqiaBotFactory = new OqiaBotFactory(); 
        oqiaBotFactory.initialize("Oqia Bot NFT", "OQIA", SAFE_SINGLETON_ADDR, address(mockProxyFactory), ENTRY_POINT_ADDR);
    }
    
    function test_CreateBot_Successfully() public {
        address[] memory owners = new address[](1);
        owners[0] = user1;
        vm.expectEmit(true, true, true, true);
        emit OqiaBotFactory.BotCreated(1, user1, address(0x1337), "ipfs://test");
        oqiaBotFactory.createBot(user1, owners, 1, address(0), "ipfs://test", 123);
        assertEq(oqiaBotFactory.ownerOf(1), user1);
    }
}
