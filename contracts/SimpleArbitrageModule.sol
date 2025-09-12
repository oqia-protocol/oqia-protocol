// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IOqiaModuleRegistry.sol";

// A simplified interface for Uniswap V2 Router
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

// A simplified interface for an ERC20 token
interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SimpleArbitrageModule {
    address public immutable owner;
    IUniswapV2Router public immutable uniswapRouter;
    IOqiaModuleRegistry public immutable moduleRegistry;
    uint256 public immutable moduleId;

    modifier onlySafe(address safe) {
        require(msg.sender == safe, "OQIA: Caller is not the authorized Safe");
        _;
    }

    modifier requiresLicense(address user) {
        require(moduleRegistry.hasModuleLicense(user, moduleId), "OQIA: No valid license for module");
        _;
    }

    constructor(address _router, address _registry, uint256 _moduleId) {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router(_router);
        moduleRegistry = IOqiaModuleRegistry(_registry);
        moduleId = _moduleId;
    }

    function executeArbitrage(address safe, address tokenA, address tokenB, uint256 amountIn) external onlySafe(safe) requiresLicense(safe) {
        if (amountIn == 0) {
            return;
        }

        IERC20(tokenA).transferFrom(safe, address(this), amountIn);
        IERC20(tokenA).approve(address(uniswapRouter), amountIn);
        
        address[] memory path1 = new address[](2);
        path1[0] = tokenA;
        path1[1] = tokenB;

        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            0,
            path1,
            address(this),
            block.timestamp
        );
        
        uint amountTokenB = amounts[1];

        address[] memory path2 = new address[](2);
        path2[0] = tokenB;
        path2[1] = tokenA;

        IERC20(tokenB).approve(address(uniswapRouter), amountTokenB);

        uniswapRouter.swapExactTokensForTokens(
            amountTokenB,
            0,
            path2,
            safe,
            block.timestamp
        );
    }
}
