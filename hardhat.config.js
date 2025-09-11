require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-foundry");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.22",
        settings: {
            optimizer: { enabled: true, runs: 200 },
        },
    },
    networks: {
        sepolia: {
            url: process.env.ALCHEMY_SEPOLIA_RPC_URL || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: { sepolia: process.env.ETHERSCAN_API_KEY || "" },
    },
    sourcify: { enabled: true },
    paths: {
        sources: "./src",
        tests: "./test"
    },
};
