import React from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const NetworkDisplay = () => {
  const {
    chainId,
    isCorrectNetwork,
    TARGET_CHAIN_ID,
    TARGET_NETWORK_NAME,
    switchNetwork,
    account
  } = useWeb3()

  // Don't show if wallet is not connected
  if (!account) {
    return null
  }

  const getNetworkName = (id) => {
    switch (id) {
      case 545:
        return 'Flow EVM Testnet'
      case 747:
        return 'Flow EVM Mainnet'
      case 51:
        return 'Flow Testnet'
      case 50:
        return 'Flow Network'
      case 1:
        return 'Ethereum Mainnet'
      case 5:
        return 'Goerli Testnet'
      case 137:
        return 'Polygon Mainnet'
      case 80001:
        return 'Polygon Mumbai'
      default:
        return `Unknown Network (${id})`
    }
  }

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
        <CheckCircleIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{TARGET_NETWORK_NAME}</span>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">
            Wrong Network Detected
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            You're currently connected to <strong>{getNetworkName(chainId)}</strong>.
            Please switch to <strong>{TARGET_NETWORK_NAME}</strong> to use InvoiceFlow.
          </p>
          <button
            onClick={switchNetwork}
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Switch to {TARGET_NETWORK_NAME}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NetworkDisplay