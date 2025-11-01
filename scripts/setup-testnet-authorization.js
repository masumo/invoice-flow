const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up authorizations on Flow Testnet...\n");

  // Contract addresses from the deployment
  const CONTRACT_ADDRESS = "0x54f58D21fF4967726b9D8fA96d52c04D3346097a";
  const MINT_ACTION_ADDRESS = "0x9bd563aD53a3da82F251b368a775dE9E2BbC014d";
  const PURCHASE_ACTION_ADDRESS = "0x2d60D7E5Cf666143F2daA5ee84D5d4bd3632d229";
  const SETTLE_ACTION_ADDRESS = "0x8584a8C819Da80ceDa204b4BAC40123B909D2148";

  console.log("📋 Flow Testnet Contract Addresses:");
  console.log(`InvoiceNFT: ${CONTRACT_ADDRESS}`);
  console.log(`MintAction: ${MINT_ACTION_ADDRESS}`);
  console.log(`PurchaseAction: ${PURCHASE_ACTION_ADDRESS}`);
  console.log(`SettleAction: ${SETTLE_ACTION_ADDRESS}\n`);

  // Get contract instance
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const contract = InvoiceNFT.attach(CONTRACT_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Setting up with deployer account: ${deployer.address}`);
  
  // Check current balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} FLOW\n`);

  try {
    // Step 1: Set up authorizations
    console.log("🔐 Setting up authorizations...");
    
    console.log("⏳ Setting MintAction as authorized minter...");
    const mintTx = await contract.setAuthorizedMinter(MINT_ACTION_ADDRESS);
    await mintTx.wait();
    console.log("✅ MintAction authorized as minter");
    
    console.log("⏳ Setting PurchaseAction as authorized purchaser...");
    const purchaseTx = await contract.setAuthorizedPurchaser(PURCHASE_ACTION_ADDRESS);
    await purchaseTx.wait();
    console.log("✅ PurchaseAction authorized as purchaser");
    
    console.log("⏳ Setting SettleAction as authorized settler...");
    const settleTx = await contract.setAuthorizedSettler(SETTLE_ACTION_ADDRESS);
    await settleTx.wait();
    console.log("✅ SettleAction authorized as settler");

    // Step 2: Verify authorizations
    console.log("\n🔍 Verifying authorizations...");
    
    const authorizedMinter = await contract.authorizedMinter();
    const authorizedPurchaser = await contract.authorizedPurchaser();
    const authorizedSettler = await contract.authorizedSettler();
    
    console.log(`Authorized Minter: ${authorizedMinter}`);
    console.log(`Expected Minter: ${MINT_ACTION_ADDRESS}`);
    console.log(`✅ Minter authorization: ${authorizedMinter.toLowerCase() === MINT_ACTION_ADDRESS.toLowerCase() ? 'CORRECT' : 'INCORRECT'}`);
    
    console.log(`\nAuthorized Purchaser: ${authorizedPurchaser}`);
    console.log(`Expected Purchaser: ${PURCHASE_ACTION_ADDRESS}`);
    console.log(`✅ Purchaser authorization: ${authorizedPurchaser.toLowerCase() === PURCHASE_ACTION_ADDRESS.toLowerCase() ? 'CORRECT' : 'INCORRECT'}`);
    
    console.log(`\nAuthorized Settler: ${authorizedSettler}`);
    console.log(`Expected Settler: ${SETTLE_ACTION_ADDRESS}`);
    console.log(`✅ Settler authorization: ${authorizedSettler.toLowerCase() === SETTLE_ACTION_ADDRESS.toLowerCase() ? 'CORRECT' : 'INCORRECT'}`);

    // Step 3: Check platform configuration
    console.log("\n⚙️ Checking platform configuration...");
    
    const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
    const purchaseAction = PurchaseInvoiceAction.attach(PURCHASE_ACTION_ADDRESS);
    
    const platformFeeRate = await purchaseAction.platformFeeRate();
    const platformWallet = await purchaseAction.platformWallet();
    
    console.log(`Platform fee rate: ${platformFeeRate} basis points (${Number(platformFeeRate)/100}%)`);
    console.log(`Platform wallet: ${platformWallet}`);

    // Step 4: Final balance check
    console.log("\n💰 Final balance check...");
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`Final balance: ${ethers.formatEther(finalBalance)} FLOW`);
    console.log(`Gas used for setup: ${ethers.formatEther(gasUsed)} FLOW`);

    console.log("\n🎉 SUCCESS: All authorizations set up correctly on Flow Testnet!");
    console.log("✅ Contracts are ready for use");
    console.log("✅ Frontend can now be updated with these addresses");

  } catch (error) {
    console.log("❌ Error during authorization setup:", error.message);
    console.log("Stack trace:", error.stack);
  }

  console.log("\n✅ Authorization setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });