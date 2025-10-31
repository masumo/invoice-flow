const { ethers } = require('ethers');
require('dotenv').config();

async function debugFlowTestnet() {
  console.log('🔍 Debugging Flow Testnet Payment Flow...\n');

  try {
    // Setup provider for Flow testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    
    // Test connection
    console.log('🌐 Testing connection to Flow testnet...');
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})\n`);
    
    // Get contract addresses from environment
    const contractAddresses = {
      InvoiceNFT: process.env.VITE_CONTRACT_ADDRESS,
      SettleInvoiceAction: process.env.VITE_SETTLE_ACTION_ADDRESS,
      PurchaseInvoiceAction: process.env.VITE_PURCHASE_ACTION_ADDRESS,
      MintInvoiceAction: process.env.VITE_MINT_ACTION_ADDRESS
    };

    console.log('📋 Contract Addresses:');
    Object.entries(contractAddresses).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });
    console.log();

    // Get contract instances using the provider
    const invoiceNFT = new ethers.Contract(
      contractAddresses.InvoiceNFT,
      require('./artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json').abi,
      provider
    );
    const settleAction = new ethers.Contract(
      contractAddresses.SettleInvoiceAction,
      require('./artifacts/contracts/SettleInvoiceAction.sol/SettleInvoiceAction.json').abi,
      provider
    );

    // Get total invoices to find the latest one
    console.log('📊 Getting total invoices...');
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log(`📊 Total invoices: ${totalInvoices}`);
    
    if (totalInvoices == 0) {
      console.log('❌ No invoices found');
      return;
    }

    // Check the latest invoice (assuming it's the one that was paid)
    const latestTokenId = totalInvoices;
    console.log(`🔍 Checking invoice #${latestTokenId}...\n`);

    // Get invoice details
    const invoice = await invoiceNFT.getInvoice(latestTokenId);
    const currentOwner = await invoiceNFT.ownerOf(latestTokenId);
    
    console.log('📄 Invoice Details:');
    console.log(`  SME: ${invoice.sme}`);
    console.log(`  Client: ${invoice.client}`);
    console.log(`  Face Value: ${ethers.formatEther(invoice.faceValue)} FLOW`);
    console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
    console.log(`  Status: ${invoice.status} (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)`);
    console.log(`  Current Owner (Investor): ${currentOwner}\n`);

    // Get balances
    console.log('💰 Current Balances:');
    const smeBalance = await provider.getBalance(invoice.sme);
    const clientBalance = await provider.getBalance(invoice.client);
    const investorBalance = await provider.getBalance(currentOwner);
    const contractBalance = await provider.getBalance(contractAddresses.SettleInvoiceAction);
    
    console.log(`  SME (${invoice.sme}): ${ethers.formatEther(smeBalance)} FLOW`);
    console.log(`  Client (${invoice.client}): ${ethers.formatEther(clientBalance)} FLOW`);
    console.log(`  Investor (${currentOwner}): ${ethers.formatEther(investorBalance)} FLOW`);
    console.log(`  SettleInvoiceAction Contract: ${ethers.formatEther(contractBalance)} FLOW\n`);

    // Get recent settlement events
    console.log('📝 Getting recent settlement events...');
    try {
      const filter = settleAction.filters.InvoiceSettled();
      const events = await settleAction.queryFilter(filter, -1000); // Last 1000 blocks
      
      console.log(`📝 Recent Settlement Events (${events.length} found):`);
      events.forEach((event, index) => {
        console.log(`  Event ${index + 1}:`);
        console.log(`    Token ID: ${event.args.tokenId}`);
        console.log(`    Settler: ${event.args.settler}`);
        console.log(`    Recipient: ${event.args.recipient}`);
        console.log(`    Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
        console.log(`    Is Repayment: ${event.args.isRepayment}`);
        console.log(`    Block: ${event.blockNumber}`);
        console.log();
      });
    } catch (eventError) {
      console.log(`❌ Error getting events: ${eventError.message}`);
    }

    // Summary
    console.log('📋 Summary:');
    if (invoice.status == 2) {
      console.log('✅ Invoice status is "Repaid" - payment was processed');
    } else if (invoice.status == 1) {
      console.log('⚠️ Invoice status is "Sold" - payment not yet processed');
    } else {
      console.log(`❓ Invoice status is ${invoice.status}`);
    }
    
    if (contractBalance == 0) {
      console.log('✅ SettleInvoiceAction contract has 0 balance - funds were transferred');
    } else {
      console.log(`⚠️ SettleInvoiceAction contract has ${ethers.formatEther(contractBalance)} FLOW - funds may be stuck`);
    }

  } catch (error) {
    console.error('❌ Error debugging Flow testnet:', error.message);
    if (error.code === 'NETWORK_ERROR') {
      console.log('💡 Suggestion: Check your internet connection or try again later');
    }
  }
}

debugFlowTestnet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });