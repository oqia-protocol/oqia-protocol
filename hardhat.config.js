require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@typechain/hardhat");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: false,
                runs: 200,
            },
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    networks: {
        hardhat: {},
        sepolia: {
            url: process.env.ALCHEMY_SEPOLIA_RPC_URL || "",
            accounts:
        process.env.DEPLOYER_PRIVATE_KEY !== undefined
            ? [process.env.DEPLOYER_PRIVATE_KEY]
            : [],
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
    },
};
