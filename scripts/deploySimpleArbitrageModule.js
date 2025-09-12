const { ethers } = require("hardhat");
require("dotenv").config();

// SAFETY: set SKIP_DEPLOY=1 to avoid running deployments in CI/local checks
if (process.env.SKIP_DEPLOY) {
    console.log("SKIP_DEPLOY is set — aborting deployment script.");
    process.exit(0);
}

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const SimpleArbitrageModule = await ethers.getContractFactory("SimpleArbitrageModule");
    // Replace with a real Uniswap V2 Router address for actual deployment
    // For local testing, any valid address will work as a placeholder.
    const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; 
    const simpleArbitrageModule = await SimpleArbitrageModule.deploy(uniswapRouterAddress);

    await simpleArbitrageModule.waitForDeployment();

    console.log("SimpleArbitrageModule deployed to:", simpleArbitrageModule.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });