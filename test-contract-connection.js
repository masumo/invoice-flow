const { ethers } = require('ethers');
require('dotenv').config();

async function testContractConnection() {
  console.log('🔍 Testing Contract Connection...\n');

  try {
    // Setup provider with the new RPC URL
    const rpcUrl = process.env.VITE_RPC_URL;
    console.log(`🌐 Connecting to: ${rpcUrl}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      timeout: 30000, // 30 seconds timeout
      pollingInterval: 4000
    });
    
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})\n`);
    
    // Get contract addresses
    const contractAddresses = {
      InvoiceNFT: process.env.VITE_CONTRACT_ADDRESS,
      MintInvoiceAction: process.env.VITE_MINT_ACTION_ADDRESS,
      PurchaseInvoiceAction: process.env.VITE_PURCHASE_ACTION_ADDRESS,
      SettleInvoiceAction: process.env.VITE_SETTLE_ACTION_ADDRESS
    };

    console.log('📋 Contract Addresses:');
    Object.entries(contractAddresses).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });
    console.log();

    // Test contract initialization
    console.log('🔧 Testing contract initialization...');
    
    const invoiceNFT = new ethers.Contract(
      contractAddresses.InvoiceNFT,
      require('./artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json').abi,
      provider
    );

    // Test basic contract call
    console.log('📊 Testing contract call...');
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log(`✅ Total invoices: ${totalInvoices}`);

    // Test contract interface support (ERC165)
    console.log('🔍 Testing ERC165 interface support...');
    const supportsInterface = await invoiceNFT.supportsInterface('0x80ac58cd'); // ERC721 interface
    console.log(`✅ Supports ERC721: ${supportsInterface}`);

    // Test mint action contract
    console.log('🔧 Testing MintInvoiceAction contract...');
    const mintAction = new ethers.Contract(
      contractAddresses.MintInvoiceAction,
      require('./artifacts/contracts/MintInvoiceAction.sol/MintInvoiceAction.json').abi,
      provider
    );

    // Get the NFT contract address from mint action
    const nftAddress = await mintAction.invoiceNFT();
    console.log(`✅ MintAction NFT contract: ${nftAddress}`);
    console.log(`✅ Matches expected: ${nftAddress.toLowerCase() === contractAddresses.InvoiceNFT.toLowerCase()}`);

    console.log('\n🎉 All contract connections successful!');
    console.log('💡 You can now try tokenizing an invoice again.');

  } catch (error) {
    console.error('❌ Error testing contract connection:', error.message);
    
    if (error.code === 'NETWORK_ERROR') {
      console.log('💡 Network error - check your internet connection');
    } else if (error.code === 'CALL_EXCEPTION') {
      console.log('💡 Contract call failed - contract may not be deployed or ABI mismatch');
    } else {
      console.log('💡 Unexpected error - check contract addresses and network configuration');
    }
  }
}

testContractConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });