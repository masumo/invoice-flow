import React from 'react'
import { useParams } from 'react-router-dom'

const InvoiceDetailDebug = () => {
  const { tokenId } = useParams()
  
  console.log('=== INVOICE DETAIL DEBUG COMPONENT RENDERED ===', tokenId)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Invoice Detail Debug</h1>
        <p className="text-gray-600 mb-4">Token ID: {tokenId}</p>
        <p className="text-sm text-gray-500">This is a debug component to test rendering</p>
      </div>
    </div>
  )
}

export default InvoiceDetailDebug