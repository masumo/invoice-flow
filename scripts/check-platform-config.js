const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Checking platform configuration and fund distribution...");
  
  const purchaseActionAddress = process.env.VITE_PURCHASE_ACTION_ADDRESS;
  
  // Connect to PurchaseInvoiceAction contract
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  const purchaseAction = PurchaseInvoiceAction.attach(purchaseActionAddress);
  
  try {
    // Check platform configuration
    console.log("\n=== Platform Configuration ===");
    const platformWallet = await purchaseAction.platformWallet();
    const platformFeeRate = await purchaseAction.platformFeeRate();
    
    console.log("Platform Wallet:", platformWallet);
    console.log("Platform Fee Rate:", platformFeeRate.toString(), "basis points");
    console.log("Platform Fee Percentage:", (Number(platformFeeRate) / 100).toFixed(2) + "%");
    
    // Check recent InvoicePurchased events
    console.log("\n=== Checking InvoicePurchased Events ===");
    
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    // Look for InvoicePurchased events in the last 1000 blocks
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    const purchaseEvents = await purchaseAction.queryFilter(
      purchaseAction.filters.InvoicePurchased(),
      fromBlock,
      currentBlock
    );
    
    console.log(`Found ${purchaseEvents.length} InvoicePurchased events:`);
    
    for (const event of purchaseEvents) {
      console.log("\n--- InvoicePurchased Event ---");
      console.log("Block:", event.blockNumber);
      console.log("Transaction:", event.transactionHash);
      console.log("Token ID:", event.args.tokenId.toString());
      console.log("Buyer:", event.args.buyer);
      console.log("Seller (SME):", event.args.seller);
      console.log("Purchase Amount:", ethers.formatEther(event.args.purchaseAmount), "FLOW");
      console.log("Platform Fee:", ethers.formatEther(event.args.platformFee), "FLOW");
      console.log("SME Received:", ethers.formatEther(event.args.purchaseAmount - event.args.platformFee), "FLOW");
      
      // Get transaction details
      const tx = await ethers.provider.getTransaction(event.transactionHash);
      const receipt = await ethers.provider.getTransactionReceipt(event.transactionHash);
      
      console.log("Transaction value:", ethers.formatEther(tx.value), "FLOW");
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("From:", tx.from);
      console.log("To:", tx.to);
      
      // Check internal transactions (transfers)
      console.log("Internal transfers in this transaction:");
      
      // Look for Transfer events or other relevant logs
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === purchaseActionAddress.toLowerCase()) {
          try {
            const parsed = purchaseAction.interface.parseLog(log);
            console.log(`  - ${parsed.name}:`, parsed.args);
          } catch (error) {
            console.log(`  - Unknown log from PurchaseAction:`, log.topics[0]);
          }
        }
      }
    }
    
    // If no purchase events found, check if there are any transactions to the contract
    if (purchaseEvents.length === 0) {
      console.log("\n=== Checking recent transactions to PurchaseAction ===");
      
      // This is a simple way to check recent transactions
      // In a real scenario, you'd use a block explorer API
      console.log("No InvoicePurchased events found in recent blocks.");
      console.log("This could mean:");
      console.log("1. No purchases have been made recently");
      console.log("2. The frontend is not calling the PurchaseInvoiceAction contract");
      console.log("3. The contract is not emitting events properly");
    }
    
    // Check if the contract has received any ETH
    const contractBalance = await ethers.provider.getBalance(purchaseActionAddress);
    console.log("\n=== Contract Balance ===");
    console.log("PurchaseAction contract balance:", ethers.formatEther(contractBalance), "FLOW");
    
    if (contractBalance > 0) {
      console.log("⚠️  Contract has balance - funds might be stuck!");
    } else {
      console.log("✅ Contract has no balance - funds are being distributed correctly");
    }
    
  } catch (error) {
    console.error("Error during check:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });