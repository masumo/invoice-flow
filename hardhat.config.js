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
    // XDC Apothem Testnet
    apothem: {
      url: "https://rpc.apothem.network",
      chainId: 51,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 12500000000, // 12.5 gwei (XDC 2.0 network requirement)
      gas: 8000000,
    },
    // XDC Mainnet (for future deployment)
    xdc: {
      url: "https://rpc.xinfin.network",
      chainId: 50,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 250000000, // 0.25 gwei
      gas: 8000000,
    },
  },
  etherscan: {
    // XDC Explorer API configuration
    apiKey: {
      apothem: "abc", // Placeholder - XDC explorer doesn't require API key
      xdc: "abc",
    },
    customChains: [
      {
        network: "apothem",
        chainId: 51,
        urls: {
          apiURL: "https://explorer.apothem.network/api",
          browserURL: "https://explorer.apothem.network",
        },
      },
      {
        network: "xdc",
        chainId: 50,
        urls: {
          apiURL: "https://explorer.xinfin.network/api",
          browserURL: "https://explorer.xinfin.network",
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