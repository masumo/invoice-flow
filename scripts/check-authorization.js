const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Authorization Settings...\n");

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
  
  try {
    // Check authorization settings
    console.log("🔐 Authorization Check:");
    
    const authorizedPurchaser = await contract.authorizedPurchaser();
    const authorizedMinter = await contract.authorizedMinter();
    const authorizedSettler = await contract.authorizedSettler();
    const owner = await contract.owner();
    
    console.log(`Contract Owner: ${owner}`);
    console.log(`Authorized Purchaser: ${authorizedPurchaser}`);
    console.log(`Authorized Minter: ${authorizedMinter}`);
    console.log(`Authorized Settler: ${authorizedSettler}`);
    
    console.log(`\n🎯 Is PurchaseAction authorized?`);
    console.log(`Expected: ${PURCHASE_ACTION_ADDRESS}`);
    console.log(`Actual: ${authorizedPurchaser}`);
    console.log(`Match: ${PURCHASE_ACTION_ADDRESS.toLowerCase() === authorizedPurchaser.toLowerCase()}`);
    
    // Check platform settings
    console.log("\n💰 Platform Settings:");
    try {
      const platformFeeRate = await purchaseAction.platformFeeRate();
      const platformWallet = await purchaseAction.platformWallet();
      
      console.log(`Platform Fee Rate: ${platformFeeRate} basis points (${platformFeeRate/100}%)`);
      console.log(`Platform Wallet: ${platformWallet}`);
    } catch (error) {
      console.log(`Error getting platform settings: ${error.message}`);
    }
    
    // Check if there are any invoices to test with
    console.log("\n📋 Available Invoices:");
    try {
      const totalInvoices = await contract.getTotalInvoices();
      console.log(`Total invoices: ${totalInvoices}`);
      
      if (totalInvoices > 0) {
        // Check first few invoices
        for (let i = 1; i <= Math.min(Number(totalInvoices), 5); i++) {
          const invoice = await contract.getInvoice(i);
          console.log(`\nInvoice #${i}:`);
          console.log(`  SME: ${invoice.sme}`);
          console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
          console.log(`  Status: ${invoice.status} (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)`);
          console.log(`  Owner: ${await contract.ownerOf(i)}`);
        }
      }
    } catch (error) {
      console.log(`Error getting invoices: ${error.message}`);
    }
    
  } catch (error) {
    console.log("❌ Error checking authorization:", error.message);
  }
  
  console.log("\n✅ Authorization check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });