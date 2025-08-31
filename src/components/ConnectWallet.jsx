import React from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { WalletIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const ConnectWallet = () => {
  const {
    account,
    isConnecting,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet
  } = useWeb3()

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isMetaMaskInstalled) {
    return (
      <div className="flex items-center space-x-2">
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center space-x-2"
        >
          <WalletIcon className="h-4 w-4" />
          <span>Install MetaMask</span>
        </a>
      </div>
    )
  }

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="btn-primary flex items-center space-x-2"
      >
        {isConnecting ? (
          <>
            <div className="loading-spinner" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <WalletIcon className="h-4 w-4" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>
    )
  }

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="font-medium">{formatAddress(account)}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      
      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Connected Account</p>
          <p className="text-sm font-mono break-all">{account}</p>
        </div>
        <div className="p-2">
          <button
            onClick={disconnectWallet}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet