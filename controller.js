// Oqia Protocol - Off-Chain AI Controller (v2.0)
// This upgraded version reads configuration from bot-config.json,
// dynamically loads ABIs, and uses chalk for better logging.

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const chalk = {
    yellow: (text) => text,
    cyan: (text) => text,
    green: (text) => text,
    bold: {
        green: (text) => text,
    },
    magenta: (text) => text,
    gray: (text) => text,
    red: (text) => text,
};
// eslint-disable-next-line no-unused-vars
const SAFE_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "AddedOwner",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "approvedHash",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "ApproveHash",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "handler",
                "type": "address"
            }
        ],
        "name": "ChangedFallbackHandler",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "guard",
                "type": "address"
            }
        ],
        "name": "ChangedGuard",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "threshold",
                "type": "uint256"
            }
        ],
        "name": "ChangedThreshold",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "DisabledModule",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "EnabledModule",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "txHash",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "payment",
                "type": "uint256"
            }
        ],
        "name": "ExecutionFailure",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "ExecutionFromModuleFailure",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "ExecutionFromModuleSuccess",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "txHash",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "payment",
                "type": "uint256"
            }
        ],
        "name": "ExecutionSuccess",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "RemovedOwner",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "SafeReceived",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "initiator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address[]",
                "name": "owners",
                "type": "address[]"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "threshold",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "initializer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "fallbackHandler",
                "type": "address"
            }
        ],
        "name": "SafeSetup",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "msgHash",
                "type": "bytes32"
            }
        ],
        "name": "SignMsg",
        "type": "event"
    },
    {
        "stateMutability": "nonpayable",
        "type": "fallback"
    },
    {
        "inputs": [],
        "name": "VERSION",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "addOwnerWithThreshold",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "hashToApprove",
                "type": "bytes32"
            }
        ],
        "name": "approveHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "approvedHashes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "changeThreshold",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "dataHash",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "requiredSignatures",
                "type": "uint256"
            }
        ],
        "name": "checkNSignatures",
        "outputs": [],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "dataHash",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "checkSignatures",
        "outputs": [],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "prevModule",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "disableModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "domainSeparator",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "enableModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "safeTxGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "baseGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "gasPrice",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "gasToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "refundReceiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_nonce",
                "type": "uint256"
            }
        ],
        "name": "encodeTransactionData",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "safeTxGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "baseGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "gasPrice",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "gasToken",
                "type": "address"
            },
            {
                "internalType": "address payable",
                "name": "refundReceiver",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "execTransaction",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            }
        ],
        "name": "execTransactionFromModule",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            }
        ],
        "name": "execTransactionFromModuleReturnData",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            },
            {
                "internalType": "bytes",
                "name": "returnData",
                "type": "bytes"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getChainId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "start",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "pageSize",
                "type": "uint256"
            }
        ],
        "name": "getModulesPaginated",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "array",
                "type": "address[]"
            },
            {
                "internalType": "address",
                "name": "next",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOwners",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "length",
                "type": "uint256"
            }
        ],
        "name": "getStorageAt",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getThreshold",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "safeTxGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "baseGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "gasPrice",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "gasToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "refundReceiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_nonce",
                "type": "uint256"
            }
        ],
        "name": "getTransactionHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "isModuleEnabled",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "isOwner",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nonce",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "prevOwner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "removeOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "handler",
                "type": "address"
            }
        ],
        "name": "setFallbackHandler",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "guard",
                "type": "address"
            }
        ],
        "name": "setGuard",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_owners",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "address",
                "name": "fallbackHandler",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "paymentToken",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "payment",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "paymentReceiver",
                "type": "address"
            }
        ],
        "name": "setup",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "signedMessages",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "targetContract",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "calldataPayload",
                "type": "bytes"
            }
        ],
        "name": "simulateAndRevert",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "prevOwner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "oldOwner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "swapOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
];
require("dotenv").config();

// --- CONFIGURATION LOADER ---
function loadConfig() {
    const { ALCHEMY_SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, SESSION_KEY_MANAGER_ADDRESS } = process.env;

    if (!ALCHEMY_SEPOLIA_RPC_URL || !DEPLOYER_PRIVATE_KEY || !SESSION_KEY_MANAGER_ADDRESS) {
        throw new Error("Missing required environment variables in .env file.");
    }

    const botConfigPath = path.resolve(__dirname, "bot-config.json");
    if (!fs.existsSync(botConfigPath)) {
        throw new Error("bot-config.json not found. Please run the mint-bot.js script first.");
    }
    const botConfig = JSON.parse(fs.readFileSync(botConfigPath, "utf8"));

    const factoryArtifactPath = path.resolve(__dirname, "./artifacts/src/OqiaBotFactory.sol/OqiaBotFactory.json");
    const sessionManagerArtifactPath = path.resolve(__dirname, "./artifacts/src/OqiaSessionKeyManager.sol/OqiaSessionKeyManager.json");

    if (!fs.existsSync(factoryArtifactPath) || !fs.existsSync(sessionManagerArtifactPath)) {
        throw new Error("ABI files not found. Please compile contracts with 'npx hardhat compile'.");
    }

    const FACTORY_ABI = JSON.parse(fs.readFileSync(factoryArtifactPath, "utf8")).abi;
    const SESSION_KEY_MANAGER_ABI = JSON.parse(fs.readFileSync(sessionManagerArtifactPath, "utf8")).abi;

    return {
        rpcUrl: ALCHEMY_SEPOLIA_RPC_URL,
        ownerPrivateKey: DEPLOYER_PRIVATE_KEY,
        sessionManagerAddress: SESSION_KEY_MANAGER_ADDRESS,
        botWalletAddress: botConfig.botAddress,
        factoryAddress: botConfig.factoryAddress,
        factoryAbi: FACTORY_ABI,
        sessionManagerAbi: SESSION_KEY_MANAGER_ABI,
    };
}

// --- CORE AGENT LOGICS ---
class OqiaAgent {
    constructor(config) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.owner = new ethers.Wallet(config.ownerPrivateKey, this.provider);
        this.sessionKey = ethers.Wallet.createRandom(); // Temporary key for this session

