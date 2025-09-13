// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../modules/IOqiaModule.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SwapModule is IOqiaModule {
    IUniswapV2Router02 public immutable uniswapRouter;

    constructor(address _uniswapRouter) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    function execute(address from, bytes calldata data) external override returns (bytes memory) {
        (address tokenIn, address tokenOut, uint256 amountIn) = abi.decode(data, (address, address, uint256));

        // Approve the router to spend the tokens
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        // The path is the sequence of tokens to trade through.
        // For a direct swap, it's just the input and output tokens.
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // We are swapping an exact amount of tokens for as many output tokens as possible.
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            0, // We accept any amount of output tokens
            path,
            from, // The tokens will be sent back to the wallet
            block.timestamp
        );

        return abi.encode(amounts);
    }
}
