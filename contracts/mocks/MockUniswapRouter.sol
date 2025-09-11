pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract MockUniswapRouter {
    uint256[] public swapResults;
    uint256 public swapCounter;

    function setSwapResults(uint256[] memory results) public {
        swapResults = results;
        swapCounter = 0;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(path.length == 2, "MockRouter: Invalid path");
        require(swapCounter < swapResults.length, "MockRouter: No more swap results configured");

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        uint256 returnAmount = swapResults[swapCounter];
        swapCounter++;

        IERC20(path[1]).transfer(to, returnAmount);

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = returnAmount;
    }
}
