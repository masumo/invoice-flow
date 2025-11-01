const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Historical Events Analysis...\n");

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
  const latestBlock = await provider.getBlockNumber();
  console.log(`Latest block: ${latestBlock}`);
  
  // Start from much earlier - let's check last 10000 blocks
  const startBlock = Math.max(0, latestBlock - 10000);
  console.log(`Analyzing blocks ${startBlock} to ${latestBlock}...\n`);
  
  // 1. Check for InvoiceTokenized events (when invoices were created)
  console.log("🔍 Checking InvoiceTokenized events...");
  try {
    const tokenizedFilter = contract.filters.InvoiceTokenized();
    const tokenizedEvents = await contract.queryFilter(tokenizedFilter, startBlock, latestBlock);
    console.log(`📊 Found ${tokenizedEvents.length} InvoiceTokenized events:`);
    
    tokenizedEvents.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber} | Transaction: ${event.transactionHash}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log(`   SME: ${event.args.sme}`);
      console.log(`   Client: ${event.args.client}`);
      console.log(`   Face Value: ${ethers.formatEther(event.args.faceValue)} FLOW`);
      console.log(`   Sale Price: ${ethers.formatEther(event.args.salePrice)} FLOW`);
      console.log(`   Due Date: ${new Date(Number(event.args.dueDate) * 1000).toISOString()}`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying InvoiceTokenized events:", error.message);
  }
  
  // 2. Check for InvoiceSold events
  console.log("🔍 Checking InvoiceSold events...");
  try {
    const soldFilter = contract.filters.InvoiceSold();
    const soldEvents = await contract.queryFilter(soldFilter, startBlock, latestBlock);
    console.log(`📊 Found ${soldEvents.length} InvoiceSold events:`);
    
    soldEvents.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber} | Transaction: ${event.transactionHash}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log(`   SME: ${event.args.sme}`);
      console.log(`   Investor: ${event.args.investor}`);
      console.log(`   Sale Price: ${ethers.formatEther(event.args.salePrice)} FLOW`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying InvoiceSold events:", error.message);
  }
  
  // 3. Check for InvoiceRepaid events
  console.log("🔍 Checking InvoiceRepaid events...");
  try {
    const repaidFilter = contract.filters.InvoiceRepaid();
    const repaidEvents = await contract.queryFilter(repaidFilter, startBlock, latestBlock);
    console.log(`📊 Found ${repaidEvents.length} InvoiceRepaid events:`);
    
    repaidEvents.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber} | Transaction: ${event.transactionHash}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log(`   Investor: ${event.args.investor}`);
      console.log(`   Client: ${event.args.client}`);
      console.log(`   Face Value: ${ethers.formatEther(event.args.faceValue)} FLOW`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying InvoiceRepaid events:", error.message);
  }
  
  // 4. Check for Transfer events (NFT ownership changes)
  console.log("🔍 Checking Transfer events...");
  try {
    const transferFilter = contract.filters.Transfer();
    const transferEvents = await contract.queryFilter(transferFilter, startBlock, latestBlock);
    console.log(`📊 Found ${transferEvents.length} Transfer events:`);
    
    transferEvents.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber} | Transaction: ${event.transactionHash}`);
      console.log(`   From: ${event.args.from}`);
      console.log(`   To: ${event.args.to}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying Transfer events:", error.message);
  }
  
  // 5. Check for InvoicePurchased events from PurchaseAction
  console.log("🔍 Checking InvoicePurchased events from PurchaseAction...");
  try {
    const purchasedFilter = purchaseAction.filters.InvoicePurchased();
    const purchasedEvents = await purchaseAction.queryFilter(purchasedFilter, startBlock, latestBlock);
    console.log(`📊 Found ${purchasedEvents.length} InvoicePurchased events:`);
    
    purchasedEvents.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber} | Transaction: ${event.transactionHash}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log(`   Buyer: ${event.args.buyer}`);
      console.log(`   Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying InvoicePurchased events:", error.message);
  }
  
  // 6. Summary of current invoice states
  console.log("🔍 Current Invoice States Summary...");
  try {
    for (let tokenId = 1; tokenId <= 10; tokenId++) {
      try {
        const invoice = await contract.getInvoice(tokenId);
        const statusNames = ['OnMarket', 'Sold', 'Repaid', 'Defaulted'];
        console.log(`Invoice ${tokenId}: ${statusNames[invoice.status]} | Owner: ${invoice.currentOwner || 'undefined'} | Investor: ${invoice.investor}`);
      } catch (error) {
        // Invoice doesn't exist
        break;
      }
    }
  } catch (error) {
    console.log("❌ Error checking invoice states:", error.message);
  }
  
  console.log("\n✅ Historical analysis complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });