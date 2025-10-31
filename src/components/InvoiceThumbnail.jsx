import React from 'react'

const InvoiceThumbnail = ({ invoiceId, className = "w-16 h-16" }) => {
  // Generate deterministic colors based on invoice ID
  const generateColors = (id) => {
    const seed = parseInt(id?.toString() || '1') || 1
    const hue1 = (seed * 137.508) % 360 // Golden angle approximation
    const hue2 = (hue1 + 60) % 360
    const hue3 = (hue1 + 120) % 360
    
    return {
      primary: `hsl(${hue1}, 70%, 60%)`,
      secondary: `hsl(${hue2}, 60%, 70%)`,
      accent: `hsl(${hue3}, 80%, 50%)`
    }
  }

  // Generate geometric pattern based on invoice ID
  const generatePattern = (id) => {
    const seed = parseInt(id?.toString() || '1') || 1
    const patterns = [
      'circles',
      'triangles', 
      'squares',
      'diamonds',
      'hexagons'
    ]
    return patterns[seed % patterns.length]
  }

  const safeInvoiceId = invoiceId || '1'
  const colors = generateColors(safeInvoiceId)
  const pattern = generatePattern(safeInvoiceId)
  const seed = parseInt(safeInvoiceId.toString()) || 1

  // Create unique SVG based on pattern type
  const renderPattern = () => {
    switch (pattern) {
      case 'circles':
        return (
          <>
            <circle cx="20" cy="20" r="8" fill={colors.primary} opacity="0.8" />
            <circle cx="44" cy="20" r="6" fill={colors.secondary} opacity="0.7" />
            <circle cx="32" cy="40" r="10" fill={colors.accent} opacity="0.6" />
            <circle cx="15" cy="45" r="5" fill={colors.primary} opacity="0.9" />
          </>
        )
      case 'triangles':
        return (
          <>
            <polygon points="32,10 20,30 44,30" fill={colors.primary} opacity="0.8" />
            <polygon points="15,45 10,55 20,55" fill={colors.secondary} opacity="0.7" />
            <polygon points="45,40 40,50 50,50" fill={colors.accent} opacity="0.6" />
          </>
        )
      case 'squares':
        return (
          <>
            <rect x="15" y="15" width="12" height="12" fill={colors.primary} opacity="0.8" transform={`rotate(${seed % 45} 21 21)`} />
            <rect x="35" y="25" width="10" height="10" fill={colors.secondary} opacity="0.7" transform={`rotate(${(seed * 2) % 45} 40 30)`} />
            <rect x="20" y="40" width="8" height="8" fill={colors.accent} opacity="0.6" transform={`rotate(${(seed * 3) % 45} 24 44)`} />
          </>
        )
      case 'diamonds':
        return (
          <>
            <polygon points="32,15 40,25 32,35 24,25" fill={colors.primary} opacity="0.8" />
            <polygon points="15,40 20,45 15,50 10,45" fill={colors.secondary} opacity="0.7" />
            <polygon points="45,35 50,40 45,45 40,40" fill={colors.accent} opacity="0.6" />
          </>
        )
      case 'hexagons':
      default:
        return (
          <>
            <polygon points="32,12 40,18 40,30 32,36 24,30 24,18" fill={colors.primary} opacity="0.8" />
            <polygon points="15,40 20,43 20,49 15,52 10,49 10,43" fill={colors.secondary} opacity="0.7" />
            <polygon points="45,25 48,27 48,31 45,33 42,31 42,27" fill={colors.accent} opacity="0.6" />
          </>
        )
    }
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden shadow-sm border border-gray-200 flex-shrink-0`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 64 64" 
        className="w-full h-full"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id={`gradient-${invoiceId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <rect width="64" height="64" fill={`url(#gradient-${invoiceId})`} />
        
        {/* Pattern elements */}
        {renderPattern()}
        
        {/* Invoice ID overlay */}
        <text 
          x="32" 
          y="58" 
          textAnchor="middle" 
          fontSize="8" 
          fill={colors.primary} 
          fontWeight="bold"
          opacity="0.8"
        >
          #{safeInvoiceId.toString().slice(-3)}
        </text>
      </svg>
    </div>
  )
}

export default InvoiceThumbnail