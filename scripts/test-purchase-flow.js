const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Testing purchase flow and fund distribution...");
  
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const purchaseActionAddress = process.env.VITE_PURCHASE_ACTION_ADDRESS;
  
  console.log("InvoiceNFT Address:", contractAddress);
  console.log("PurchaseAction Address:", purchaseActionAddress);
  
  // Get signers
  const [deployer, sme, investor, client] = await ethers.getSigners();
  console.log("\nAccounts:");
  console.log("Deployer:", deployer.address);
  console.log("SME:", sme.address);
  console.log("Investor:", investor.address);
  console.log("Client:", client.address);
  
  // Connect to contracts
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const contract = InvoiceNFT.attach(contractAddress);
  
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  const purchaseAction = PurchaseInvoiceAction.attach(purchaseActionAddress);
  
  try {
    // Check if there are any existing invoices
    console.log("\n=== Checking existing invoices ===");
    
    let tokenId = 1;
    let invoice;
    
    try {
      invoice = await contract.getInvoice(tokenId);
      console.log(`Invoice ${tokenId} found:`, {
        sme: invoice.sme,
        client: invoice.client,
        faceValue: ethers.formatEther(invoice.faceValue),
        salePrice: ethers.formatEther(invoice.salePrice),
        status: invoice.status.toString()
      });
    } catch (error) {
      console.log("No existing invoice found, creating one...");
      
      // Create a test invoice first
      const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
      const mintActionAddress = process.env.VITE_MINT_ACTION_ADDRESS;
      const mintAction = MintInvoiceAction.attach(mintActionAddress);
      
      const faceValue = ethers.parseEther("100"); // 100 FLOW
      const salePrice = ethers.parseEther("90");  // 90 FLOW (10% discount)
      const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      
      console.log("Creating invoice with SME account...");
      const mintTx = await mintAction.connect(sme).execute(
        sme.address,
        client.address,
        faceValue,
        salePrice,
        dueDate,
        "ipfs://test-invoice-uri"
      );
      
      await mintTx.wait();
      console.log("Invoice created successfully");
      
      // Get the created invoice
      invoice = await contract.getInvoice(tokenId);
      console.log("Created invoice:", {
        sme: invoice.sme,
        client: invoice.client,
        faceValue: ethers.formatEther(invoice.faceValue),
        salePrice: ethers.formatEther(invoice.salePrice),
        status: invoice.status.toString()
      });
    }
    
    // Check balances before purchase
    console.log("\n=== Balances before purchase ===");
    const smeBalanceBefore = await ethers.provider.getBalance(invoice.sme);
    const investorBalanceBefore = await ethers.provider.getBalance(investor.address);
    const platformBalanceBefore = await ethers.provider.getBalance(deployer.address); // Assuming deployer is platform
    
    console.log("SME balance:", ethers.formatEther(smeBalanceBefore), "FLOW");
    console.log("Investor balance:", ethers.formatEther(investorBalanceBefore), "FLOW");
    console.log("Platform balance:", ethers.formatEther(platformBalanceBefore), "FLOW");
    
    // Perform purchase
    console.log("\n=== Performing purchase ===");
    console.log("Investor purchasing invoice...");
    
    const purchaseTx = await purchaseAction.connect(investor).execute(tokenId, {
      value: invoice.salePrice
    });
    
    const receipt = await purchaseTx.wait();
    console.log("Purchase transaction hash:", purchaseTx.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check balances after purchase
    console.log("\n=== Balances after purchase ===");
    const smeBalanceAfter = await ethers.provider.getBalance(invoice.sme);
    const investorBalanceAfter = await ethers.provider.getBalance(investor.address);
    const platformBalanceAfter = await ethers.provider.getBalance(deployer.address);
    
    console.log("SME balance:", ethers.formatEther(smeBalanceAfter), "FLOW");
    console.log("Investor balance:", ethers.formatEther(investorBalanceAfter), "FLOW");
    console.log("Platform balance:", ethers.formatEther(platformBalanceAfter), "FLOW");
    
    // Calculate differences
    console.log("\n=== Balance changes ===");
    const smeChange = smeBalanceAfter - smeBalanceBefore;
    const investorChange = investorBalanceAfter - investorBalanceBefore;
    const platformChange = platformBalanceAfter - platformBalanceBefore;
    
    console.log("SME change:", ethers.formatEther(smeChange), "FLOW");
    console.log("Investor change:", ethers.formatEther(investorChange), "FLOW");
    console.log("Platform change:", ethers.formatEther(platformChange), "FLOW");
    
    // Check transaction logs
    console.log("\n=== Transaction logs ===");
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        console.log("Event:", parsed.name);
        console.log("Args:", parsed.args);
      } catch (error) {
        // Try parsing with purchase action interface
        try {
          const parsed = purchaseAction.interface.parseLog(log);
          console.log("Event:", parsed.name);
          console.log("Args:", parsed.args);
        } catch (error2) {
          console.log("Unknown log:", log.topics[0]);
        }
      }
    }
    
    // Check invoice status after purchase
    const updatedInvoice = await contract.getInvoice(tokenId);
    console.log("\n=== Invoice after purchase ===");
    console.log("Status:", updatedInvoice.status.toString());
    console.log("Current owner:", updatedInvoice.currentOwner);
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });