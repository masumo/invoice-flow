// Blockchain utility functions for Flow EVM

/**
 * Get the appropriate Flowscan explorer URL based on network
 * @param {string} chainId - The chain ID
 * @returns {string} - Base URL for Flowscan explorer
 */
export const getFlowscanBaseUrl = (chainId) => {
  switch (chainId) {
    case '747': // Flow EVM Mainnet
      return 'https://flowscan.org'
    case '545': // Flow EVM Testnet (current)
    case '646': // Flow EVM Testnet (old)
      return 'https://evm-testnet.flowscan.io'
    case '1337': // Local Hardhat (fallback to testnet for demo)
      return 'https://evm-testnet.flowscan.io'
    default:
      return 'https://evm-testnet.flowscan.io' // Default to testnet
  }
}

/**
 * Generate Flowscan transaction URL
 * @param {string} txHash - Transaction hash
 * @param {string} chainId - Chain ID
 * @returns {string} - Complete URL to view transaction on Flowscan
 */
export const getTransactionUrl = (txHash, chainId = '545') => {
  const baseUrl = getFlowscanBaseUrl(chainId)
  return `${baseUrl}/tx/${txHash}`
}

/**
 * Generate Flowscan address URL
 * @param {string} address - Wallet/contract address
 * @param {string} chainId - Chain ID
 * @returns {string} - Complete URL to view address on Flowscan
 */
export const getAddressUrl = (address, chainId = '545') => {
  const baseUrl = getFlowscanBaseUrl(chainId)
  return `${baseUrl}/address/${address}`
}

/**
 * Generate Flowscan token URL
 * @param {string} contractAddress - Token contract address
 * @param {string} tokenId - Token ID
 * @param {string} chainId - Chain ID
 * @returns {string} - Complete URL to view token on Flowscan
 */
export const getTokenUrl = (contractAddress, tokenId, chainId = '545') => {
  const baseUrl = getFlowscanBaseUrl(chainId)
  return `${baseUrl}/token/${contractAddress}?a=${tokenId}`
}

/**
 * Format transaction hash for display
 * @param {string} txHash - Transaction hash
 * @returns {string} - Formatted hash for display
 */
export const formatTxHash = (txHash) => {
  if (!txHash) return ''
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
}

/**
 * Check if we're on Flow EVM network
 * @param {string} chainId - Chain ID
 * @returns {boolean} - True if on Flow EVM network
 */
export const isFlowNetwork = (chainId) => {
  return ['747', '646'].includes(chainId)
}

/**
 * Get network name from chain ID
 * @param {string} chainId - Chain ID
 * @returns {string} - Network name
 */
export const getNetworkName = (chainId) => {
  switch (chainId) {
    case '747':
      return 'Flow EVM Mainnet'
    case '646':
      return 'Flow EVM Testnet'
    case '1337':
      return 'Hardhat Local'
    default:
      return 'Unknown Network'
  }
}