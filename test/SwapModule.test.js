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

        // Install the module
        const signature = ethers.id("swap(address,address,uint256)").substring(0, 10);
        await wallet.connect(owner).installModule(signature, module.target);
    });

    it("Should swap tokens", async function () {
        const amountIn = ethers.parseEther("1");

        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256"],
            [tokenIn.target, tokenOut.target, amountIn]
        );

        const signature = ethers.id("swap(address,address,uint256)").substring(0, 10);
        await wallet.connect(owner).executeModule(signature, data);

        expect(await tokenIn.balanceOf(wallet.target)).to.equal(ethers.parseEther("9"));
        expect(await tokenOut.balanceOf(wallet.target)).to.equal(ethers.parseEther("2"));
    });
});
