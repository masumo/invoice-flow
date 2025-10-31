import React from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useWeb3 } from '../contexts/Web3Context'
import { formatTxHash } from '../utils/blockchain'

const TransactionLink = ({ txHash, className = '', showIcon = true, showFullHash = false }) => {
  const { getTransactionExplorerUrl } = useWeb3()

  if (!txHash) return null

  const explorerUrl = getTransactionExplorerUrl(txHash)
  const displayHash = showFullHash ? txHash : formatTxHash(txHash)

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-primary-600 hover:text-primary-800 transition-colors duration-200 ${className}`}
      title={`View transaction on Flow Explorer: ${txHash}`}
    >
      <span className="font-mono text-sm">{displayHash}</span>
      {showIcon && (
        <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 flex-shrink-0" />
      )}
    </a>
  )
}

export default TransactionLink