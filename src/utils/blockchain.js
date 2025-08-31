// Blockchain utility functions for XDC Network

/**
 * Get the appropriate XDCScan explorer URL based on network
 * @param {string} chainId - The chain ID
 * @returns {string} - Base URL for XDCScan explorer
 */
export const getXDCScanBaseUrl = (chainId) => {
  switch (chainId) {
    case '50': // XDC Mainnet
      return 'https://xdcscan.io'
    case '51': // XDC Apothem Testnet
      return 'https://apothem.xdcscan.io'
    case '1337': // Local Hardhat (fallback to testnet for demo)
      return 'https://apothem.xdcscan.io'
    default:
      return 'https://apothem.xdcscan.io' // Default to testnet
  }
}

/**
 * Generate XDCScan transaction URL
 * @param {string} txHash - Transaction hash
 * @param {string} chainId - Chain ID
 * @returns {string} - Complete URL to view transaction on XDCScan
 */
export const getTransactionUrl = (txHash, chainId = '51') => {
  const baseUrl = getXDCScanBaseUrl(chainId)
  // Convert 0x prefix to xdc prefix for XDC network
  const xdcTxHash = txHash.startsWith('0x') ? txHash.replace('0x', 'xdc') : txHash
  return `${baseUrl}/tx/${xdcTxHash}`
}

/**
 * Generate XDCScan address URL
 * @param {string} address - Wallet/contract address
 * @param {string} chainId - Chain ID
 * @returns {string} - Complete URL to view address on XDCScan
 */
export const getAddressUrl = (address, chainId = '51') => {
  const baseUrl = getXDCScanBaseUrl(chainId)
  // Convert 0x prefix to xdc prefix for XDC network
  const xdcAddress = address.startsWith('0x') ? address.replace('0x', 'xdc') : address
  return `${baseUrl}/address/${xdcAddress}`
}

/**
 * Generate XDCScan token URL
 * @param {string} contractAddress - Token contract address
 * @param {string} tokenId - Token ID
 * @param {string} chainId - Chain ID
 * @returns {string} - Complete URL to view token on XDCScan
 */
export const getTokenUrl = (contractAddress, tokenId, chainId = '51') => {
  const baseUrl = getXDCScanBaseUrl(chainId)
  const xdcAddress = contractAddress.startsWith('0x') ? contractAddress.replace('0x', 'xdc') : contractAddress
  return `${baseUrl}/token/${xdcAddress}?a=${tokenId}`
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
 * Check if we're on XDC network
 * @param {string} chainId - Chain ID
 * @returns {boolean} - True if on XDC network
 */
export const isXDCNetwork = (chainId) => {
  return ['50', '51'].includes(chainId)
}

/**
 * Get network name from chain ID
 * @param {string} chainId - Chain ID
 * @returns {string} - Network name
 */
export const getNetworkName = (chainId) => {
  switch (chainId) {
    case '50':
      return 'XDC Mainnet'
    case '51':
      return 'XDC Apothem Testnet'
    case '1337':
      return 'Hardhat Local'
    default:
      return 'Unknown Network'
  }
}