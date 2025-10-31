const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} FLOW`);
  
  if (balance === 0n) {
    throw new Error("Deployer account has no balance. Please fund the account with FLOW tokens.");
  }
  
  try {
    // Deploy contracts in sequence
    console.log("\n📋 Deploying InvoiceNFT and Actions...");
    
    // 1. Deploy InvoiceNFT contract
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    console.log("⏳ Deploying InvoiceNFT contract...");
    const invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();
    const invoiceNFTAddress = await invoiceNFT.getAddress();
    console.log(`✅ InvoiceNFT deployed to: ${invoiceNFTAddress}`);
    
    // 2. Deploy MintInvoiceAction
    const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
    console.log("⏳ Deploying MintInvoiceAction contract...");
    const mintInvoiceAction = await MintInvoiceAction.deploy(invoiceNFTAddress);
    await mintInvoiceAction.waitForDeployment();
    const mintInvoiceActionAddress = await mintInvoiceAction.getAddress();
    console.log(`✅ MintInvoiceAction deployed to: ${mintInvoiceActionAddress}`);
    
    // 3. Deploy PurchaseInvoiceAction
    const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
    console.log("⏳ Deploying PurchaseInvoiceAction contract...");
    // Platform fee 1% (100 basis points) and platform wallet is deployer
    const purchaseInvoiceAction = await PurchaseInvoiceAction.deploy(
      invoiceNFTAddress,
      100, // 1% platform fee
      deployer.address // Platform wallet
    );
    await purchaseInvoiceAction.waitForDeployment();
    const purchaseInvoiceActionAddress = await purchaseInvoiceAction.getAddress();
    console.log(`✅ PurchaseInvoiceAction deployed to: ${purchaseInvoiceActionAddress}`);
    
    // 4. Deploy SettleInvoiceAction
    const SettleInvoiceAction = await ethers.getContractFactory("SettleInvoiceAction");
    console.log("⏳ Deploying SettleInvoiceAction contract...");
    const settleInvoiceAction = await SettleInvoiceAction.deploy(invoiceNFTAddress);
    await settleInvoiceAction.waitForDeployment();
    const settleInvoiceActionAddress = await settleInvoiceAction.getAddress();
    console.log(`✅ SettleInvoiceAction deployed to: ${settleInvoiceActionAddress}`);
    
    // Save deployment information
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      contracts: {
        InvoiceNFT: invoiceNFTAddress,
        MintInvoiceAction: mintInvoiceActionAddress,
        PurchaseInvoiceAction: purchaseInvoiceActionAddress,
        SettleInvoiceAction: settleInvoiceActionAddress
      },
      deploymentTime: new Date().toISOString(),
    };
    
    // Save to deployment.json
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(
      deploymentPath,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Deployment successful!");
    console.log("=".repeat(50));
    console.log("📄 Deployment information saved to deployment.json");
    console.log("\n📍 Contract Addresses:");
    console.log(`InvoiceNFT: ${invoiceNFTAddress}`);
    console.log(`MintInvoiceAction: ${mintInvoiceActionAddress}`);
    console.log(`PurchaseInvoiceAction: ${purchaseInvoiceActionAddress}`);
    console.log(`SettleInvoiceAction: ${settleInvoiceActionAddress}`);
    console.log(`\n🔗 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });