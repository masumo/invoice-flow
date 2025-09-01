import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { toast } from 'react-hot-toast'
import TransactionHistory from '../components/TransactionHistory'
import TransactionLink from '../components/TransactionLink'
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const ClientDashboard = () => {
  const { account, contract, getInvoice, getInvoicesByClient, repayInvoice, connectWallet } = useWeb3()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => {
    if (account && contract) {
      loadClientInvoices()
    }
  }, [account, contract])

  const loadClientInvoices = async () => {
    if (!contract || !account) return

    setLoading(true)
    try {
      // Use the optimized getInvoicesByClient function that uses event filtering
      const clientInvoices = await getInvoicesByClient(account)
      setInvoices(clientInvoices)
    } catch (error) {
      console.error('Error loading client invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handlePayInvoice = async (invoice) => {
    if (!invoice) return

    setPayingInvoice(invoice.id)
    try {
      await repayInvoice(invoice.id, invoice.faceValue)
      setShowPaymentModal(false)
      setSelectedInvoice(null)
      // Reload invoices to update status
      await loadClientInvoices()
    } catch (error) {
      console.error('Error paying invoice:', error)
      toast.error('Failed to pay invoice. Please try again.')
    } finally {
      setPayingInvoice(null)
    }
  }

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  const formatXDC = (value) => {
    return `${parseFloat(value).toFixed(2)} XDC`
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 0: // OnMarket
        return <ClockIcon className="h-4 w-4" />
      case 1: // Sold
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 2: // Repaid
        return <CheckCircleIcon className="h-4 w-4" />
      case 3: // Defaulted
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Available'
      case 1: return 'Payment Due'
      case 2: return 'Paid'
      case 3: return 'Defaulted'
      default: return 'Unknown'
    }
  }

  const getStatusClass = (status) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    switch (status) {
      case 0: return `${baseClass} bg-blue-100 text-blue-800`
      case 1: return `${baseClass} bg-yellow-100 text-yellow-800`
      case 2: return `${baseClass} bg-green-100 text-green-800`
      case 3: return `${baseClass} bg-red-100 text-red-800`
      default: return `${baseClass} bg-gray-100 text-gray-800`
    }
  }

  const isPaymentDue = (invoice) => {
    return invoice.status === 1 && new Date(invoice.dueDate * 1000) >= new Date()
  }

  const isOverdue = (invoice) => {
    return invoice.status === 1 && new Date(invoice.dueDate * 1000) < new Date()
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view your invoices</p>
          <button
            onClick={connectWallet}
            className="btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
          <p className="text-gray-600">Manage and pay your invoices</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment Due</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => isPaymentDue(inv)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.status === 2).length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => isOverdue(inv)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Invoices</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
              <p className="text-gray-600">You don't have any invoices at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{invoice.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.sme?.slice(0, 6)}...{invoice.sme?.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatXDC(invoice.faceValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClass(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{getStatusText(invoice.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isPaymentDue(invoice) ? (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Pay Now
                          </button>
                        ) : isOverdue(invoice) ? (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Pay Overdue
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="mt-8">
        <TransactionHistory limit={5} />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pay Invoice #{selectedInvoice.id}</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Amount Due:</span>
                    <span className="font-semibold text-gray-900">{formatXDC(selectedInvoice.faceValue)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">SME:</span>
                    <span className="text-sm text-gray-900">
                      {selectedInvoice.sme?.slice(0, 6)}...{selectedInvoice.sme?.slice(-4)}
                    </span>
                  </div>
                </div>
                
                {isOverdue(selectedInvoice) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Overdue Payment</h3>
                        <p className="text-sm text-red-700 mt-1">
                          This invoice is past its due date. Please pay immediately to avoid further complications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePayInvoice(selectedInvoice)}
                    disabled={payingInvoice === selectedInvoice.id}
                    className="flex-1 bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {payingInvoice === selectedInvoice.id ? 'Processing...' : 'Pay Invoice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDashboard