import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Web3Provider } from './contexts/Web3Context'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SMEDashboard from './pages/SMEDashboard'
import InvestorMarketplace from './pages/InvestorMarketplace'
import InvoiceDetail from './pages/InvoiceDetail'
import InvestorPortfolio from './pages/InvestorPortfolio'
import ClientDashboard from './pages/ClientDashboard'
import Footer from './components/Footer'

function App() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sme-dashboard" element={<SMEDashboard />} />
            <Route path="/marketplace" element={<InvestorMarketplace />} />
            <Route path="/invoice/:tokenId" element={<InvoiceDetail />} />
            <Route path="/portfolio" element={<InvestorPortfolio />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Web3Provider>
  )
}

export default App