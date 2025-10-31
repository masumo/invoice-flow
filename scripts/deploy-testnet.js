const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting testnet deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy InvoiceNFT
  console.log("\nDeploying InvoiceNFT...");
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy();
  await invoiceNFT.waitForDeployment();
  console.log("InvoiceNFT deployed to:", await invoiceNFT.getAddress());

  // Deploy MintInvoiceAction
  console.log("\nDeploying MintInvoiceAction...");
  const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
  const mintAction = await MintInvoiceAction.deploy(await invoiceNFT.getAddress());
  await mintAction.waitForDeployment();
  console.log("MintInvoiceAction deployed to:", await mintAction.getAddress());

  // Deploy PurchaseInvoiceAction
  console.log("\nDeploying PurchaseInvoiceAction...");
  const platformFee = 100; // 1%
  const platformWallet = deployer.address; // Using deployer as platform wallet for now
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  const purchaseAction = await PurchaseInvoiceAction.deploy(
    await invoiceNFT.getAddress(),
    platformFee,
    platformWallet
  );
  await purchaseAction.waitForDeployment();
  console.log("PurchaseInvoiceAction deployed to:", await purchaseAction.getAddress());

  // Deploy SettleInvoiceAction
  console.log("\nDeploying SettleInvoiceAction...");
  const SettleInvoiceAction = await ethers.getContractFactory("SettleInvoiceAction");
  const settleAction = await SettleInvoiceAction.deploy(await invoiceNFT.getAddress());
  await settleAction.waitForDeployment();
  console.log("SettleInvoiceAction deployed to:", await settleAction.getAddress());

  // Set up permissions
  console.log("\nSetting up permissions...");
  
  // Set MintInvoiceAction as authorized minter
  const setMinterTx = await invoiceNFT.setAuthorizedMinter(await mintAction.getAddress());
  await setMinterTx.wait();
  console.log("MintInvoiceAction set as authorized minter");

  // Set PurchaseInvoiceAction as authorized purchaser
  const setPurchaserTx = await invoiceNFT.setAuthorizedPurchaser(await purchaseAction.getAddress());
  await setPurchaserTx.wait();
  console.log("PurchaseInvoiceAction set as authorized purchaser");

  // Set SettleInvoiceAction as authorized settler
  const setSettlerTx = await invoiceNFT.setAuthorizedSettler(await settleAction.getAddress());
  await setSettlerTx.wait();
  console.log("SettleInvoiceAction set as authorized settler");

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    invoiceNFT: await invoiceNFT.getAddress(),
    mintAction: await mintAction.getAddress(),
    purchaseAction: await purchaseAction.getAddress(),
    settleAction: await settleAction.getAddress(),
    platformWallet: platformWallet,
    platformFee: platformFee,
    timestamp: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deployment, null, 2)
  );
  console.log("\nDeployment info saved to:", deploymentPath);

  console.log("\nDeployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("InvoiceNFT:", await invoiceNFT.getAddress());
  console.log("MintInvoiceAction:", await mintAction.getAddress());
  console.log("PurchaseInvoiceAction:", await purchaseAction.getAddress());
  console.log("SettleInvoiceAction:", await settleAction.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });