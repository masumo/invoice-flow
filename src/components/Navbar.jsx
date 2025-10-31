import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import ConnectWallet from './ConnectWallet'
import NetworkDisplay from './NetworkDisplay'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { account } = useWeb3()
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', show: true },
    { name: 'Marketplace', href: '/marketplace', show: true },
    { name: 'SME Dashboard', href: '/sme-dashboard', show: !!account },
    { name: 'Portfolio', href: '/portfolio', show: !!account },
    { name: 'Client Dashboard', href: '/client-dashboard', show: !!account },
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-flow-500 to-flow-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">InvoiceFlow</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation
              .filter(item => item.show)
              .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))
            }
          </div>

          {/* Right side - Wallet and Network */}
          <div className="hidden md:flex items-center space-x-4">
            <NetworkDisplay />
            <ConnectWallet />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            {/* Navigation links */}
            {navigation
              .filter(item => item.show)
              .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))
            }
            
            {/* Network display */}
            <div className="pt-3 border-t border-gray-200">
              <NetworkDisplay />
            </div>
            
            {/* Wallet connection */}
            <div className="pt-2">
              <ConnectWallet />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar