import React from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import { isFlowNetwork } from '../utils/blockchain'

export default function Home() {
  const { account, chainId, isCorrectNetwork, connectWallet } = useWeb3()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl py-16 px-8 shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            InvoiceFlow
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            InvoiceFlow transforms traditional invoice financing through blockchain technology, 
            connecting SMEs with global investors on the Flow blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!account ? (
              <button
                onClick={connectWallet}
                className="bg-flow-600 hover:bg-flow-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg"
              >
                Connect Wallet
              </button>
            ) : !isCorrectNetwork ? (
              <div className="text-red-400 font-semibold">
                Please switch to Flow EVM network
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  to="/sme"
                  className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg"
                >
                  SME Dashboard
                </Link>
                <Link
                  to="/investor"
                  className="bg-flow-600 hover:bg-flow-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg"
                >
                  Investor Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">For SMEs</h3>
            <ul className="text-gray-700 space-y-2">
              <li>✓ Tokenize invoices as NFTs</li>
              <li>✓ Get immediate liquidity</li>
              <li>✓ Track payment status</li>
              <li>✓ Manage cash flow efficiently</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">For Investors</h3>
            <ul className="text-gray-700 space-y-2">
              <li>✓ Browse invoice marketplace</li>
              <li>✓ Invest in verified invoices</li>
              <li>✓ Earn fixed returns</li>
              <li>✓ Diversify portfolio</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Features</h3>
            <ul className="text-gray-700 space-y-2">
              <li>✓ Flow EVM powered</li>
              <li>✓ FLIP-338 compliant</li>
              <li>✓ Secure & transparent</li>
              <li>✓ Low transaction fees</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="text-4xl text-flow-600 mb-4">1</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Tokenize Invoice</h4>
              <p className="text-gray-600">SMEs create NFTs from their invoices with verified client information</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="text-4xl text-flow-600 mb-4">2</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Get Funded</h4>
              <p className="text-gray-600">Investors purchase invoice NFTs at a discount for immediate SME liquidity</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="text-4xl text-flow-600 mb-4">3</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Settle Payment</h4>
              <p className="text-gray-600">When clients pay, investors receive the full invoice amount automatically</p>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-gray-200">
            <div className={`w-3 h-3 rounded-full ${isCorrectNetwork ? 'bg-flow-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-900">
              {chainId ? (
                isFlowNetwork(chainId.toString()) ? (
                  'Connected to Flow EVM'
                ) : (
                  'Please switch to Flow EVM network'
                )
              ) : (
                'Not connected'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}