const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Deep Transaction Analysis...\n");

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
  
  // Check last 1000 blocks for comprehensive analysis
  const startBlock = Math.max(0, latestBlock - 1000);
  console.log(`Analyzing blocks ${startBlock} to ${latestBlock}...\n`);
  
  // 1. Check ALL transactions to both contracts
  console.log("🔍 Checking ALL transactions to contracts...");
  let invoiceNFTTransactions = [];
  let purchaseActionTransactions = [];
  
  for (let blockNumber = startBlock; blockNumber <= latestBlock; blockNumber++) {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.to) {
            if (tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
              invoiceNFTTransactions.push({
                hash: tx.hash,
                blockNumber: blockNumber,
                from: tx.from,
                value: tx.value.toString(),
                data: tx.data
              });
            }
            if (tx.to.toLowerCase() === PURCHASE_ACTION_ADDRESS.toLowerCase()) {
              purchaseActionTransactions.push({
                hash: tx.hash,
                blockNumber: blockNumber,
                from: tx.from,
                value: tx.value.toString(),
                data: tx.data
              });
            }
          }
        }
      }
    } catch (error) {
      // Skip blocks that might not exist
      continue;
    }
    
    // Progress indicator
    if (blockNumber % 100 === 0) {
      console.log(`Processed block ${blockNumber}...`);
    }
  }
  
  console.log(`\n📊 Transaction Summary:`);
  console.log(`InvoiceNFT transactions: ${invoiceNFTTransactions.length}`);
  console.log(`PurchaseAction transactions: ${purchaseActionTransactions.length}`);
  
  // 2. Analyze InvoiceNFT transactions
  console.log(`\n🔍 InvoiceNFT Transactions:`);
  for (let i = 0; i < Math.min(10, invoiceNFTTransactions.length); i++) {
    const tx = invoiceNFTTransactions[i];
    console.log(`${i + 1}. Hash: ${tx.hash}`);
    console.log(`   Block: ${tx.blockNumber}`);
    console.log(`   From: ${tx.from}`);
    console.log(`   Value: ${ethers.formatEther(tx.value)} FLOW`);
    
    // Try to decode the function call
    try {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      
      // Check for events in this transaction
      const logs = receipt.logs;
      console.log(`   Events: ${logs.length}`);
      
      for (const log of logs) {
        try {
          if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
            const parsedLog = contract.interface.parseLog(log);
            console.log(`     - ${parsedLog.name}: ${JSON.stringify(parsedLog.args)}`);
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }
    } catch (error) {
      console.log(`   Error getting receipt: ${error.message}`);
    }
    console.log("");
  }
  
  // 3. Analyze PurchaseAction transactions
  console.log(`\n🔍 PurchaseAction Transactions:`);
  for (let i = 0; i < Math.min(10, purchaseActionTransactions.length); i++) {
    const tx = purchaseActionTransactions[i];
    console.log(`${i + 1}. Hash: ${tx.hash}`);
    console.log(`   Block: ${tx.blockNumber}`);
    console.log(`   From: ${tx.from}`);
    console.log(`   Value: ${ethers.formatEther(tx.value)} FLOW`);
    
    try {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      
      // Check for events in this transaction
      const logs = receipt.logs;
      console.log(`   Events: ${logs.length}`);
      
      for (const log of logs) {
        try {
          if (log.address.toLowerCase() === PURCHASE_ACTION_ADDRESS.toLowerCase()) {
            const parsedLog = purchaseAction.interface.parseLog(log);
            console.log(`     - PurchaseAction.${parsedLog.name}: ${JSON.stringify(parsedLog.args)}`);
          }
          if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
            const parsedLog = contract.interface.parseLog(log);
            console.log(`     - InvoiceNFT.${parsedLog.name}: ${JSON.stringify(parsedLog.args)}`);
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }
    } catch (error) {
      console.log(`   Error getting receipt: ${error.message}`);
    }
    console.log("");
  }
  
  // 4. Check for any Transfer events (NFT transfers)
  console.log(`\n🔍 Checking for NFT Transfer events...`);
  try {
    const transferFilter = contract.filters.Transfer();
    const transferEvents = await contract.queryFilter(transferFilter, startBlock, latestBlock);
    console.log(`Found ${transferEvents.length} Transfer events:`);
    
    transferEvents.forEach((event, index) => {
      console.log(`${index + 1}. Block: ${event.blockNumber}`);
      console.log(`   Transaction: ${event.transactionHash}`);
      console.log(`   From: ${event.args.from}`);
      console.log(`   To: ${event.args.to}`);
      console.log(`   Token ID: ${event.args.tokenId}`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Error querying Transfer events:", error.message);
  }
  
  console.log("\n✅ Deep analysis complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });