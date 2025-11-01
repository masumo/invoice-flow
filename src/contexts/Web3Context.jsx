import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { getTransactionUrl, getAddressUrl, formatTxHash, getNetworkName, isFlowNetwork } from '../utils/blockchain'

// Contract ABI - Import from generated file after compilation
import InvoiceNFTABI from '../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json'
import MintInvoiceActionABI from '../artifacts/contracts/MintInvoiceAction.sol/MintInvoiceAction.json'
import PurchaseInvoiceActionABI from '../artifacts/contracts/PurchaseInvoiceAction.sol/PurchaseInvoiceAction.json'
import SettleInvoiceActionABI from '../artifacts/contracts/SettleInvoiceAction.sol/SettleInvoiceAction.json'

// Create Web3 context
const Web3Context = createContext()

// Environment variables
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const MINT_ACTION_ADDRESS = import.meta.env.VITE_MINT_ACTION_ADDRESS
const PURCHASE_ACTION_ADDRESS = import.meta.env.VITE_PURCHASE_ACTION_ADDRESS
const SETTLE_ACTION_ADDRESS = import.meta.env.VITE_SETTLE_ACTION_ADDRESS
const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '545')
const TARGET_NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'Flow EVM Testnet'

// Log environment variables during initialization
console.log('Environment Variables:', {
  CONTRACT_ADDRESS,
  MINT_ACTION_ADDRESS,
  PURCHASE_ACTION_ADDRESS,
  SETTLE_ACTION_ADDRESS,
  TARGET_CHAIN_ID,
  TARGET_NETWORK_NAME,
  RPC_URL: import.meta.env.VITE_RPC_URL
})

// Additional debug logging for Vercel deployment
console.log('Raw Environment Variables:', {
  VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
  VITE_NETWORK_NAME: import.meta.env.VITE_NETWORK_NAME,
  VITE_RPC_URL: import.meta.env.VITE_RPC_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
})

export function Web3Provider({ children }) {
  // State management
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [contract, setContract] = useState(null)
  const [mintAction, setMintAction] = useState(null)
  const [purchaseAction, setPurchaseAction] = useState(null)
  const [settleAction, setSettleAction] = useState(null)
  const [transactionHistory, setTransactionHistory] = useState([])
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // Add transaction to history
  const addTransactionToHistory = useCallback((txHash, type, description, invoiceId = null) => {
    const transaction = {
      hash: txHash,
      type,
      description,
      invoiceId,
      timestamp: Date.now(),
      explorerUrl: getTransactionUrl(txHash, chainId)
    }
    setTransactionHistory(prev => [transaction, ...prev])
  }, [chainId])

  // Get transaction URL for display
  const getTransactionExplorerUrl = useCallback((txHash) => {
    return getTransactionUrl(txHash, chainId)
  }, [chainId])

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

      console.log('Wallet connection successful:', {
        account: accounts[0],
        chainId: Number(network.chainId),
        targetChainId: TARGET_CHAIN_ID,
        signerAddress: web3Signer.address
      })

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))

      // Check if we're on the correct network
      const correctNetwork = Number(network.chainId) === TARGET_CHAIN_ID
      setIsCorrectNetwork(correctNetwork)

      if (!correctNetwork) {
        toast.error(`Please switch to ${TARGET_NETWORK_NAME}`)
        return
      }

      // Initialize contracts if we have addresses and are on correct network
      try {
        console.log('Initializing contracts after wallet connection:', {
          CONTRACT_ADDRESS,
          MINT_ACTION_ADDRESS,
          PURCHASE_ACTION_ADDRESS,
          SETTLE_ACTION_ADDRESS,
          signerAddress: web3Signer.address
        })

        if (CONTRACT_ADDRESS) {
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, InvoiceNFTABI.abi, web3Signer)
          console.log('InvoiceNFT contract initialized:', {
            address: contractInstance.target || contractInstance.address,
            hasInterface: await contractInstance.supportsInterface('0x80ac58cd') // ERC721 interface ID
          })
          setContract(contractInstance)
        } else {
          console.error('CONTRACT_ADDRESS is not set')
        }
        
        if (MINT_ACTION_ADDRESS) {
          const mintActionInstance = new ethers.Contract(MINT_ACTION_ADDRESS, MintInvoiceActionABI.abi, web3Signer)
          console.log('MintAction contract initialized:', mintActionInstance.target || mintActionInstance.address)
          setMintAction(mintActionInstance)
        } else {
          console.error('MINT_ACTION_ADDRESS is not set')
        }
        
        if (PURCHASE_ACTION_ADDRESS) {
          const purchaseActionInstance = new ethers.Contract(PURCHASE_ACTION_ADDRESS, PurchaseInvoiceActionABI.abi, web3Signer)
          console.log('PurchaseAction contract initialized:', purchaseActionInstance.target || purchaseActionInstance.address)
          setPurchaseAction(purchaseActionInstance)
        } else {
          console.error('PURCHASE_ACTION_ADDRESS is not set')
        }
        
        if (SETTLE_ACTION_ADDRESS) {
          const settleActionInstance = new ethers.Contract(SETTLE_ACTION_ADDRESS, SettleInvoiceActionABI.abi, web3Signer)
          console.log('SettleAction contract initialized:', settleActionInstance.target || settleActionInstance.address)
          setSettleAction(settleActionInstance)
        } else {
          console.error('SETTLE_ACTION_ADDRESS is not set')
        }

        toast.success('Wallet connected successfully!')
      } catch (error) {
        console.error('Error initializing contracts:', error)
        toast.error('Failed to initialize contracts')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setMintAction(null)
    setPurchaseAction(null)
    setSettleAction(null)
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
                name: 'FLOW',
                symbol: 'FLOW',
                decimals: 18
              },
              rpcUrls: [import.meta.env.VITE_RPC_URL || 'https://testnet.evm.nodes.onflow.org'],
              blockExplorerUrls: [TARGET_CHAIN_ID === 545 
                ? 'https://evm-testnet.flowscan.io'
        : 'https://flowscan.org']
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
  const tokenizeInvoice = useCallback(async ({ client, faceValue, salePrice, dueDate, invoiceURI }) => {
    if (!mintAction || !signer || !contract) {
      console.error('Contract state:', {
        mintAction: !!mintAction,
        signer: !!signer,
        contract: !!contract,
        mintActionAddress: MINT_ACTION_ADDRESS,
        contractAddress: CONTRACT_ADDRESS
      })
      throw new Error('Contracts not initialized')
    }
  
    try {
      console.log('Tokenizing invoice with params:', { client, faceValue, salePrice, dueDate, invoiceURI })
      
      const parsedFaceValue = ethers.parseEther(faceValue.toString())
      const parsedSalePrice = ethers.parseEther(salePrice.toString())
      
      console.log('Parsed values:', {
        parsedFaceValue: parsedFaceValue.toString(),
        parsedSalePrice: parsedSalePrice.toString()
      })
      
      const tx = await mintAction.execute(
        account,
        client,
        parsedFaceValue,
        parsedSalePrice,
        dueDate,
        invoiceURI || `ipfs://invoice-${Date.now()}`
      )
      
      console.log('Transaction hash:', tx.hash)
      const receipt = await tx.wait()
      console.log('Transaction receipt:', receipt)
  
      // Log all events from the transaction
      console.log('Transaction receipt:', {
        to: receipt.to,
        from: receipt.from,
        status: receipt.status,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data
        }))
      })

      // Try to find InvoiceMinted event
      let tokenId
      for (const log of receipt.logs) {
        try {
          // Check if log is from our contract
          if (log.address.toLowerCase() === MINT_ACTION_ADDRESS.toLowerCase()) {
            const parsed = mintAction.interface.parseLog(log)
            console.log('Parsed log:', parsed)
            
            if (parsed.name === 'InvoiceMinted') {
              tokenId = parsed.args.tokenId
              console.log('Found InvoiceMinted event with tokenId:', tokenId.toString())
              break
            }
          }
        } catch (e) {
          console.log('Failed to parse log:', e)
          continue
        }
      }

      if (!tokenId) {
        console.error('All transaction logs:', receipt.logs)
        throw new Error('InvoiceMinted event not found in transaction receipt')
      }
      
      addTransactionToHistory(
        tx.hash,
        'MINT',
        `Created invoice #${tokenId}`,
        tokenId
      )
      
      return receipt
    } catch (error) {
      console.error('Error in tokenizeInvoice:', error)
      throw error
    }
  }, [mintAction, signer, account, addTransactionToHistory])

  const buyInvoice = useCallback(async (tokenId) => {
    console.log('buyInvoice called with tokenId:', tokenId)
    console.log('Contract state:', {
      contract: !!contract,
      purchaseAction: !!purchaseAction,
      signer: !!signer,
      purchaseActionAddress: purchaseAction?.target || purchaseAction?.address,
      PURCHASE_ACTION_ADDRESS
    })

    if (!contract || !purchaseAction || !signer) {
      console.error('Contract initialization check:', {
        contract: !!contract,
        purchaseAction: !!purchaseAction,
        signer: !!signer,
        purchaseActionAddress: purchaseAction?.target || purchaseAction?.address,
        signerAddress: signer?.address,
        contractAddress: contract?.target || contract?.address,
        PURCHASE_ACTION_ADDRESS,
        CONTRACT_ADDRESS
      })
      throw new Error('Contract not initialized')
    }

    // In ethers v6, use .target to get contract address
    const purchaseActionAddress = purchaseAction.target || purchaseAction.address
    if (!purchaseActionAddress) {
      console.error('PurchaseAction address check:', {
        purchaseAction: purchaseAction,
        address: purchaseAction.address,
        target: purchaseAction.target,
        PURCHASE_ACTION_ADDRESS
      })
      throw new Error('PurchaseAction address is not set')
    }

    try {
      console.log('Getting invoice details for tokenId:', tokenId)
      const invoice = await contract.getInvoice(tokenId)
      console.log('Invoice details:', {
        tokenId: tokenId,
        sme: invoice.sme,
        client: invoice.client,
        faceValue: invoice.faceValue.toString(),
        salePrice: invoice.salePrice.toString(),
        dueDate: invoice.dueDate.toString(),
        status: invoice.status,
        currentOwner: invoice.currentOwner
      })
      
      // Check current user
      const currentUser = await signer.getAddress()
      console.log('Current user address:', currentUser)
      console.log('Invoice SME address:', invoice.sme)
      
      // Validate purchase conditions
       if (currentUser.toLowerCase() === invoice.sme.toLowerCase()) {
         throw new Error('SME cannot buy their own invoice')
       }
       
       // Debug status information
       console.log('Invoice status debug:', {
         status: invoice.status,
         statusType: typeof invoice.status,
         statusNumber: Number(invoice.status),
         isZero: invoice.status === 0,
         isStringZero: invoice.status === '0',
         isNumberZero: Number(invoice.status) === 0
       })
       
       if (Number(invoice.status) !== 0) { // 0 = OnMarket, 1 = Sold, 2 = Repaid, 3 = Defaulted
         const statusNames = ['OnMarket', 'Sold', 'Repaid', 'Defaulted']
         throw new Error(`Invoice not for sale. Current status: ${statusNames[Number(invoice.status)] || invoice.status}`)
       }
      
      // Note: Approval check removed - contract now handles transfers internally
      console.log('Proceeding with purchase - no approval required')
      
      // Check user balance
      const userBalance = await signer.provider.getBalance(currentUser)
      console.log('User balance check:', {
        userBalance: userBalance.toString(),
        requiredAmount: invoice.salePrice.toString(),
        hasEnoughBalance: userBalance >= invoice.salePrice
      })
      
      if (userBalance < invoice.salePrice) {
        throw new Error('Insufficient balance to purchase invoice')
      }
      
      // Investor hanya perlu mengirim FLOW untuk membeli invoice
      console.log('Executing purchase with value:', invoice.salePrice.toString())
      const tx = await purchaseAction.execute(tokenId, { value: invoice.salePrice })
      console.log('Purchase transaction:', tx)
      
      const receipt = await tx.wait()
      console.log('Purchase receipt:', receipt)
      
      addTransactionToHistory(
        tx.hash,
        'PURCHASE',
        `Purchased invoice #${tokenId}`,
        tokenId
      )
      
      return receipt
    } catch (error) {
      console.error('Error buying invoice:', error)
      throw error
    }
  }, [purchaseAction, contract, signer, addTransactionToHistory])

  const repayInvoice = useCallback(async (tokenId) => {
    if (!settleAction || !signer) {
      throw new Error('Contract not initialized')
    }

    try {
      const invoice = await contract.getInvoice(tokenId)
      const tx = await settleAction.execute(tokenId, true, { value: invoice.faceValue })
      const receipt = await tx.wait()
      
      addTransactionToHistory(
        tx.hash,
        'REPAY',
        `Repaid invoice #${tokenId}`,
        tokenId
      )
      
      return receipt
    } catch (error) {
      console.error('Error repaying invoice:', error)
      throw error
    }
  }, [settleAction, contract, signer, addTransactionToHistory])

  const markAsDefaulted = useCallback(async (tokenId) => {
    if (!settleAction || !signer) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await settleAction.execute(tokenId, false)
      const receipt = await tx.wait()
      
      addTransactionToHistory(
        tx.hash,
        'DEFAULT',
        `Marked invoice #${tokenId} as defaulted`,
        tokenId
      )
      
      return receipt
    } catch (error) {
      console.error('Error marking invoice as defaulted:', error)
      throw error
    }
  }, [settleAction, signer, addTransactionToHistory])

  // View functions
  const getInvoice = useCallback(async (tokenId) => {
    if (!contract) return null
    try {
      return await contract.getInvoice(tokenId)
    } catch (error) {
      console.error('Error getting invoice:', error)
      return null
    }
  }, [contract])

  const getInvoicesByStatus = useCallback(async (status) => {
    if (!contract) return []
    try {
      return await contract.getInvoicesByStatus(status)
    } catch (error) {
      console.error('Error getting invoices by status:', error)
      return []
    }
  }, [contract])

  const getInvoicesByOwner = useCallback(async (owner) => {
    if (!contract) return []
    try {
      return await contract.getInvoicesByOwner(owner)
    } catch (error) {
      console.error('Error getting invoices by owner:', error)
      return []
    }
  }, [contract])

  const getInvoicesByClient = useCallback(async (client) => {
    if (!contract) {
      console.error('Contract not initialized for getInvoicesByClient')
      return []
    }
    
    try {
      console.log('Calling getInvoicesByClient for address:', client)
      console.log('Contract address:', CONTRACT_ADDRESS)
      
      // Call getInvoicesByClient and handle the response
      const result = await contract.getInvoicesByClient(client)
      console.log('Raw result from getInvoicesByClient:', result)
      
      // Handle empty result cases
      if (!result) {
        console.log('Null result from getInvoicesByClient')
        return []
      }
      
      if (!Array.isArray(result)) {
        console.error('Unexpected result type:', typeof result)
        return []
      }
      
      if (result.length === 0) {
        console.log('No invoices found for client')
        return []
      }
      
      // Convert BigNumber array to number array
      const tokenIds = result.map(id => id.toString())
      console.log('Token IDs for client:', tokenIds)
      
      // Then get full invoice details for each token
      const invoices = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const invoice = await contract.getInvoice(tokenId)
            console.log(`Raw invoice ${tokenId}:`, invoice)
            
            const processedInvoice = {
              ...invoice,
              // Convert BigNumber values to strings
              id: invoice.id.toString(),
              faceValue: ethers.formatEther(invoice.faceValue),
              salePrice: ethers.formatEther(invoice.salePrice),
              dueDate: invoice.dueDate.toString(),
              createdAt: invoice.createdAt.toString(),
              status: Number(invoice.status)
            }
            
            console.log(`Processed invoice ${tokenId} SME data:`, {
              sme: processedInvoice.sme,
              smeFormatted: processedInvoice.sme ? `${processedInvoice.sme.slice(0, 6)}...${processedInvoice.sme.slice(-4)}` : 'N/A',
              investor: processedInvoice.investor,
              client: processedInvoice.client
            })
            
            return processedInvoice
          } catch (error) {
            console.error(`Error getting invoice ${tokenId}:`, error)
            return null
          }
        })
      )
      
      // Filter out any failed invoice fetches
      const validInvoices = invoices.filter(invoice => invoice !== null)
      console.log('Processed invoices for client:', validInvoices)
      return validInvoices
    } catch (error) {
      console.error('Error getting invoices by client:', error)
      return []
    }
  }, [contract])

  const getInvoicesBySME = useCallback(async (sme) => {
    if (!contract) {
      console.error('Contract not initialized')
      return []
    }
    
    try {
      console.log('Calling getInvoicesBySME for address:', sme)
      console.log('Contract address:', CONTRACT_ADDRESS)
      
      // Call getInvoicesBySME and handle the response
      const result = await contract.getInvoicesBySME(sme)
      console.log('Raw result from getInvoicesBySME:', result)
      
      // Handle empty result cases
      if (!result) {
        console.log('Null result from getInvoicesBySME')
        return []
      }
      
      if (!Array.isArray(result)) {
        console.error('Unexpected result type:', typeof result)
        return []
      }
      
      if (result.length === 0) {
        console.log('No invoices found for SME')
        return []
      }
      
      // Convert BigNumber array to number array
      const tokenIds = result.map(id => id.toString())
      console.log('Token IDs for SME:', tokenIds)
      
      // Then get full invoice details for each token
      const invoices = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const invoice = await contract.getInvoice(tokenId)
            console.log(`Raw invoice ${tokenId}:`, invoice)
            
            return {
              ...invoice,
              // Convert BigNumber values to strings
              id: invoice.id.toString(),
              faceValue: ethers.formatEther(invoice.faceValue),
              salePrice: ethers.formatEther(invoice.salePrice),
              dueDate: invoice.dueDate.toString(),
              createdAt: invoice.createdAt.toString(),
              status: Number(invoice.status)
            }
          } catch (error) {
            console.error(`Error getting invoice ${tokenId}:`, error)
            return null
          }
        })
      )
      
      // Filter out any failed invoice fetches
      const validInvoices = invoices.filter(invoice => invoice !== null)
      console.log('Processed invoices:', validInvoices)
      return validInvoices
    } catch (error) {
      console.error('Error getting invoices by SME:', error)
      throw error
    }
  }, [contract])

  // Log contract state changes
  useEffect(() => {
    console.log('Contract state updated:', {
      contract: contract?.target || contract?.address,
      mintAction: mintAction?.target || mintAction?.address,
      purchaseAction: purchaseAction?.target || purchaseAction?.address,
      settleAction: settleAction?.target || settleAction?.address,
      signer: signer?.address,
      account,
      chainId,
      isCorrectNetwork
    })
  }, [contract, mintAction, purchaseAction, settleAction, signer, account, chainId, isCorrectNetwork])

  // Re-initialize contracts when network changes
  useEffect(() => {
    const initializeContracts = async () => {
      if (!signer || !isCorrectNetwork) {
        console.log('Skipping contract initialization:', {
          hasSigner: !!signer,
          isCorrectNetwork,
          signerAddress: signer?.address
        })
        return
      }

      try {
        console.log('Initializing contracts after network change:', {
          CONTRACT_ADDRESS,
          MINT_ACTION_ADDRESS,
          PURCHASE_ACTION_ADDRESS,
          SETTLE_ACTION_ADDRESS,
          signerAddress: signer.address
        })

        if (CONTRACT_ADDRESS) {
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, InvoiceNFTABI.abi, signer)
          console.log('InvoiceNFT contract initialized:', {
            address: contractInstance.target || contractInstance.address,
            hasInterface: await contractInstance.supportsInterface('0x80ac58cd') // ERC721 interface ID
          })
          setContract(contractInstance)
        } else {
          console.error('CONTRACT_ADDRESS is not set')
        }

        if (MINT_ACTION_ADDRESS) {
          const mintActionInstance = new ethers.Contract(MINT_ACTION_ADDRESS, MintInvoiceActionABI.abi, signer)
          console.log('MintAction contract initialized:', mintActionInstance.target || mintActionInstance.address)
          setMintAction(mintActionInstance)
        } else {
          console.error('MINT_ACTION_ADDRESS is not set')
        }

        if (PURCHASE_ACTION_ADDRESS) {
          const purchaseActionInstance = new ethers.Contract(PURCHASE_ACTION_ADDRESS, PurchaseInvoiceActionABI.abi, signer)
          console.log('PurchaseAction contract initialized:', purchaseActionInstance.target || purchaseActionInstance.address)
          setPurchaseAction(purchaseActionInstance)
        } else {
          console.error('PURCHASE_ACTION_ADDRESS is not set')
        }

        if (SETTLE_ACTION_ADDRESS) {
          const settleActionInstance = new ethers.Contract(SETTLE_ACTION_ADDRESS, SettleInvoiceActionABI.abi, signer)
          console.log('SettleAction contract initialized:', settleActionInstance.target || settleActionInstance.address)
          setSettleAction(settleActionInstance)
        } else {
          console.error('SETTLE_ACTION_ADDRESS is not set')
        }
      } catch (error) {
        console.error('Error initializing contracts:', error)
      }
    }

    initializeContracts()
  }, [signer, isCorrectNetwork])

  // Event listeners
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(accounts[0])
        }
      })

      // Handle chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload()
      })

      // Handle disconnect
      window.ethereum.on('disconnect', () => {
        disconnectWallet()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners()
      }
    }
  }, [disconnectWallet])

  // Context value
  const value = {
    provider,
    signer,
    account,
    chainId,
    isCorrectNetwork,
    isConnecting,
    contract,
    mintAction,
    purchaseAction,
    settleAction,
    transactionHistory,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    tokenizeInvoice,

    buyInvoice,
    repayInvoice,
    markAsDefaulted,
    getInvoice,
    getInvoicesByStatus,
    getInvoicesByOwner,
    getInvoicesByClient,
    getInvoicesBySME,
    getTransactionExplorerUrl
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

// Custom hook for using Web3 context
export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

export default Web3Context



const tokenizeInvoice = async (clientAddress, faceValue, salePrice, dueDate, invoiceURI) => {  try {
    console.log("Tokenizing invoice with params:", { clientAddress, faceValue, salePrice, dueDate, invoiceURI });
    
    // Parse values
    const parsedFaceValue = ethers.parseEther(faceValue.toString());
    const parsedSalePrice = ethers.parseEther(salePrice.toString());
    const parsedDueDate = Math.floor(new Date(dueDate).getTime() / 1000);
    
    console.log("Parsed values:", { parsedFaceValue, parsedSalePrice, parsedDueDate });

    // Check contract initialization
    if (!mintAction || !signer || !contract || !purchaseAction) {
      console.error("Contracts not initialized:", {
        mintAction: mintAction?.target || mintAction?.address,
        signer: signer?.address,
        contract: contract?.target || contract?.address,
        purchaseAction: purchaseAction?.target || purchaseAction?.address
      });
      throw new Error("Contracts not initialized");
    }

    // Check if contract is owned by MintInvoiceAction
    const owner = await contract.owner();
    const mintActionAddress = mintAction.target || mintAction.address;
    console.log("Contract ownership:", { owner, mintActionAddress });

    if (owner.toLowerCase() !== mintActionAddress.toLowerCase()) {
      console.log("Current owner is not MintInvoiceAction, transferring ownership...");
      
      // Check if we are the current owner
      const signerAddress = await signer.getAddress();
      console.log("Checking ownership:", { currentOwner: owner, signer: signerAddress });
      
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error("Current owner is not the signer. Please deploy new contracts or use the correct account.");
      }

      // Transfer ownership to MintInvoiceAction
      console.log("Transferring ownership to MintInvoiceAction...");
      const transferTx = await contract.transferOwnership(mintActionAddress);
      const transferReceipt = await transferTx.wait();
      console.log("Ownership transferred:", transferReceipt);

      // Verify ownership transfer
      const newOwner = await contract.owner();
      console.log("New owner:", newOwner);
      
      if (newOwner.toLowerCase() !== mintActionAddress.toLowerCase()) {
        throw new Error("Ownership transfer failed");
      }
    }

    // Execute mint action
    console.log("Executing mint action...");
    const tx = await mintAction.execute(
      await signer.getAddress(),
      clientAddress,
      parsedFaceValue,
      parsedSalePrice,
      parsedDueDate,
      invoiceURI
    );

    console.log("Transaction hash:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);
    console.log("Transaction receipt details:", {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to
    });

    // Log all transaction logs for debugging
    console.log("All transaction logs:", receipt.logs);
    
    // Try to find either InvoiceMinted or InvoiceTokenized event
    let tokenId = null;
    
    for (const log of receipt.logs) {
      try {
        console.log("Processing log:", {
          address: log.address,
          topics: log.topics,
          data: log.data
        });

        // Try parsing as InvoiceMinted event
        const mintActionAddress = mintAction.target || mintAction.address;
        if (log.address.toLowerCase() === mintActionAddress.toLowerCase()) {
          const parsedLog = mintAction.interface.parseLog(log);
          console.log("Parsed MintAction log:", parsedLog);
          if (parsedLog?.name === 'InvoiceMinted') {
            tokenId = parsedLog.args.tokenId;
            console.log("Found InvoiceMinted event with tokenId:", tokenId.toString());
            break;
          }
        }
        
        // Try parsing as InvoiceTokenized event
        const contractAddress = contract.target || contract.address;
        if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
          const parsedLog = contract.interface.parseLog(log);
          console.log("Parsed NFT log:", parsedLog);
          if (parsedLog?.name === 'InvoiceTokenized') {
            tokenId = parsedLog.args.tokenId;
            console.log("Found InvoiceTokenized event with tokenId:", tokenId.toString());
            break;
          }
        }
      } catch (parseError) {
        console.log("Failed to parse log:", parseError);
        continue;
      }
    }

    if (!tokenId) {
      throw new Error("No InvoiceMinted or InvoiceTokenized event found in transaction receipt");
    }

    console.log("✅ Invoice tokenized successfully with tokenId:", tokenId.toString());

    return tokenId.toString();
  } catch (error) {
    console.error("Error in tokenizeInvoice:", error);
    throw error;
  }
};