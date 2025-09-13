// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapV2RouterMock {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        // Simulate the transfer of tokens from the sender to the contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Simulate the swap by transferring a fixed amount of the output token
        uint amountOut = 2 * 10**18; // Swap 1 token for 2
        IERC20(tokenOut).transfer(to, amountOut);

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        return amounts;
    }
}
