import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { toast } from 'react-hot-toast'
import TransactionHistory from '../components/TransactionHistory'
import TransactionLink from '../components/TransactionLink'
import InvoiceThumbnail from '../components/InvoiceThumbnail'
import {
  PlusIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const SMEDashboard = () => {
  const { account, contract, tokenizeInvoice, getInvoicesBySME, getInvoice, connectWallet } = useWeb3()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [lastTransactionHash, setLastTransactionHash] = useState(null)
  const [formData, setFormData] = useState({
    client: '',
    faceValue: '',
    salePrice: '',
    dueDate: '',
    invoiceURI: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (account && contract) {
      loadInvoices()
    }
  }, [account, contract])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const invoices = await getInvoicesBySME(account)
      setInvoices(invoices)
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!account) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validation
    if (!formData.client || !formData.faceValue || !formData.salePrice || !formData.dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseFloat(formData.salePrice) >= parseFloat(formData.faceValue)) {
      toast.error('Sale price must be less than face value')
      return
    }

    const dueDate = new Date(formData.dueDate)
    if (dueDate <= new Date()) {
      toast.error('Due date must be in the future')
      return
    }

    // Check if client address is the same as SME address
    if (formData.client.toLowerCase() === account.toLowerCase()) {
      toast.error('SME cannot be the client. Please enter a different client address.')
      return
    }

    try {
      setSubmitting(true)
      
      const dueDateTimestamp = Math.floor(dueDate.getTime() / 1000)
      const invoiceURI = formData.invoiceURI || `ipfs://invoice-${Date.now()}`
      
      const receipt = await tokenizeInvoice({
        client: formData.client,
        faceValue: formData.faceValue,
        salePrice: formData.salePrice,
        dueDate: dueDateTimestamp,
        invoiceURI: invoiceURI
      })
      
      // Store transaction hash for display
      setLastTransactionHash(receipt.hash)
      
      toast.success('Invoice tokenized successfully!')
      setShowModal(false)
      setFormData({
        client: '',
        faceValue: '',
        salePrice: '',
        dueDate: '',
        invoiceURI: ''
      })
      
      // Reload invoices
      await loadInvoices()
    } catch (error) {
      console.error('Error tokenizing invoice:', error)
      toast.error('Failed to tokenize invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 0: // OnMarket
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 1: // Sold
        return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
      case 2: // Repaid
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 3: // Defaulted
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'On Market'
      case 1: return 'Sold'
      case 2: return 'Repaid'
      case 3: return 'Defaulted'
      default: return 'Unknown'
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 0: return 'status-badge status-on-market'
      case 1: return 'status-badge status-sold'
      case 2: return 'status-badge status-repaid'
      case 3: return 'status-badge status-defaulted'
      default: return 'status-badge'
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatXDC = (amount) => {
    return `${parseFloat(amount).toFixed(2)} XDC`
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the SME Dashboard</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SME Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your tokenized invoices</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tokenize Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
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
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatXDC(invoices.reduce((sum, inv) => sum + parseFloat(inv.faceValue || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On Market</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.status === 0).length}
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
                <p className="text-sm font-medium text-gray-600">Repaid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.status === 2).length}
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
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-600 mb-4">Start by tokenizing your first invoice</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Tokenize Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Face Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <InvoiceThumbnail invoiceId={invoice.id} className="w-10 h-10" />
                          <span className="text-sm font-medium text-gray-900">#{invoice.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client?.slice(0, 6)}...{invoice.client?.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatXDC(invoice.faceValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatXDC(invoice.salePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClass(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tokenize Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            {/* Loading Overlay */}
            {submitting && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-md">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">Processing Transaction...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while your invoice is being tokenized</p>
                  <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tokenize Invoice</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Client Address *</label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0x..."
                  required
                />
              </div>
              
              <div>
                <label className="label">Face Value (XDC) *</label>
                <input
                  type="number"
                  name="faceValue"
                  value={formData.faceValue}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="1000"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="label">Sale Price (XDC) *</label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="900"
                  step="0.01"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be less than face value
                </p>
              </div>
              
              <div>
                <label className="label">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <label className="label">Invoice URI (Optional)</label>
                <input
                  type="text"
                  name="invoiceURI"
                  value={formData.invoiceURI}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="ipfs://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  IPFS link to invoice metadata
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Tokenizing...
                    </>
                  ) : (
                    'Tokenize'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Transaction History */}
      <div className="mt-8">
        <TransactionHistory limit={5} />
      </div>
    </div>
  )
}

export default SMEDashboard