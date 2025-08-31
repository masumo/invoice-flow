import React from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const Home = () => {
  const { account } = useWeb3()

  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Instant Liquidity',
      description: 'Convert your invoices to cash immediately without waiting for payment terms.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Blockchain Security',
      description: 'Secure, transparent, and immutable transactions on the XDC Network.'
    },
    {
      icon: ClockIcon,
      title: 'Fast Settlement',
      description: 'Quick processing with low fees thanks to XDC Network\'s efficiency.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Access',
      description: 'Access to a global pool of investors and financing opportunities.'
    }
  ]

  const stats = [
    { label: 'Total Volume', value: '$2.5M+', description: 'Invoices financed' },
    { label: 'Active SMEs', value: '150+', description: 'Businesses served' },
    { label: 'Avg. ROI', value: '12%', description: 'For investors' },
    { label: 'Success Rate', value: '98%', description: 'Repayment rate' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Revolutionize Invoice
              <span className="block text-xdc-200">Financing with DeFi</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              InvoiceFlow transforms traditional invoice financing through blockchain technology, 
              connecting SMEs with global investors on the XDC Network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={account ? "/sme-dashboard" : "/marketplace"}
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                {account ? "Go to Dashboard" : "Explore Marketplace"}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/marketplace"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                Start Investing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose InvoiceFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on the XDC Network for optimal performance, security, and cost-effectiveness
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How InvoiceFlow Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, secure, and efficient invoice financing in three steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* For SMEs */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <UserGroupIcon className="h-8 w-8 text-primary-600 mr-3" />
                For SMEs
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Tokenize Invoice</h4>
                    <p className="text-gray-600">Upload your invoice and convert it into an NFT on the blockchain</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Set Terms</h4>
                    <p className="text-gray-600">Define the sale price and due date for your invoice</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Get Paid</h4>
                    <p className="text-gray-600">Receive immediate payment when an investor purchases your invoice</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Investors */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <ChartBarIcon className="h-8 w-8 text-xdc-600 mr-3" />
                For Investors
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-xdc-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Browse Marketplace</h4>
                    <p className="text-gray-600">Explore available invoices and analyze potential returns</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-xdc-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Purchase Invoice</h4>
                    <p className="text-gray-600">Buy invoice NFTs at a discount to the face value</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-xdc-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Earn Returns</h4>
                    <p className="text-gray-600">Collect the full face value when the client pays the invoice</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the future of invoice financing on the XDC Network. 
            Fast, secure, and globally accessible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sme-dashboard"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              Start as SME
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/marketplace"
              className="bg-xdc-600 hover:bg-xdc-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              Start Investing
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home