        console.log(chalk.cyan("🤖 Agent Initializing..."));
        console.log(`   - ${chalk.cyan("Owner:")}          ${this.owner.address}`);
        console.log(`   - ${chalk.cyan("Bot Wallet:")}     ${config.botWalletAddress}`);
        console.log(`   - ${chalk.cyan("Session Key:")}    ${this.sessionKey.address}`);
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async enableSessionKeyManagerModule() {
        console.log(chalk.yellow("\n⚙️  Enabling OqiaSessionKeyManager module on the Safe..."));
        const safeAbi = [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "AddedOwner",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "approvedHash",
                        "type": "bytes32"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "ApproveHash",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "handler",
                        "type": "address"
                    }
                ],
                "name": "ChangedFallbackHandler",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "guard",
                        "type": "address"
                    }
                ],
                "name": "ChangedGuard",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "threshold",
                        "type": "uint256"
                    }
                ],
                "name": "ChangedThreshold",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "DisabledModule",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "EnabledModule",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "txHash",
                        "type": "bytes32"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "payment",
                        "type": "uint256"
                    }
                ],
                "name": "ExecutionFailure",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "ExecutionFromModuleFailure",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "ExecutionFromModuleSuccess",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "txHash",
                        "type": "bytes32"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "payment",
                        "type": "uint256"
                    }
                ],
                "name": "ExecutionSuccess",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "RemovedOwner",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "SafeReceived",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "initiator",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "address[]",
                        "name": "owners",
                        "type": "address[]"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "threshold",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "initializer",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "fallbackHandler",
                        "type": "address"
                    }
                ],
                "name": "SafeSetup",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "msgHash",
                        "type": "bytes32"
                    }
                ],
                "name": "SignMsg",
                "type": "event"
            },
            {
                "stateMutability": "nonpayable",
                "type": "fallback"
            },
            {
                "inputs": [],
                "name": "VERSION",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_threshold",
                        "type": "uint256"
                    }
                ],
                "name": "addOwnerWithThreshold",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "hashToApprove",
                        "type": "bytes32"
                    }
                ],
                "name": "approveHash",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "name": "approvedHashes",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_threshold",
                        "type": "uint256"
                    }
                ],
                "name": "changeThreshold",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "dataHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signatures",
                        "type": "bytes"
                    },
                    {
                        "internalType": "uint256",
                        "name": "requiredSignatures",
                        "type": "uint256"
                    }
                ],
                "name": "checkNSignatures",
                "outputs": [],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "dataHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signatures",
                        "type": "bytes"
                    }
                ],
                "name": "checkSignatures",
                "outputs": [],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "prevModule",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "disableModule",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "domainSeparator",
                "outputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "enableModule",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_nonce",
                        "type": "uint256"
                    }
                ],
                "name": "encodeTransactionData",
                "outputs": [
                    {
                        "internalType": "bytes",
                        "name": "",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address payable",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signatures",
                        "type": "bytes"
                    }
                ],
                "name": "execTransaction",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModule",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModuleReturnData",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "internalType": "bytes",
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getChainId",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "start",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "pageSize",
                        "type": "uint256"
                    }
                ],
                "name": "getModulesPaginated",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "array",
                        "type": "address[]"
                    },
                    {
                        "internalType": "address",
                        "name": "next",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getOwners",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "",
                        "type": "address[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "offset",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "length",
                        "type": "uint256"
                    }
                ],
                "name": "getStorageAt",
                "outputs": [
                    {
                        "internalType": "bytes",
                        "name": "",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getThreshold",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_nonce",
                        "type": "uint256"
                    }
                ],
                "name": "encodeTransactionData",
                "outputs": [
                    {
                        "internalType": "bytes",
                        "name": "",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address payable",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signatures",
                        "type": "bytes"
                    }
                ],
                "name": "execTransaction",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModule",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModuleReturnData",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "internalType": "bytes",
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getChainId",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "start",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "pageSize",
                        "type": "uint256"
                    }
                ],
                "name": "getModulesPaginated",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "array",
                        "type": "address[]"
                    },
                    {
                        "internalType": "address",
                        "name": "next",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getOwners",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "",
                        "type": "address[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "offset",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "length",
                        "type": "uint256"
                    }
                ],
                "name": "getStorageAt",
                "outputs": [
                    {
                        "internalType": "bytes",
                        "name": "",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getThreshold",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_nonce",
                        "type": "uint256"
                    }
                ],
                "name": "encodeTransactionData",
                "outputs": [
                    {
                        "internalType": "bytes",
                        "name": "",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address payable",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signatures",
                        "type": "bytes"
                    }
                ],
                "name": "execTransaction",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModule",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModuleReturnData",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "internalType": "bytes",
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getChainId",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "start",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "pageSize",
                        "type": "uint256"
                    }
                ],
                "name": "getModulesPaginated",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "array",
                        "type": "address[]"
                    },
                    {
                        "internalType": "address",
                        "name": "next",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getOwners",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "",
                        "type": "address[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "offset",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "length",
                        "type": "uint256"
                    }
                ],
                "name": "getStorageAt",
                "outputs": [
                    {
                        "internalType": "bytes",
                        "name": "",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getThreshold",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_nonce",
                        "type": "uint256"
                    }
                ],
                "name": "getTransactionHash",
                "outputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "module",
                        "type": "address"
                    }
                ],
                "name": "isModuleEnabled",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "isOwner",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "nonce",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "prevOwner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_threshold",
                        "type": "uint256"
                    }
                ],
                "name": "removeOwner",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "handler",
                        "type": "address"
                    }
                ],
                "name": "setFallbackHandler",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "guard",
                        "type": "address"
                    }
                ],
                "name": "setGuard",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address[]",
                        "name": "_owners",
                        "type": "address[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_threshold",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "address",
                        "name": "fallbackHandler",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "paymentToken",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "payment",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address payable",
                        "name": "paymentReceiver",
                        "type": "address"
                    }
                ],
                "name": "setup",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "name": "signedMessages",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "targetContract",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "calldataPayload",
                        "type": "bytes"
                    }
                ],
                "name": "simulateAndRevert",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "prevOwner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "oldOwner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "name": "swapOwner",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "stateMutability": "payable",
                "type": "receive"
            }
        ];
        const safeContract = new ethers.Contract(this.config.botWalletAddress, safeAbi, this.owner);

        try {
            const tx = await safeContract.enableModule(this.config.sessionManagerAddress);
            console.log(`   - Transaction sent: ${chalk.cyan(tx.hash)}`);
            await tx.wait(1);
            console.log(chalk.green("   - ✅ OqiaSessionKeyManager module enabled on Safe."));
        } catch (error) {
            console.error(chalk.red("   - 🔥 Error enabling session key manager module:"), error.reason || error.message);
        }
    }

    async authorizeSessionKey() {
        console.log(chalk.yellow("\n✍️  Authorizing new session key on-chain..."));
        const sessionMgr = new ethers.Contract(this.config.sessionManagerAddress, this.config.sessionManagerAbi, this.owner);

        const validUntil = Math.floor(Date.now() / 1000) + 3600; // Valid for 1 hour
        const valueLimit = ethers.parseEther("0.01");

        try {
            const tx = await sessionMgr.authorizeSessionKey(
                this.config.botWalletAddress,
                this.sessionKey.address,
                validUntil,
                valueLimit
            );
            console.log(`   - Transaction sent: ${chalk.cyan(tx.hash)}`);
            await tx.wait(1);
            console.log(chalk.green("   - ✅ Session key successfully authorized."));
        } catch (error) {
            console.error(chalk.red("   - 🔥 Error authorizing session key:"), error.reason || error.message);
        }
    }

    // ... [ The rest of the agent logic (runDecisionLoop, etc.) would go here ] ...
    async run() {
        console.log(chalk.gray("Waiting 5 seconds for Safe deployment to propagate..."));
        await this.sleep(5000);
        await this.enableSessionKeyManagerModule();
        await this.authorizeSessionKey();
        console.log(chalk.green("\n🚀 Agent is live and ready to operate."));
        // TODO: Implement the continuous decision loop (perception, planning, action)
    }
}

// --- MAIN EXECUTION ---
async function main() {
    try {
        const config = loadConfig();
        const agent = new OqiaAgent(config);
        await agent.run();
    } catch (error) {
        console.error(chalk.red("\n🚨 A critical error occurred:"), error.message);
        process.exit(1);
    }
}

main();