const { ethers } = require('ethers');
require('dotenv').config();

async function debugPaymentIssue() {
  console.log('🔍 Debugging Payment Flow Issue...\n');

  try {
    // Setup provider - use alternative RPC URL
    const rpcUrl = 'https://evm-testnet.flowscan.io';
    console.log(`🌐 Connecting to: ${rpcUrl}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      timeout: 30000,
      pollingInterval: 4000
    });
    
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: Chain ID ${network.chainId}\n`);
    
    // Contract addresses
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

    // Initialize contracts
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

    const purchaseAction = new ethers.Contract(
      contractAddresses.PurchaseInvoiceAction,
      require('./artifacts/contracts/PurchaseInvoiceAction.sol/PurchaseInvoiceAction.json').abi,
      provider
    );

    // Get total invoices
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log(`📊 Total invoices: ${totalInvoices}`);
    
    // Get the latest invoice (assuming it's the one that was just processed)
    const latestInvoiceId = totalInvoices;
    console.log(`🔍 Checking latest invoice ID: ${latestInvoiceId}\n`);

    // Get invoice details
    const invoice = await invoiceNFT.getInvoice(latestInvoiceId);
    console.log('📄 Invoice Details:');
    console.log(`  ID: ${latestInvoiceId}`);
    console.log(`  SME: ${invoice.sme}`);
    console.log(`  Client: ${invoice.client}`);
    console.log(`  Investor: ${invoice.investor}`);
    console.log(`  Face Value: ${ethers.formatEther(invoice.faceValue)} FLOW`);
    console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
    console.log(`  Status: ${invoice.status} (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)`);
    console.log(`  Due Date: ${new Date(Number(invoice.dueDate) * 1000).toLocaleString()}`);
    console.log(`  Created At: ${new Date(Number(invoice.createdAt) * 1000).toLocaleString()}\n`);

    // Check who owns the NFT
    const owner = await invoiceNFT.ownerOf(latestInvoiceId);
    console.log(`👤 Current NFT Owner: ${owner}\n`);

    // Get current balances
    console.log('💰 Current Balances:');
    const smeBalance = await provider.getBalance(invoice.sme);
    const clientBalance = await provider.getBalance(invoice.client);
    const investorBalance = await provider.getBalance(invoice.investor);
    const settleActionBalance = await provider.getBalance(contractAddresses.SettleInvoiceAction);

    console.log(`  SME (${invoice.sme}): ${ethers.formatEther(smeBalance)} FLOW`);
    console.log(`  Client (${invoice.client}): ${ethers.formatEther(clientBalance)} FLOW`);
    console.log(`  Investor (${invoice.investor}): ${ethers.formatEther(investorBalance)} FLOW`);
    console.log(`  SettleAction Contract: ${ethers.formatEther(settleActionBalance)} FLOW\n`);

    // Check recent settlement events
    console.log('📋 Checking recent settlement events...');
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000); // Check last 1000 blocks
      
      const settleFilter = settleAction.filters.InvoiceSettled();
      const settleEvents = await settleAction.queryFilter(settleFilter, fromBlock, currentBlock);
      
      console.log(`Found ${settleEvents.length} settlement events in last 1000 blocks:`);
      settleEvents.forEach((event, index) => {
        console.log(`  Event ${index + 1}:`);
        console.log(`    Invoice ID: ${event.args.invoiceId}`);
        console.log(`    Settler: ${event.args.settler}`);
        console.log(`    Recipient: ${event.args.recipient}`);
        console.log(`    Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
        console.log(`    Block: ${event.blockNumber}`);
        console.log(`    Tx Hash: ${event.transactionHash}\n`);
      });

      // Check purchase events
      const purchaseFilter = purchaseAction.filters.InvoicePurchased();
      const purchaseEvents = await purchaseAction.queryFilter(purchaseFilter, fromBlock, currentBlock);
      
      console.log(`Found ${purchaseEvents.length} purchase events in last 1000 blocks:`);
      purchaseEvents.forEach((event, index) => {
        console.log(`  Event ${index + 1}:`);
        console.log(`    Invoice ID: ${event.args.invoiceId}`);
        console.log(`    Buyer: ${event.args.buyer}`);
        console.log(`    Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
        console.log(`    Block: ${event.blockNumber}`);
        console.log(`    Tx Hash: ${event.transactionHash}\n`);
      });

    } catch (error) {
      console.log(`❌ Error fetching events: ${error.message}\n`);
    }

    // Analyze the issue
    console.log('🔍 Analysis:');
    if (invoice.status == 2) { // Repaid
      console.log('✅ Invoice status is "Repaid" - payment was processed');
      if (owner === invoice.investor) {
        console.log('✅ Investor still owns the NFT');
        console.log('💡 This is expected - investor keeps the NFT as proof of investment');
      } else {
        console.log('⚠️  Investor no longer owns the NFT');
      }
      
      if (settleActionBalance > 0) {
        console.log('⚠️  SettleAction contract still has balance - funds may not have been transferred');
      } else {
        console.log('✅ SettleAction contract balance is 0 - funds were transferred out');
      }
    } else if (invoice.status == 1) { // Sold
      console.log('⚠️  Invoice status is still "Sold" - payment may not have been processed yet');
    } else if (invoice.status == 0) { // OnMarket
      console.log('⚠️  Invoice status is still "OnMarket" - it may not have been purchased yet');
    }

    console.log('\n💡 Recommendations:');
    console.log('1. Check if the payment transaction was actually successful');
    console.log('2. Verify that the correct amount was sent to the SettleAction contract');
    console.log('3. Check if there were any failed transactions or reverted calls');
    console.log('4. Ensure MetaMask is connected to the correct network');

  } catch (error) {
    console.error('❌ Error debugging payment issue:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugPaymentIssue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });