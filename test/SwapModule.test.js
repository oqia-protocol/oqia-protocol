const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SwapModule", function () {
    let SwapModule, module, OqiaAgentWallet, wallet, MockERC20, tokenIn, tokenOut, owner, otherAccount, uniswapRouter;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        // A simple mock for the Uniswap router
        const UniswapRouter = await ethers.getContractFactory("UniswapV2RouterMock");
        uniswapRouter = await UniswapRouter.deploy();
        await uniswapRouter.waitForDeployment();

        // Deploy the OqiaAgentWallet contract
        OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
        wallet = await upgrades.deployProxy(OqiaAgentWallet, [owner.address], { initializer: 'initialize' });
        await wallet.waitForDeployment();

        // Deploy the SwapModule contract
        SwapModule = await ethers.getContractFactory("SwapModule");
        module = await SwapModule.deploy(uniswapRouter.target);
        await module.waitForDeployment();

        // Deploy mock ERC20 tokens
        MockERC20 = await ethers.getContractFactory("MockERC20");
        tokenIn = await MockERC20.deploy("Token A", "TKA", ethers.parseEther("1000"));
        await tokenIn.waitForDeployment();
        tokenOut = await MockERC20.deploy("Token B", "TKB", ethers.parseEther("1000"));
        await tokenOut.waitForDeployment();

        // Transfer some tokens to the wallet
        await tokenIn.transfer(wallet.target, ethers.parseEther("10"));
        await tokenOut.transfer(uniswapRouter.target, ethers.parseEther("20"));

        // Authorize the module
        await wallet.connect(owner).authorizeModule(module.target, true);
        
        // Have the wallet approve the module to spend tokenIn
        const approveData = tokenIn.interface.encodeFunctionData("approve", [module.target, ethers.parseEther("10")]);
        await wallet.connect(owner).execute(tokenIn.target, 0, approveData);
    });

    it("Should swap tokens", async function () {
        const amountIn = ethers.parseEther("1");

        // Encode the data for the swap function
        const swapData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256"],
            [tokenIn.target, tokenOut.target, amountIn]
        );

        // Encode the function call to the module's execute function
        const moduleInterface = SwapModule.interface;
        const data = moduleInterface.encodeFunctionData("execute", [wallet.target, swapData]);

        // Execute the module function through the wallet
        await wallet.connect(owner).execute(module.target, 0, data);

        expect(await tokenIn.balanceOf(wallet.target)).to.equal(ethers.parseEther("9"));
        expect(await tokenOut.balanceOf(wallet.target)).to.equal(ethers.parseEther("2"));
    });
});
