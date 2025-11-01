const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Verifying PurchaseInvoiceAction contract...");
  
  const purchaseActionAddress = process.env.VITE_PURCHASE_ACTION_ADDRESS;
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  
  console.log("PurchaseAction Address:", purchaseActionAddress);
  console.log("InvoiceNFT Address:", contractAddress);
  
  if (!purchaseActionAddress || !contractAddress) {
    console.error("Missing contract addresses in .env file");
    return;
  }
  
  try {
    // Get the contract factory
    const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
    
    // Connect to the deployed contract
    const purchaseAction = PurchaseInvoiceAction.attach(purchaseActionAddress);
    
    // Check if contract exists by calling a view function
    console.log("Checking if contract is deployed...");
    
    // Try to get the contract code
    const provider = ethers.provider;
    const code = await provider.getCode(purchaseActionAddress);
    
    if (code === "0x") {
      console.error("❌ No contract found at PurchaseAction address!");
      return;
    }
    
    console.log("✅ Contract found at address");
    console.log("Contract code length:", code.length);
    
    // Try to call the contract to see if it's working
    try {
      // This should work if the contract is properly deployed
      const tx = await purchaseAction.populateTransaction.execute(1);
      console.log("✅ Contract interface is accessible");
      console.log("Sample transaction data:", tx.data.substring(0, 20) + "...");
    } catch (error) {
      console.log("⚠️  Contract interface check failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Error verifying contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });