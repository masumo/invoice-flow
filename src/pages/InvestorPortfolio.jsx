import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import { toast } from 'react-hot-toast'
import InvoiceThumbnail from '../components/InvoiceThumbnail'
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const InvestorPortfolio = () => {
  const { account, contract, getInvoicesByOwner, getInvoice, connectWallet } = useWeb3()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, active, repaid, defaulted

  useEffect(() => {
    if (account && contract) {
      loadPortfolio()
    }
  }, [account, contract])

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      const tokenIds = await getInvoicesByOwner(account)
      
      // Fetch full invoice data for each token ID
      const invoicePromises = tokenIds.map(async (tokenId) => {
        return await getInvoice(tokenId)
      })
      
      const allInvoices = await Promise.all(invoicePromises)
      // Filter out null results and only show invoices that were purchased (status 1, 2, or 3)
      const purchasedInvoices = allInvoices.filter(invoice => invoice && invoice.status !== 0)
      setInvoices(purchasedInvoices)
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredInvoices = () => {
    switch (filter) {
      case 'active':
        return invoices.filter(inv => inv.status === 1) // Sold (waiting for repayment)
      case 'repaid':
        return invoices.filter(inv => inv.status === 2) // Repaid
      case 'defaulted':
        return invoices.filter(inv => inv.status === 3) // Defaulted
      default:
        return invoices
    }
  }

  const calculatePortfolioStats = () => {
    const totalInvested = invoices.reduce((sum, inv) => {
      const salePrice = parseFloat(inv.salePrice || 0)
      return sum + (isNaN(salePrice) ? 0 : salePrice)
    }, 0)
    
    const totalFaceValue = invoices.reduce((sum, inv) => {
      const faceValue = parseFloat(inv.faceValue || 0)
      return sum + (isNaN(faceValue) ? 0 : faceValue)
    }, 0)
    
    const repaidInvoices = invoices.filter(inv => inv.status === 2)
    const totalReturns = repaidInvoices.reduce((sum, inv) => {
      const faceValue = parseFloat(inv.faceValue || 0)
      return sum + (isNaN(faceValue) ? 0 : faceValue)
    }, 0)
    
    const totalProfit = totalReturns - repaidInvoices.reduce((sum, inv) => {
      const salePrice = parseFloat(inv.salePrice || 0)
      return sum + (isNaN(salePrice) ? 0 : salePrice)
    }, 0)
    
    const activeInvoices = invoices.filter(inv => inv.status === 1)
    const defaultedInvoices = invoices.filter(inv => inv.status === 3)
    
    return {
      totalInvested,
      totalFaceValue,
      totalReturns,
      totalProfit,
      activeCount: activeInvoices.length,
      repaidCount: repaidInvoices.length,
      defaultedCount: defaultedInvoices.length,
      totalCount: invoices.length,
      roi: totalInvested > 0 ? (totalProfit / totalInvested * 100) : 0
    }
  }

  const calculateROI = (invoice) => {
    const faceValue = parseFloat(invoice.faceValue || 0)
    const salePrice = parseFloat(invoice.salePrice || 0)
    
    if (isNaN(faceValue) || isNaN(salePrice) || salePrice === 0) {
      return 0
    }
    
    return ((faceValue - salePrice) / salePrice * 100)
  }

  const calculateDaysToMaturity = (dueDate) => {
    const now = Date.now() / 1000
    const days = Math.ceil((dueDate - now) / (24 * 60 * 60))
    return Math.max(0, days)
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatXDC = (amount) => {
    const value = parseFloat(amount || 0)
    return `${isNaN(value) ? 0 : value.toFixed(2)} XDC`
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 1:
        return {
          text: 'Active',
          icon: ClockIcon,
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

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view your portfolio</p>
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

  const stats = calculatePortfolioStats()
  const filteredInvoices = getFilteredInvoices()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-600 mt-1">Track your invoice investments and returns</p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-gray-900">{formatXDC(stats.totalInvested)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{formatXDC(stats.totalReturns)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Profit</p>
                  <p className={`text-2xl font-bold ${
                    stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.totalProfit >= 0 ? '+' : ''}{formatXDC(stats.totalProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Portfolio ROI</p>
                  <p className={`text-2xl font-bold ${
                    stats.roi >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="p-6">
              <ClockIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.activeCount}</p>
              <p className="text-sm text-gray-600">Active Investments</p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="p-6">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.repaidCount}</p>
              <p className="text-sm text-gray-600">Repaid Invoices</p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="p-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.defaultedCount}</p>
              <p className="text-sm text-gray-600">Defaulted Invoices</p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="p-6">
              <DocumentTextIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
              <p className="text-sm text-gray-600">Total Invoices</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Investments</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({stats.totalCount})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({stats.activeCount})
                </button>
                <button
                  onClick={() => setFilter('repaid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'repaid'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Repaid ({stats.repaidCount})
                </button>
                <button
                  onClick={() => setFilter('defaulted')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'defaulted'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Defaulted ({stats.defaultedCount})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading portfolio...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {invoices.length === 0 ? 'No investments yet' : 'No invoices match this filter'}
            </h3>
            <p className="text-gray-600 mb-6">
              {invoices.length === 0 
                ? 'Start investing in tokenized invoices to build your portfolio'
                : 'Try selecting a different filter to view your investments'
              }
            </p>
            {invoices.length === 0 && (
              <Link to="/marketplace" className="btn-primary">
                Explore Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => {
              const statusInfo = getStatusInfo(invoice.status)
              const roi = calculateROI(invoice)
              const daysToMaturity = calculateDaysToMaturity(invoice.dueDate)
              const faceValue = parseFloat(invoice.faceValue || 0)
              const salePrice = parseFloat(invoice.salePrice || 0)
              const profit = (isNaN(faceValue) || isNaN(salePrice)) ? 0 : (faceValue - salePrice)
              
              return (
                <div key={invoice.id} className="card card-hover">
                  <div className="p-6">
                    {/* Thumbnail */}
                     <div className="mb-4">
                       <InvoiceThumbnail invoiceId={invoice.id} className="w-16 h-16 mx-auto" />
                     </div>
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Invoice #{invoice.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          SME: {invoice.sme?.slice(0, 6)}...{invoice.sme?.slice(-4)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color} flex items-center`}>
                        <statusInfo.icon className="h-3 w-3 mr-1" />
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    {/* Investment Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Invested:</span>
                        <span className="font-semibold">{formatXDC(invoice.salePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Face Value:</span>
                        <span className="font-semibold">{formatXDC(invoice.faceValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Potential Profit:</span>
                        <span className={`font-semibold ${
                          invoice.status === 2 ? 'text-green-600' : 
                          invoice.status === 3 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {invoice.status === 3 ? '-' : '+'}{formatXDC(profit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ROI:</span>
                        <span className={`font-bold ${
                          invoice.status === 2 ? 'text-green-600' : 
                          invoice.status === 3 ? 'text-red-600' : 'text-purple-600'
                        }`}>
                          {invoice.status === 3 ? '-100%' : `${(isNaN(roi) ? 0 : roi).toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Due Date:</span>
                        <span className="font-semibold">{formatDate(invoice.dueDate)}</span>
                      </div>
                      {invoice.status === 1 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Days to Maturity:</span>
                          <span className={`font-semibold ${
                            daysToMaturity <= 7 ? 'text-red-600' : 
                            daysToMaturity <= 30 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {daysToMaturity} days
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar for Active Invoices */}
                    {invoice.status === 1 && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Time Progress</span>
                          <span>{Math.min(100, Math.max(0, 100 - (daysToMaturity / 90) * 100)).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, 100 - (daysToMaturity / 90) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <Link
                      to={`/invoice/${invoice.id}`}
                      className="w-full btn-outline flex items-center justify-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Call to Action */}
        {invoices.length > 0 && (
          <div className="text-center mt-12">
            <div className="card inline-block">
              <div className="p-8">
                <ArrowTrendingUpIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Expand Your Portfolio?
                </h3>
                <p className="text-gray-600 mb-6">
                  Discover new investment opportunities in the marketplace
                </p>
                <Link
                  to="/marketplace"
                  className="btn-primary inline-flex items-center"
                >
                  Explore Marketplace
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvestorPortfolio