import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

// Contract ABI - This would typically be imported from a generated file
const CONTRACT_ABI = [
  "function tokenizeInvoice(address client, uint256 faceValue, uint256 salePrice, uint256 dueDate, string memory invoiceURI) external returns (uint256)",
  "function buyInvoice(uint256 tokenId) external payable",
  "function repayInvoice(uint256 tokenId) external payable",
  "function markAsDefaulted(uint256 tokenId) external",
  "function getInvoicesByStatus(uint8 status) external view returns (uint256[])",
  "function getInvoicesByOwner(address owner) external view returns (uint256[])",
  "function getInvoice(uint256 tokenId) external view returns (tuple(uint256 id, address sme, address investor, address client, uint256 faceValue, uint256 salePrice, uint256 dueDate, string invoiceURI, uint8 status, uint256 createdAt))",
  "function getTotalInvoices() external view returns (uint256)",
  "function calculateProfit(uint256 tokenId) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event InvoiceTokenized(uint256 indexed tokenId, address indexed sme, address indexed client, uint256 faceValue, uint256 salePrice, uint256 dueDate, string invoiceURI)",
  "event InvoiceSold(uint256 indexed tokenId, address indexed sme, address indexed investor, uint256 salePrice)",
  "event InvoiceRepaid(uint256 indexed tokenId, address indexed investor, address indexed client, uint256 faceValue)"
]

const Web3Context = createContext()

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
  const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '51')
  const TARGET_NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'XDC Apothem Network'

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to use this application')
      return
    }

    setIsConnecting(true)
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      const network = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))

      // Check if we're on the correct network
      const correctNetwork = Number(network.chainId) === TARGET_CHAIN_ID
      setIsCorrectNetwork(correctNetwork)

      if (!correctNetwork) {
        toast.error(`Please switch to ${TARGET_NETWORK_NAME}`)
      }

      // Initialize contract if we have the address and are on correct network
      if (CONTRACT_ADDRESS && correctNetwork) {
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer)
        setContract(contractInstance)
      }

      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [CONTRACT_ADDRESS, TARGET_CHAIN_ID, TARGET_NETWORK_NAME])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setChainId(null)
    setIsCorrectNetwork(false)
    toast.success('Wallet disconnected')
  }, [])

  // Switch to correct network
  const switchNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }]
      })
    } catch (error) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
              chainName: TARGET_NETWORK_NAME,
              nativeCurrency: {
                name: 'XDC',
                symbol: 'XDC',
                decimals: 18
              },
              rpcUrls: [import.meta.env.VITE_RPC_URL || 'https://rpc.apothem.network'],
              blockExplorerUrls: TARGET_CHAIN_ID === 51 
                ? ['https://explorer.apothem.network']
                : ['https://explorer.xinfin.network']
            }]
          })
        } catch (addError) {
          console.error('Error adding network:', addError)
          toast.error('Failed to add network')
        }
      } else {
        console.error('Error switching network:', error)
        toast.error('Failed to switch network')
      }
    }
  }, [TARGET_CHAIN_ID, TARGET_NETWORK_NAME])

  // Contract interaction functions
  const tokenizeInvoice = useCallback(async (invoiceData) => {
    if (!contract || !signer) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await contract.tokenizeInvoice(
        invoiceData.client,
        ethers.parseEther(invoiceData.faceValue.toString()),
        ethers.parseEther(invoiceData.salePrice.toString()),
        invoiceData.dueDate,
        invoiceData.invoiceURI
      )

      toast.success('Transaction submitted! Waiting for confirmation...')
      const receipt = await tx.wait()
      
      // Extract token ID from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed.name === 'InvoiceTokenized'
        } catch {
          return false
        }
      })

      const tokenId = event ? contract.interface.parseLog(event).args.tokenId : null
      
      toast.success('Invoice tokenized successfully!')
      return { receipt, tokenId }
    } catch (error) {
      console.error('Error tokenizing invoice:', error)
      throw error
    }
  }, [contract, signer])

  const buyInvoice = useCallback(async (tokenId, salePriceWei) => {
    if (!contract || !signer) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await contract.buyInvoice(tokenId, {
        value: salePriceWei // Use wei value directly
      })

      toast.success('Transaction submitted! Waiting for confirmation...')
      const receipt = await tx.wait()
      toast.success('Invoice purchased successfully!')
      return receipt
    } catch (error) {
      console.error('Error buying invoice:', error)
      throw error
    }
  }, [contract, signer])

  const repayInvoice = useCallback(async (tokenId, faceValue) => {
    if (!contract || !signer) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await contract.repayInvoice(tokenId, {
        value: faceValue.toString()
      })

      toast.success('Transaction submitted! Waiting for confirmation...')
      const receipt = await tx.wait()
      toast.success('Invoice repaid successfully!')
      return receipt
    } catch (error) {
      console.error('Error repaying invoice:', error)
      throw error
    }
  }, [contract, signer])

  const getInvoicesByStatus = useCallback(async (status) => {
    if (!contract) return []

    try {
      const tokenIds = await contract.getInvoicesByStatus(status)
      return tokenIds.map(id => Number(id))
    } catch (error) {
      console.error('Error fetching invoices by status:', error)
      return []
    }
  }, [contract])

  const getInvoicesByOwner = useCallback(async (owner) => {
    if (!contract) return []

    try {
      const tokenIds = await contract.getInvoicesByOwner(owner)
      return tokenIds.map(id => Number(id))
    } catch (error) {
      console.error('Error fetching invoices by owner:', error)
      return []
    }
  }, [contract])

  const getInvoice = useCallback(async (tokenId) => {
    if (!contract) return null

    try {
      const invoice = await contract.getInvoice(tokenId)
      return {
        id: Number(invoice.id),
        sme: invoice.sme,
        investor: invoice.investor,
        client: invoice.client,
        faceValue: ethers.formatEther(invoice.faceValue),
        salePrice: ethers.formatEther(invoice.salePrice),
        salePriceWei: invoice.salePrice, // Keep original wei value for transactions
        faceValueWei: invoice.faceValue, // Keep original wei value for transactions
        dueDate: Number(invoice.dueDate),
        invoiceURI: invoice.invoiceURI,
        status: Number(invoice.status),
        createdAt: Number(invoice.createdAt)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return null
    }
  }, [contract])

  const getInvoicesByClient = useCallback(async (clientAddress) => {
    if (!contract || !provider) return []

    try {
      // Use event filtering to find invoices where the user is the client
      const filter = contract.filters.InvoiceTokenized(null, null, clientAddress)
      const events = await contract.queryFilter(filter)
      
      // Get invoice details for each tokenId found in events
      const invoices = []
      for (const event of events) {
        const tokenId = Number(event.args.tokenId)
        try {
          const invoice = await getInvoice(tokenId)
          if (invoice) {
            invoices.push(invoice)
          }
        } catch (error) {
          console.error(`Error fetching invoice ${tokenId}:`, error)
          // Continue with other invoices even if one fails
        }
      }
      
      return invoices
    } catch (error) {
      console.error('Error fetching invoices by client:', error)
      return []
    }
  }, [contract, provider, getInvoice])

  // Listen for account and network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
      }
    }

    const handleChainChanged = (chainId) => {
      const newChainId = parseInt(chainId, 16)
      setChainId(newChainId)
      setIsCorrectNetwork(newChainId === TARGET_CHAIN_ID)
      
      if (newChainId !== TARGET_CHAIN_ID) {
        setContract(null)
        toast.error(`Please switch to ${TARGET_NETWORK_NAME}`)
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [account, disconnectWallet, TARGET_CHAIN_ID, TARGET_NETWORK_NAME])

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await connectWallet()
        }
      } catch (error) {
        console.error('Error auto-connecting:', error)
      }
    }

    autoConnect()
  }, [connectWallet])

  const value = {
    // State
    account,
    provider,
    signer,
    contract,
    chainId,
    isConnecting,
    isCorrectNetwork,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    
    // Contract functions
    tokenizeInvoice,
    buyInvoice,
    repayInvoice,
    getInvoicesByStatus,
    getInvoicesByOwner,
    getInvoice,
    getInvoicesByClient,
    
    // Constants
    CONTRACT_ADDRESS,
    TARGET_CHAIN_ID,
    TARGET_NETWORK_NAME
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}