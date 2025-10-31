require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // Flow EVM Testnet
    flowTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      chainId: 545,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    // Flow EVM Mainnet (for future deployment)
    flowMainnet: {
      url: "https://evm.nodes.onflow.org",
      chainId: 546,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    }
  },
  etherscan: {
    // Flow Explorer API configuration
    apiKey: {
      flowTestnet: process.env.FLOW_EXPLORER_API_KEY || "",
      flowMainnet: process.env.FLOW_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "flowTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
      browserURL: "https://evm-testnet.flowscan.io",
        },
      },
      {
        network: "flowMainnet",
        chainId: 546,
        urls: {
          apiURL: "https://flowscan.org/api",
          browserURL: "https://flowscan.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};