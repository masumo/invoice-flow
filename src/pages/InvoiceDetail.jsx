import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import { toast } from 'react-hot-toast'
import TransactionLink from '../components/TransactionLink'
import InvoiceThumbnail from '../components/InvoiceThumbnail'
import TransactionHistory from '../components/TransactionHistory'
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const InvoiceDetail = () => {
  const { tokenId } = useParams()
  const navigate = useNavigate()
  const { account, contract, getInvoice, buyInvoice, connectWallet } = useWeb3()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [lastTransactionHash, setLastTransactionHash] = useState(null)

  console.log('InvoiceDetail component rendered - tokenId:', tokenId, 'account:', account, 'contract:', !!contract)
  
  if (typeof window !== 'undefined') {
    console.log('INVOICE DETAIL COMPONENT LOADED - tokenId:', tokenId)
  }

  useEffect(() => {
    console.log('InvoiceDetail useEffect - contract:', !!contract, 'tokenId:', tokenId)
    if (contract && tokenId) {
      console.log('Calling loadInvoice...')
      loadInvoice()
    } else {
      console.log('Missing contract or tokenId - contract:', !!contract, 'tokenId:', tokenId)
      // Set loading to false if we don't have required data
      if (!contract || !tokenId) {
        setLoading(false)
      }
    }
  }, [contract, tokenId])

  const loadInvoice = async () => {
    console.log('=== LOAD INVOICE FUNCTION CALLED ===')
    try {
      setLoading(true)
      console.log('Loading invoice with tokenId:', tokenId)
      const invoiceData = await getInvoice(tokenId)
      console.log('Invoice data received:', invoiceData)
      setInvoice(invoiceData)
    } catch (error) {
      console.error('Error loading invoice:', error)
      toast.error('Failed to load invoice details')
      navigate('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!account) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!invoice) {
      toast.error('Invoice data not available')
      return
    }

    if (invoice.status !== 0) {
      toast.error('This invoice is no longer available for purchase')
      return
    }

    try {
      setPurchasing(true)
      const receipt = await buyInvoice(invoice.id, invoice.salePriceWei)
      
      // Store transaction hash for display
      setLastTransactionHash(receipt.hash)
      
      setShowConfirmModal(false)
      
      // Reload invoice data to show updated status
      await loadInvoice()
      
      // Navigate to portfolio after a short delay
      setTimeout(() => {
        navigate('/portfolio')
      }, 2000)
    } catch (error) {
      console.error('Error purchasing invoice:', error)
      toast.error('Failed to purchase invoice')
    } finally {
      setPurchasing(false)
    }
  }

  const calculateROI = () => {
    if (!invoice) return 0
    const faceValue = parseFloat(invoice.faceValue)
    const salePrice = parseFloat(invoice.salePrice)
    return ((faceValue - salePrice) / salePrice * 100)
  }

  const calculateDaysToMaturity = () => {
    if (!invoice) return 0
    const now = Date.now() / 1000
    const days = Math.ceil((invoice.dueDate - now) / (24 * 60 * 60))
    return Math.max(0, days)
  }

  const isInvoiceExpired = () => {
    if (!invoice) return false
    const now = Date.now() / 1000
    return now > invoice.dueDate
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatXDC = (amount) => {
    return `${parseFloat(amount).toFixed(2)} XDC`
  }

  const getStatusInfo = (status) => {
    // Check if invoice is expired first
    if (status === 0 && isInvoiceExpired()) {
      return {
        text: 'Expired',
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bg: 'bg-red-100'
      }
    }
    
    switch (status) {
      case 0:
        return {
          text: 'Available for Purchase',
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-100'
        }
      case 1:
        return {
          text: 'Sold',
          icon: CurrencyDollarIcon,
          color: 'text-blue-600',
          bg: 'bg-blue-100'
        }
      case 2:
        return {
          text: 'Repaid',
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-100'
        }
      case 3:
        return {
          text: 'Defaulted',
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          bg: 'bg-red-100'
        }
      default:
        return {
          text: 'Unknown',
          icon: ClockIcon,
          color: 'text-gray-600',
          bg: 'bg-gray-100'
        }
    }
  }

  const getRiskLevel = () => {
    if (!invoice) return { level: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' }
    
    const days = calculateDaysToMaturity()
    const roi = calculateROI()
    
    if (days <= 7 && roi >= 20) return { level: 'High Risk', color: 'text-red-600', bg: 'bg-red-100' }
    if (days <= 30 && roi >= 15) return { level: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Low Risk', color: 'text-green-600', bg: 'bg-green-100' }
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view invoice details</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The requested invoice could not be found</p>
          <Link to="/marketplace" className="btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(invoice.status)
  const risk = getRiskLevel()
  const roi = calculateROI()
  const daysToMaturity = calculateDaysToMaturity()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <InvoiceThumbnail invoiceId={invoice.id} className="w-16 h-16" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.id}</h1>
                <p className="text-gray-600 mt-1">Detailed invoice information and investment opportunity</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${risk.bg} ${risk.color}`}>
                {risk.level}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color} flex items-center`}>
                <statusInfo.icon className="h-4 w-4 mr-1" />
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="card">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Investment Overview</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Face Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatXDC(invoice.faceValue)}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Sale Price</p>
                    <p className="text-2xl font-bold text-gray-900">{formatXDC(invoice.salePrice)}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Potential ROI</p>
                    <p className="text-2xl font-bold text-purple-600">{roi.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Days to Maturity</p>
                    <p className="text-2xl font-bold text-gray-900">{daysToMaturity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="card">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Invoice Details</h2>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Invoice ID:</span>
                    <span className="font-semibold">#{invoice.id}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">SME Address:</span>
                    <span className="font-mono text-sm">
                      {invoice.sme?.slice(0, 6)}...{invoice.sme?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Client Address:</span>
                    <span className="font-mono text-sm">
                      {invoice.client?.slice(0, 6)}...{invoice.client?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-semibold">{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Invoice URI:</span>
                    <span className="font-mono text-sm text-blue-600">
                      {invoice.invoiceURI ? (
                        <a href={invoice.invoiceURI} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          View Metadata
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </span>
                  </div>
                  {invoice.investor && invoice.investor !== '0x0000000000000000000000000000000000000000' && (
                    <div className="flex justify-between py-3">
                      <span className="text-gray-600">Current Owner:</span>
                      <span className="font-mono text-sm">
                        {invoice.investor?.slice(0, 6)}...{invoice.investor?.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="card">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Risk Analysis</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
                      <span className="font-medium">Blockchain Security</span>
                    </div>
                    <span className="text-green-600 font-semibold">Secured</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <CalendarIcon className="h-6 w-6 text-purple-600 mr-3" />
                      <span className="font-medium">Time to Maturity</span>
                    </div>
                    <span className={`font-semibold ${
                      daysToMaturity <= 7 ? 'text-red-600' : 
                      daysToMaturity <= 30 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {daysToMaturity <= 7 ? 'Very Short' : 
                       daysToMaturity <= 30 ? 'Short' : 'Medium'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 mr-3" />
                      <span className="font-medium">Return Potential</span>
                    </div>
                    <span className={`font-semibold ${
                      roi >= 20 ? 'text-green-600' : 
                      roi >= 15 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {roi >= 20 ? 'High' : roi >= 15 ? 'Medium' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment Amount:</span>
                    <span className="font-bold text-lg">{formatXDC(invoice.salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Return:</span>
                    <span className="font-bold text-lg text-green-600">{formatXDC(invoice.faceValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatXDC(parseFloat(invoice.faceValue) - parseFloat(invoice.salePrice))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">ROI:</span>
                    <span className="font-bold text-xl text-purple-600">{roi.toFixed(1)}%</span>
                  </div>
                </div>
                
                {invoice.status === 0 && !isInvoiceExpired() ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full btn-primary"
                    disabled={purchasing}
                  >
                    {purchasing ? 'Processing...' : 'Buy Invoice'}
                  </button>
                ) : (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <statusInfo.icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      {isInvoiceExpired() ? 'This invoice has expired and cannot be purchased' : 'This invoice is no longer available for purchase'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">SME Verified</span>
                  </div>
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm text-gray-600">Blockchain Secured</span>
                  </div>
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-3" />
                    <span className="text-sm text-gray-600">Smart Contract</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Purchase</h3>
              <div className="space-y-3 mb-6">
                <p className="text-gray-600">You are about to purchase:</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Invoice ID:</span>
                    <span className="font-semibold">#{invoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investment:</span>
                    <span className="font-semibold">{formatXDC(invoice.salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Return:</span>
                    <span className="font-semibold text-green-600">{formatXDC(invoice.faceValue)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>ROI:</span>
                    <span className="font-bold text-purple-600">{roi.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 btn-outline"
                  disabled={purchasing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  className="flex-1 btn-primary"
                  disabled={purchasing}
                >
                  {purchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
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

export default InvoiceDetail