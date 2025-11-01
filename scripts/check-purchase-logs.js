const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Checking purchase transaction logs...");
  
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const purchaseActionAddress = process.env.VITE_PURCHASE_ACTION_ADDRESS;
  
  console.log("InvoiceNFT Address:", contractAddress);
  console.log("PurchaseAction Address:", purchaseActionAddress);
  
  // Connect to contracts
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const contract = InvoiceNFT.attach(contractAddress);
  
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  const purchaseAction = PurchaseInvoiceAction.attach(purchaseActionAddress);
  
  try {
    // Get recent InvoiceSold events
    console.log("\n=== Checking recent InvoiceSold events ===");
    
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    // Look for InvoiceSold events in the last 1000 blocks
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    const soldEvents = await contract.queryFilter(
      contract.filters.InvoiceSold(),
      fromBlock,
      currentBlock
    );
    
    console.log(`Found ${soldEvents.length} InvoiceSold events:`);
    
    for (const event of soldEvents) {
      console.log("\n--- InvoiceSold Event ---");
      console.log("Block:", event.blockNumber);
      console.log("Transaction:", event.transactionHash);
      console.log("Token ID:", event.args.tokenId.toString());
      console.log("SME:", event.args.sme);
      console.log("Investor:", event.args.investor);
      console.log("Sale Price:", ethers.formatEther(event.args.salePrice), "FLOW");
      
      // Get transaction details
      const tx = await ethers.provider.getTransaction(event.transactionHash);
      const receipt = await ethers.provider.getTransactionReceipt(event.transactionHash);
      
      console.log("Transaction value:", ethers.formatEther(tx.value), "FLOW");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Check all logs in this transaction
      console.log("All logs in transaction:");
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          console.log(`  - ${parsed.name}:`, parsed.args);
        } catch (error) {
          try {
            const parsed = purchaseAction.interface.parseLog(log);
            console.log(`  - ${parsed.name}:`, parsed.args);
          } catch (error2) {
            console.log(`  - Unknown log:`, log.topics[0]);
          }
        }
      }
    }
    
    // Check if there are any invoices available
    console.log("\n=== Checking available invoices ===");
    
    try {
      for (let tokenId = 1; tokenId <= 5; tokenId++) {
        try {
          const invoice = await contract.getInvoice(tokenId);
          console.log(`Invoice ${tokenId}:`, {
            sme: invoice.sme,
            client: invoice.client,
            faceValue: ethers.formatEther(invoice.faceValue),
            salePrice: ethers.formatEther(invoice.salePrice),
            status: invoice.status.toString(),
            currentOwner: invoice.currentOwner
          });
        } catch (error) {
          console.log(`Invoice ${tokenId}: Not found`);
          break;
        }
      }
    } catch (error) {
      console.log("Error checking invoices:", error.message);
    }
    
    // Check PurchaseInvoiceAction contract code
    console.log("\n=== Checking PurchaseInvoiceAction contract ===");
    const code = await ethers.provider.getCode(purchaseActionAddress);
    console.log("Contract code length:", code.length);
    
    if (code === "0x") {
      console.log("❌ PurchaseInvoiceAction contract not deployed!");
    } else {
      console.log("✅ PurchaseInvoiceAction contract is deployed");
      
      // Try to check if it has the correct interface
      try {
        // This should work if the contract is properly deployed
        const iface = purchaseAction.interface;
        console.log("Contract functions:", iface.fragments.filter(f => f.type === 'function').map(f => f.name));
      } catch (error) {
        console.log("Error checking contract interface:", error.message);
      }
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