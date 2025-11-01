const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Tracing Fund Flow from Recent Purchase Transactions...\n");

  // Get contract instances
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  
  const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS;
  const PURCHASE_ACTION_ADDRESS = process.env.VITE_PURCHASE_ACTION_ADDRESS;
  
  console.log("📋 Contract Addresses:");
  console.log(`InvoiceNFT: ${CONTRACT_ADDRESS}`);
  console.log(`PurchaseAction: ${PURCHASE_ACTION_ADDRESS}\n`);
  
  const contract = InvoiceNFT.attach(CONTRACT_ADDRESS);
  const purchaseAction = PurchaseInvoiceAction.attach(PURCHASE_ACTION_ADDRESS);
  
  const provider = ethers.provider;
  
  // Get recent blocks to find purchase transactions
  const currentBlock = await provider.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);
  
  // Look for InvoicePurchased events in recent blocks
  console.log("🔍 Looking for recent InvoicePurchased events...\n");
  
  try {
    const filter = contract.filters.InvoicePurchased();
    const events = await contract.queryFilter(filter, currentBlock - 1000, currentBlock);
    
    console.log(`Found ${events.length} InvoicePurchased events:`);
    
    for (let i = 0; i < Math.min(events.length, 5); i++) {
      const event = events[events.length - 1 - i]; // Get most recent first
      console.log(`\n📋 Event ${i + 1} (Block ${event.blockNumber}):`);
      console.log(`  Invoice ID: ${event.args.invoiceId}`);
      console.log(`  Investor: ${event.args.investor}`);
      console.log(`  Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
      console.log(`  Transaction: ${event.transactionHash}`);
      
      // Analyze this transaction
      const tx = await provider.getTransaction(event.transactionHash);
      const receipt = await provider.getTransactionReceipt(event.transactionHash);
      
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to}`);
      console.log(`  Value sent: ${ethers.formatEther(tx.value)} FLOW`);
      console.log(`  Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`  Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      
      // Analyze all logs in this transaction
      console.log(`  📋 Transaction Logs (${receipt.logs.length} total):`);
      
      let transferEvents = [];
      
      for (let j = 0; j < receipt.logs.length; j++) {
        const log = receipt.logs[j];
        
        try {
          // Check for Transfer events (ETH transfers)
          if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            // This is a Transfer event
            const from = "0x" + log.topics[1].slice(26);
            const to = "0x" + log.topics[2].slice(26);
            const amount = ethers.formatEther(log.data);
            transferEvents.push({ from, to, amount });
            console.log(`    Transfer: ${from} → ${to} (${amount} FLOW)`);
          }
          
          // Try to parse with contract interfaces
          if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
            const parsedLog = contract.interface.parseLog(log);
            console.log(`    InvoiceNFT Event: ${parsedLog.name}`);
            if (parsedLog.name === "InvoiceSold") {
              console.log(`      SME: ${parsedLog.args.sme}`);
              console.log(`      Amount: ${ethers.formatEther(parsedLog.args.amount)} FLOW`);
            }
          }
          
          if (log.address.toLowerCase() === PURCHASE_ACTION_ADDRESS.toLowerCase()) {
            const parsedLog = purchaseAction.interface.parseLog(log);
            console.log(`    PurchaseAction Event: ${parsedLog.name}`);
          }
        } catch (error) {
          // Ignore parsing errors for unknown events
        }
      }
      
      // Get invoice details
      const invoiceId = event.args.invoiceId;
      const invoice = await contract.getInvoice(invoiceId);
      console.log(`  📋 Invoice Details:`);
      console.log(`    SME: ${invoice.sme}`);
      console.log(`    Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
      console.log(`    Status: ${invoice.status}`);
      
      // Calculate expected distribution
      const salePrice = invoice.salePrice;
      const platformFeeRate = await purchaseAction.platformFee();
      const platformFeeAmount = (salePrice * platformFeeRate) / 10000n;
      const smeAmount = salePrice - platformFeeAmount;
      
      console.log(`  💰 Expected Distribution:`);
      console.log(`    Platform fee (${platformFeeRate/100}%): ${ethers.formatEther(platformFeeAmount)} FLOW`);
      console.log(`    To SME: ${ethers.formatEther(smeAmount)} FLOW`);
    }
    
  } catch (error) {
    console.log("❌ Error querying events:", error.message);
  }
  
  // Check current balances
  console.log("\n💰 Current Balance Check:");
  
  const investorAddress = "0x92B05D2a6CBaF7ADE0c19e516f38Eb1D81254EE7";
  const smeAddress = "0x24E12d5Db42EefeC360e02aCc6F82C682e3C264d";
  
  const investorBalance = await provider.getBalance(investorAddress);
  const smeBalance = await provider.getBalance(smeAddress);
  const purchaseActionBalance = await provider.getBalance(PURCHASE_ACTION_ADDRESS);
  const invoiceNFTBalance = await provider.getBalance(CONTRACT_ADDRESS);
  
  console.log(`Investor (${investorAddress}): ${ethers.formatEther(investorBalance)} FLOW`);
  console.log(`SME (${smeAddress}): ${ethers.formatEther(smeBalance)} FLOW`);
  console.log(`PurchaseAction Contract: ${ethers.formatEther(purchaseActionBalance)} FLOW`);
  console.log(`InvoiceNFT Contract: ${ethers.formatEther(invoiceNFTBalance)} FLOW`);
  
  // Check platform wallet
  try {
    const platformWallet = await purchaseAction.platformWallet();
    const platformBalance = await provider.getBalance(platformWallet);
    console.log(`Platform Wallet (${platformWallet}): ${ethers.formatEther(platformBalance)} FLOW`);
  } catch (error) {
    console.log(`Error getting platform wallet: ${error.message}`);
  }
  
  console.log("\n✅ Fund flow analysis complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });