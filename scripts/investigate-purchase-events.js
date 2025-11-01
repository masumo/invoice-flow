const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Investigating Purchase Events...\n");

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
  
  // 1. Check recent blocks for any transactions to PurchaseAction
  console.log("🔍 Checking recent transactions to PurchaseAction...");
  const provider = ethers.provider;
  const latestBlock = await provider.getBlockNumber();
  console.log(`Latest block: ${latestBlock}`);
  
  // Check last 100 blocks for transactions
  const startBlock = Math.max(0, latestBlock - 100);
  console.log(`Checking blocks ${startBlock} to ${latestBlock}...\n`);
  
  let purchaseTransactions = [];
  
  for (let blockNumber = startBlock; blockNumber <= latestBlock; blockNumber++) {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.to && tx.to.toLowerCase() === PURCHASE_ACTION_ADDRESS.toLowerCase()) {
            purchaseTransactions.push({
              hash: tx.hash,
              blockNumber: blockNumber,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              data: tx.data
            });
          }
        }
      }
    } catch (error) {
      // Skip blocks that might not exist
      continue;
    }
  }
  
  console.log(`📊 Found ${purchaseTransactions.length} transactions to PurchaseAction:`);
  purchaseTransactions.forEach((tx, index) => {
    console.log(`${index + 1}. Hash: ${tx.hash}`);
    console.log(`   Block: ${tx.blockNumber}`);
    console.log(`   From: ${tx.from}`);
    console.log(`   Value: ${ethers.formatEther(tx.value)} FLOW`);
    console.log(`   Data: ${tx.data.substring(0, 20)}...`);
    console.log("");
  });
  
  // 2. Check for InvoicePurchased events in recent blocks
  console.log("🔍 Checking for InvoicePurchased events...");
  try {
    const filter = purchaseAction.filters.InvoicePurchased();
    const events = await purchaseAction.queryFilter(filter, startBlock, latestBlock);
    console.log(`📊 Found ${events.length} InvoicePurchased events:`);
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber}`);
      console.log(`   Transaction: ${event.transactionHash}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log(`   Buyer: ${event.args.buyer}`);
      console.log(`   Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying InvoicePurchased events:", error.message);
  }
  
  // 3. Check for InvoiceSold events from InvoiceNFT
  console.log("🔍 Checking for InvoiceSold events from InvoiceNFT...");
  try {
    const filter = contract.filters.InvoiceSold();
    const events = await contract.queryFilter(filter, startBlock, latestBlock);
    console.log(`📊 Found ${events.length} InvoiceSold events:`);
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber}`);
      console.log(`   Transaction: ${event.transactionHash}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log(`   Buyer: ${event.args.buyer}`);
      console.log(`   Amount: ${ethers.formatEther(event.args.amount)} FLOW`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying InvoiceSold events:", error.message);
  }
  
  // 4. Check current status of first few invoices
  console.log("🔍 Checking current invoice statuses...");
  try {
    for (let tokenId = 1; tokenId <= 5; tokenId++) {
      try {
        const invoice = await contract.getInvoice(tokenId);
        const statusNames = ['OnMarket', 'Sold', 'Repaid', 'Defaulted'];
        console.log(`Invoice ${tokenId}:`);
        console.log(`  Status: ${statusNames[invoice.status]} (${invoice.status})`);
        console.log(`  SME: ${invoice.sme}`);
        console.log(`  Current Owner: ${invoice.currentOwner}`);
        console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
        console.log("");
      } catch (error) {
        console.log(`Invoice ${tokenId}: Does not exist`);
      }
    }
  } catch (error) {
    console.log("❌ Error checking invoice statuses:", error.message);
  }
  
  // 5. Check if PurchaseAction is authorized
  console.log("🔍 Checking PurchaseAction authorization...");
  try {
    const isAuthorized = await contract.authorizedPurchasers(PURCHASE_ACTION_ADDRESS);
    console.log(`PurchaseAction authorized: ${isAuthorized}`);
    
    if (!isAuthorized) {
      console.log("⚠️  WARNING: PurchaseAction is not authorized as a purchaser!");
      console.log("This could explain why purchases are not working properly.");
    }
  } catch (error) {
    console.log("❌ Error checking authorization:", error.message);
  }
  
  console.log("\n✅ Investigation complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });