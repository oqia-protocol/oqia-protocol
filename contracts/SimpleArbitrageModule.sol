// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISafe.sol";

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
    address public immutable owner; // The deployer of this module
    IUniswapV2Router public immutable uniswapRouter;

    // A simple security measure: only the Safe wallet can call this module
    modifier onlySafe(address safe) {
        require(msg.sender == safe, "Only the authorized Safe can call this");
        _;
    }

    constructor(address _router) {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router(_router);
    }

    /// @notice Executes a simple A -> B -> A arbitrage trade.
    /// @param safe The address of the agent's Safe wallet executing the trade.
    /// @param tokenA The address of the starting and ending token (e.g., WETH).
    /// @param tokenB The address of the intermediate token (e.g., USDC).
    /// @param amountIn The amount of tokenA to start the trade with.
    function executeArbitrage(address safe, address tokenA, address tokenB, uint256 amountIn) external onlySafe(safe) {
        if (amountIn == 0) {
            return; // Nothing to do
        }

        // Step 1: Pull tokens from the Safe to this module.
        // This requires the Safe to have approved this module to spend its tokenA.
        IERC20(tokenA).transferFrom(safe, address(this), amountIn);

        // Step 2: Approve the Uniswap router to spend the module's newly acquired tokenA
        IERC20(tokenA).approve(address(uniswapRouter), amountIn);
        
        // Step 3: Define the swap paths
        address[] memory path1 = new address[](2);
        path1[0] = tokenA;
        path1[1] = tokenB;

        address[] memory path2 = new address[](2);
        path2[0] = tokenB;
        path2[1] = tokenA;

        // Step 4: Execute the first swap (A -> B)
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            0, // We accept any amount out for this simple example
            path1,
            address(this), // The intermediate tokens are sent to this module contract
            block.timestamp
        );
        
        uint amountTokenB = amounts[1];

        // Step 5: Approve the router to spend the module's newly acquired tokenB
        IERC20(tokenB).approve(address(uniswapRouter), amountTokenB);

        // Step 6: Execute the second swap (B -> A)
        uniswapRouter.swapExactTokensForTokens(
            amountTokenB,
            0, // Slippage control would be critical here in a real bot
            path2,
            safe, // The final tokens (and any profit) are sent back to the Safe wallet
            block.timestamp
        );
    }
}