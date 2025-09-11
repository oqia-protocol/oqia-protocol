const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleArbitrageModule", function () {
    let SimpleArbitrageModule;
    let mockERC20A, mockERC20B;
    let mockUniswapRouter;
    let deployer, safe, other;

    // Mock ERC20 Contract
    async function deployMockERC20(name, symbol) {
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const mockERC20 = await MockERC20.deploy(name, symbol);
        await mockERC20.waitForDeployment();
        return mockERC20;
    }

    // Mock Uniswap V2 Router Contract
    async function deployMockUniswapRouter() {
        const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
        const mockUniswapRouter = await MockUniswapRouter.deploy();
        await mockUniswapRouter.waitForDeployment();
await mockERC20B.mint(mockUniswapRouter.target, ethers.parseEther("1000"));
await mockERC20B.mint(mockUniswapRouter.target, ethers.parseEther("1000"));
        return mockUniswapRouter;
    }

    before(async function () {
        [deployer, safe, other] = await ethers.getSigners();

        // Deploy Mock ERC20 contracts
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        mockERC20A = await MockERC20Factory.deploy("Token A", "TKA");
        await mockERC20A.waitForDeployment();
        mockERC20B = await MockERC20Factory.deploy("Token B", "TKB");
        await mockERC20B.waitForDeployment();

        // Deploy Mock Uniswap Router
        const MockUniswapRouterFactory = await ethers.getContractFactory("MockUniswapRouter");
        mockUniswapRouter = await MockUniswapRouterFactory.deploy();
        await mockUniswapRouter.waitForDeployment();
await mockERC20B.mint(mockUniswapRouter.target, ethers.parseEther("1000"));
await mockERC20B.mint(mockUniswapRouter.target, ethers.parseEther("1000"));

        // Deploy SimpleArbitrageModule
        SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
        simpleArbitrageModule = await SimpleArbitrageModule.deploy(mockUniswapRouter.target);
        await simpleArbitrageModule.waitForDeployment();
    });

    // Helper function to mint tokens to an address
    async function mintTokens(token, to, amount) {
        await token.mint(to, amount);
    }

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await simpleArbitrageModule.owner()).to.equal(deployer.address);
        });

        it("Should set the correct Uniswap Router address", async function () {
            expect(await simpleArbitrageModule.uniswapRouter()).to.equal(mockUniswapRouter.target);
        });
    });

    describe("Access Control", function () {
        it("Should allow only the authorized Safe to call executeArbitrage", async function () {
            const amountIn = ethers.parseEther("100");
            await mintTokens(mockERC20A, safe.address, amountIn);
await mockERC20A.connect(safe).approve(simpleArbitrageModule.target, amountIn);

            // Attempt to call from 'other' account, should revert
            await expect(
                simpleArbitrageModule.connect(other).executeArbitrage(
                    safe.address,
                    mockERC20A.target,
                    mockERC20B.target,
                    amountIn
                )
            ).to.be.revertedWith("Only the authorized Safe can call this");

            // Call from 'safe' account, should not revert (further checks in executeArbitrage tests)
            await expect(
                simpleArbitrageModule.connect(safe).executeArbitrage(
                    safe.address,
                    mockERC20A.target,
                    mockERC20B.target,
                    amountIn
                )
            ).to.not.be.reverted;
        });
    });

    describe("executeArbitrage", function () {
        const initialAmountA = ethers.parseEther("100");
        const expectedAmountB = ethers.parseEther("90"); // Mocked swap result
        const expectedReturnAmountA = ethers.parseEther("95"); // Mocked arbitrage profit

        beforeEach(async function () {
            // Reset balances and approvals for each test

            await mintTokens(mockERC20A, safe.address, initialAmountA);

            // Configure mock router for predictable swaps
            await mockUniswapRouter.setSwapResults([expectedAmountB, expectedReturnAmountA]);
        });

        it("Should execute a successful arbitrage trade and return profit to Safe", async function () {
            // Initial balances
            expect(await mockERC20A.balanceOf(safe.address)).to.equal(initialAmountA);
            expect(await mockERC20B.balanceOf(safe.address)).to.equal(0);

            // Execute arbitrage from the Safe wallet
            await simpleArbitrageModule.connect(safe).executeArbitrage(
                safe.address,
                mockERC20A.target,
                mockERC20B.target,
                initialAmountA
            );

            // Verify final balances
            expect(await mockERC20A.balanceOf(safe.address)).to.equal(expectedReturnAmountA);
            expect(await mockERC20B.balanceOf(safe.address)).to.equal(0);

            // Verify intermediate balances (module should be empty after trade)
            expect(await mockERC20A.balanceOf(simpleArbitrageModule.target)).to.equal(0);
            expect(await mockERC20B.balanceOf(simpleArbitrageModule.target)).to.equal(0);
        });

        it("Should handle zero amountIn gracefully", async function () {
    await mockERC20A.connect(safe).approve(simpleArbitrageModule.target, ethers.parseEther("100"));
            await simpleArbitrageModule.connect(safe).executeArbitrage(
                safe.address,
                mockERC20A.target,
                mockERC20B.target,
                0
            );

            expect(await mockERC20A.balanceOf(safe.address)).to.equal(initialAmountA); // No change
            expect(await mockERC20B.balanceOf(safe.address)).to.equal(0);
        });
    });
});

