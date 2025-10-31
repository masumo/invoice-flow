const { ethers } = require('ethers');
require('dotenv').config();

async function simplePaymentDebug() {
  console.log('🔍 Simple Payment Debug...\n');

  try {
    // Try local hardhat first, then testnet
    let provider;
    let networkName;
    
    try {
      console.log('🔄 Trying local Hardhat network...');
      provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const network = await provider.getNetwork();
      networkName = `Local Hardhat (Chain ID: ${network.chainId})`;
      console.log(`✅ Connected to ${networkName}\n`);
    } catch (error) {
      console.log('❌ Local Hardhat not available, trying testnet...');
      
      // Try multiple testnet endpoints
      const testnetUrls = [
        'https://testnet.evm.nodes.onflow.org',
        'https://evm-testnet.flowscan.io',
        'https://flow-testnet.g.alchemy.com/v2/demo'
      ];
      
      for (const url of testnetUrls) {
        try {
          console.log(`🔄 Trying ${url}...`);
          provider = new ethers.JsonRpcProvider(url, undefined, { timeout: 10000 });
          const network = await provider.getNetwork();
          networkName = `Flow Testnet (Chain ID: ${network.chainId})`;
          console.log(`✅ Connected to ${networkName}\n`);
          break;
        } catch (err) {
          console.log(`❌ Failed: ${err.message}`);
          continue;
        }
      }
      
      if (!provider) {
        throw new Error('Could not connect to any network');
      }
    }

    // Contract addresses - use env or local addresses
    let contractAddresses;
    
    if (networkName.includes('Local')) {
      // Use local deployment addresses from previous test
      contractAddresses = {
        InvoiceNFT: '0xE3011A37A904aB90C8881a99BD1F6E21401f1522',
        SettleInvoiceAction: '0x525C7063E7C20997BaaE9bDa922159152D0e8417',
        PurchaseInvoiceAction: '0x457cCf29090fe5A24c19c1bc95F492168C0EaFdb'
      };
    } else {
      // Use testnet addresses from env
      contractAddresses = {
        InvoiceNFT: process.env.VITE_CONTRACT_ADDRESS,
        SettleInvoiceAction: process.env.VITE_SETTLE_ACTION_ADDRESS,
        PurchaseInvoiceAction: process.env.VITE_PURCHASE_ACTION_ADDRESS
      };
    }

    console.log('📋 Using Contract Addresses:');
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

    // Get total invoices and check the latest one
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log(`📊 Total invoices: ${totalInvoices}`);
    
    if (totalInvoices == 0) {
      console.log('❌ No invoices found. Please create an invoice first.');
      return;
    }

    // Check the latest invoice
    const latestInvoiceId = totalInvoices;
    console.log(`🔍 Checking latest invoice ID: ${latestInvoiceId}\n`);

    const invoice = await invoiceNFT.getInvoice(latestInvoiceId);
    console.log('📄 Latest Invoice Details:');
    console.log(`  ID: ${latestInvoiceId}`);
    console.log(`  SME: ${invoice.sme}`);
    console.log(`  Client: ${invoice.client}`);
    console.log(`  Investor: ${invoice.investor}`);
    console.log(`  Face Value: ${ethers.formatEther(invoice.faceValue)} FLOW`);
    console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
    
    const statusNames = ['OnMarket', 'Sold', 'Repaid', 'Defaulted'];
    console.log(`  Status: ${invoice.status} (${statusNames[invoice.status] || 'Unknown'})`);
    console.log(`  Due Date: ${new Date(Number(invoice.dueDate) * 1000).toLocaleString()}`);
    console.log();

    // Check NFT ownership
    const owner = await invoiceNFT.ownerOf(latestInvoiceId);
    console.log(`👤 Current NFT Owner: ${owner}`);
    
    if (owner === invoice.investor) {
      console.log('✅ Investor owns the NFT');
    } else if (owner === invoice.sme) {
      console.log('⚠️  SME still owns the NFT (not purchased yet)');
    } else {
      console.log('❓ Unknown owner');
    }
    console.log();

    // Get balances
    console.log('💰 Current Balances:');
    const smeBalance = await provider.getBalance(invoice.sme);
    const clientBalance = await provider.getBalance(invoice.client);
    
    console.log(`  SME: ${ethers.formatEther(smeBalance)} FLOW`);
    console.log(`  Client: ${ethers.formatEther(clientBalance)} FLOW`);
    
    if (invoice.investor !== ethers.ZeroAddress) {
      const investorBalance = await provider.getBalance(invoice.investor);
      console.log(`  Investor: ${ethers.formatEther(investorBalance)} FLOW`);
    } else {
      console.log(`  Investor: Not set (invoice not purchased)`);
    }
    
    const settleActionBalance = await provider.getBalance(contractAddresses.SettleInvoiceAction);
    console.log(`  SettleAction Contract: ${ethers.formatEther(settleActionBalance)} FLOW`);
    console.log();

    // Analysis
    console.log('🔍 Analysis:');
    if (invoice.status == 0) {
      console.log('❌ Invoice is still "OnMarket" - not purchased by investor yet');
      console.log('💡 Investor needs to buy the invoice first');
    } else if (invoice.status == 1) {
      console.log('⚠️  Invoice is "Sold" but not "Repaid" - client hasn\'t paid yet');
      console.log('💡 Client needs to pay the invoice');
    } else if (invoice.status == 2) {
      console.log('✅ Invoice is "Repaid" - payment was processed');
      if (settleActionBalance > 0) {
        console.log('⚠️  SettleAction contract still has balance - funds may be stuck');
      } else {
        console.log('✅ SettleAction contract balance is 0 - funds were transferred');
      }
    } else if (invoice.status == 3) {
      console.log('❌ Invoice is "Defaulted"');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simplePaymentDebug()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });