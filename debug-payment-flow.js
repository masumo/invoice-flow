const { ethers } = require('hardhat');
require('dotenv').config();

async function debugPaymentFlow() {
  console.log('🔍 Debugging Payment Flow...\n');

  // Setup provider for local hardhat node
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // Get contract addresses from local hardhat deployment
  const contractAddresses = {
    InvoiceNFT: '0xE3011A37A904aB90C8881a99BD1F6E21401f1522',
    SettleInvoiceAction: '0x525C7063E7C20997BaaE9bDa922159152D0e8417',
    PurchaseInvoiceAction: '0x457cCf29090fe5A24c19c1bc95F492168C0EaFdb',
    MintInvoiceAction: '0x1f10F3Ba7ACB61b2F50B9d6DdCf91a6f787C0E82'
  };

  console.log('📋 Contract Addresses:');
  Object.entries(contractAddresses).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log();

  try {
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
    console.log('📄 Invoice Details:');
    console.log(`  SME: ${invoice.sme}`);
    console.log(`  Client: ${invoice.client}`);
    console.log(`  Face Value: ${ethers.formatEther(invoice.faceValue)} FLOW`);
    console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
    console.log(`  Status: ${invoice.status} (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)`);
    
    // Get current owner (should be investor)
    const currentOwner = await invoiceNFT.ownerOf(latestTokenId);
    console.log(`  Current Owner (Investor): ${currentOwner}`);
    console.log();

    // Check balances
    console.log('💰 Current Balances:');
    
    // SME balance
    const smeBalance = await ethers.provider.getBalance(invoice.sme);
    console.log(`  SME (${invoice.sme}): ${ethers.formatEther(smeBalance)} FLOW`);
    
    // Client balance
    const clientBalance = await ethers.provider.getBalance(invoice.client);
    console.log(`  Client (${invoice.client}): ${ethers.formatEther(clientBalance)} FLOW`);
    
    // Investor balance
    const investorBalance = await ethers.provider.getBalance(currentOwner);
    console.log(`  Investor (${currentOwner}): ${ethers.formatEther(investorBalance)} FLOW`);
    
    // SettleInvoiceAction contract balance
    const settleActionBalance = await ethers.provider.getBalance(contractAddresses.SettleInvoiceAction);
    console.log(`  SettleInvoiceAction Contract: ${ethers.formatEther(settleActionBalance)} FLOW`);
    console.log();

    // Check if there are any events from recent transactions
    console.log('📝 Recent Settlement Events:');
    try {
      const filter = settleAction.filters.InvoiceSettled();
      const events = await settleAction.queryFilter(filter, -100); // Last 100 blocks
      
      if (events.length > 0) {
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
      } else {
        console.log('  No settlement events found');
      }
    } catch (error) {
      console.log('  Error fetching events:', error.message);
    }

    // Summary
    console.log('📋 Summary:');
    if (invoice.status == 2) {
      console.log('✅ Invoice status is "Repaid" - payment was processed');
      if (settleActionBalance > 0) {
        console.log('⚠️  WARNING: SettleInvoiceAction contract still has balance!');
        console.log(`   This suggests the transfer to investor may have failed`);
      } else {
        console.log('✅ SettleInvoiceAction contract has 0 balance - funds were transferred');
      }
    } else {
      console.log('❌ Invoice status is not "Repaid" - payment may not have been processed correctly');
    }

  } catch (error) {
    console.error('❌ Error debugging payment flow:', error);
  }
}

debugPaymentFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });