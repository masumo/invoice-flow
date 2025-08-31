import React from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import TransactionLink from './TransactionLink'
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const TransactionHistory = ({ limit = 10, className = '' }) => {
  const { transactionHistory } = useWeb3()

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'tokenize':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />
      case 'buy':
        return <ShoppingCartIcon className="h-5 w-5 text-green-600" />
      case 'repay':
        return <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'tokenize':
        return 'Invoice Created'
      case 'buy':
        return 'Invoice Purchased'
      case 'repay':
        return 'Invoice Repaid'
      default:
        return 'Transaction'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const displayTransactions = transactionHistory.slice(0, limit)

  if (displayTransactions.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="p-6 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600">Your transaction history will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {displayTransactions.map((tx, index) => (
          <div key={`${tx.hash}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getTransactionIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getTransactionTypeText(tx.type)}
                      {tx.invoiceId && (
                        <span className="text-gray-600"> #{tx.invoiceId}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{tx.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <TransactionLink 
                    txHash={tx.hash} 
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {transactionHistory.length > limit && (
        <div className="px-6 py-3 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            Showing {limit} of {transactionHistory.length} transactions
          </p>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory