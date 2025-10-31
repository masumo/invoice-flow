import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import { toast } from 'react-hot-toast'
import TransactionHistory from '../components/TransactionHistory'
import TransactionLink from '../components/TransactionLink'
import InvoiceThumbnail from '../components/InvoiceThumbnail'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const InvestorMarketplace = () => {
  const { account, contract, getInvoicesByStatus, getInvoice, connectWallet } = useWeb3()
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('dueDate') // dueDate, roi, faceValue
  const [filterBy, setFilterBy] = useState('all') // all, highROI, shortTerm

  useEffect(() => {
    loadMarketplaceInvoices()
  }, [contract])

  useEffect(() => {
    filterAndSortInvoices()
  }, [invoices, searchTerm, sortBy, filterBy])

  const loadMarketplaceInvoices = async () => {
    if (!contract) return
    
    try {
      setLoading(true)
      // Get invoices with status 0 (OnMarket)
      const tokenIds = await getInvoicesByStatus(0)
      console.log('Token IDs with status 0 (OnMarket):', tokenIds)
      
      // Fetch full invoice details for each token ID
      const invoicePromises = tokenIds.map(tokenId => getInvoice(tokenId))
      const invoiceDetails = await Promise.all(invoicePromises)
      console.log('Invoice details:', invoiceDetails)
      
      // Filter out any null results and set the invoices
      const validInvoices = invoiceDetails.filter(invoice => invoice !== null)
      console.log('Valid invoices:', validInvoices)
      setInvoices(validInvoices)
    } catch (error) {
      console.error('Error loading marketplace invoices:', error)
      toast.error('Failed to load marketplace invoices')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortInvoices = () => {
    let filtered = [...invoices]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.id.toString().includes(searchTerm) ||
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.sme.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterBy === 'highROI') {
      filtered = filtered.filter(invoice => calculateROI(invoice) >= 15)
    } else if (filterBy === 'shortTerm') {
      const thirtyDaysFromNow = Date.now() / 1000 + (30 * 24 * 60 * 60)
      filtered = filtered.filter(invoice => invoice.dueDate <= thirtyDaysFromNow)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roi':
          return calculateROI(b) - calculateROI(a)
        case 'faceValue':
          return Number(b.faceValue - a.faceValue) / 1e18
        case 'dueDate':
        default:
          return Number(a.dueDate - b.dueDate)
      }
    })

    setFilteredInvoices(filtered)
  }

  const calculateROI = (invoice) => {
    const faceValue = Number(invoice.faceValue) / 1e18 // Convert from wei to FLOW
    const salePrice = Number(invoice.salePrice) / 1e18 // Convert from wei to FLOW
    return ((faceValue - salePrice) / salePrice * 100)
  }

  const calculateDaysToMaturity = (dueDate) => {
    const now = Math.floor(Date.now() / 1000)
    const dueDateNumber = Number(dueDate)
    const days = Math.ceil((dueDateNumber - now) / (24 * 60 * 60))
    return Math.max(0, days)
  }

  const isInvoiceExpired = (dueDate) => {
    const now = Date.now() / 1000
    return now > dueDate
  }

  const formatDate = (timestamp) => {
    const timestampNumber = Number(timestamp) // Convert BigInt to Number
    return new Date(timestampNumber * 1000).toLocaleDateString()
  }

  const formatFlow = (amount) => {
    const amountInFlow = Number(amount) / 1e18 // Convert from wei to FLOW
    return `${amountInFlow.toFixed(2)} FLOW`
  }

  const getROIColor = (roi) => {
    if (roi >= 20) return 'text-green-600'
    if (roi >= 15) return 'text-green-500'
    if (roi >= 10) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getRiskLevel = (invoice) => {
    const days = calculateDaysToMaturity(invoice.dueDate)
    const roi = calculateROI(invoice)
    
    if (days <= 7 && roi >= 20) return { level: 'High Risk', color: 'text-red-600', bg: 'bg-red-100' }
    if (days <= 30 && roi >= 15) return { level: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Low Risk', color: 'text-green-600', bg: 'bg-green-100' }
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the marketplace</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Marketplace</h1>
          <p className="text-gray-600">Discover and invest in tokenized invoices</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. ROI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.length > 0 
                    ? `${(invoices.reduce((sum, inv) => sum + calculateROI(inv), 0) / invoices.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Maturity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.length > 0
                    ? `${Math.round(invoices.reduce((sum, inv) => sum + calculateDaysToMaturity(inv.dueDate), 0) / invoices.length)} days`
                    : '0 days'
                  }
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
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFlow(invoices.reduce((sum, inv) => BigInt(sum) + BigInt(inv.faceValue || 0), 0n))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by invoice ID, client, or SME address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-field"
                  />
                </div>
              </div>
              
              {/* Filter */}
              <div className="flex gap-4">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Invoices</option>
                  <option value="highROI">High ROI (15%+)</option>
                  <option value="shortTerm">Short Term (≤30 days)</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="roi">Sort by ROI</option>
                  <option value="faceValue">Sort by Value</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading marketplace...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {invoices.length === 0 ? 'No invoices available' : 'No invoices match your filters'}
            </h3>
            <p className="text-gray-600">
              {invoices.length === 0 
                ? 'Check back later for new investment opportunities'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => {
              const roi = calculateROI(invoice)
              const daysToMaturity = calculateDaysToMaturity(invoice.dueDate)
              const risk = getRiskLevel(invoice)
              const isExpired = isInvoiceExpired(invoice.dueDate)
              
              return (
                <div key={invoice.id} className={`card ${isExpired ? 'opacity-75 border-gray-300' : 'card-hover'}`}>
                  <div className="p-6">
                    {/* Header with Thumbnail */}
                    <div className="flex items-start gap-4 mb-4">
                      <InvoiceThumbnail invoiceId={invoice.id} className="w-16 h-16" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Invoice #{invoice.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              SME: {invoice.sme?.slice(0, 6)}...{invoice.sme?.slice(-4)}
                            </p>
                          </div>
                          {isExpired ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              Expired
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${risk.bg} ${risk.color}`}>
                              {risk.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Key Metrics */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Face Value:</span>
                        <span className="font-semibold">{formatFlow(invoice.faceValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sale Price:</span>
                        <span className="font-semibold">{formatFlow(invoice.salePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Potential ROI:</span>
                        <span className={`font-bold ${getROIColor(roi)}`}>
                          {roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Due Date:</span>
                        <span className="font-semibold">{formatDate(invoice.dueDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Days to Maturity:</span>
                        <span className="font-semibold">
                          {daysToMaturity} days
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Time Progress</span>
                        <span>{Math.min(100, Math.max(0, 100 - (daysToMaturity / 90) * 100)).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, 100 - (daysToMaturity / 90) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    {isExpired ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center"
                      >
                        Expired - Cannot Purchase
                      </button>
                    ) : (
                      <Link
                        to={`/invoice/${invoice.id}`}
                        className="w-full btn-primary flex items-center justify-center"
                      >
                        View Details
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Load More Button (if needed) */}
        {filteredInvoices.length > 0 && filteredInvoices.length < invoices.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setFilterBy('all')}
              className="btn-outline"
            >
              Show All Invoices
            </button>
          </div>
        )}
      </div>
      
      {/* Transaction History */}
      <div className="mt-8">
        <TransactionHistory limit={5} />
      </div>
    </div>
  )
}

export default InvestorMarketplace