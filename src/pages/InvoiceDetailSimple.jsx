import React from 'react'
import { useParams } from 'react-router-dom'

const InvoiceDetailSimple = () => {
  const { tokenId } = useParams()
  
  console.log('SIMPLE COMPONENT RENDERED - tokenId:', tokenId)
  alert('SIMPLE COMPONENT RENDERED - tokenId: ' + tokenId)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Invoice Detail Simple</h1>
        <p className="text-gray-600 mb-4">Token ID: {tokenId}</p>
        <p className="text-sm text-gray-500">This is a simple test component</p>
      </div>
    </div>
  )
}

export default InvoiceDetailSimple