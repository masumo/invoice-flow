const hre = require("hardhat");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("Starting local test...");

  // Get test accounts
  const [sme, investor, client, platformWallet] = await ethers.getSigners();
  console.log("Test accounts:");
  console.log("SME:", sme.address);
  console.log("Investor:", investor.address);
  console.log("Client:", client.address);
  console.log("Platform Wallet:", platformWallet.address);

  // Deploy contracts
  console.log("\nDeploying contracts...");
  
  // Deploy InvoiceNFT
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy();
  await invoiceNFT.waitForDeployment();
  console.log("InvoiceNFT deployed to:", await invoiceNFT.getAddress());

  // Deploy MintInvoiceAction
  const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
  const mintAction = await MintInvoiceAction.deploy(await invoiceNFT.getAddress());
  await mintAction.waitForDeployment();
  console.log("MintInvoiceAction deployed to:", await mintAction.getAddress());

  // Deploy PurchaseInvoiceAction
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  const purchaseAction = await PurchaseInvoiceAction.deploy(
    await invoiceNFT.getAddress(),
    100, // 1% platform fee
    platformWallet.address
  );
  await purchaseAction.waitForDeployment();
  console.log("PurchaseInvoiceAction deployed to:", await purchaseAction.getAddress());

  // Deploy SettleInvoiceAction
  const SettleInvoiceAction = await ethers.getContractFactory("SettleInvoiceAction");
  const settleAction = await SettleInvoiceAction.deploy(await invoiceNFT.getAddress());
  await settleAction.waitForDeployment();
  console.log("SettleInvoiceAction deployed to:", await settleAction.getAddress());

  // Set MintInvoiceAction as authorized minter
  console.log("\nSetting up permissions...");
  const setMinterTx = await invoiceNFT.setAuthorizedMinter(await mintAction.getAddress());
  await setMinterTx.wait();
  console.log("MintInvoiceAction set as authorized minter");

  // Set SettleInvoiceAction as authorized settler
  const setSettlerTx = await invoiceNFT.setAuthorizedSettler(await settleAction.getAddress());
  await setSettlerTx.wait();
  console.log("SettleInvoiceAction set as authorized settler");

  // Day 1: SME creates invoice (Due: Day 30)
  console.log("\nDay 1: SME creates invoice...");
  const block = await ethers.provider.getBlock('latest');
  const currentTimestamp = block.timestamp;
  const dueDate = currentTimestamp + (30 * 24 * 60 * 60); // 30 days from current block timestamp
  
  const createInvoiceTx = await mintAction.connect(sme).execute(
    sme.address,
    client.address,
    ethers.parseEther("100"), // Face value: 100 FLOW
    ethers.parseEther("95"),  // Sale price: 95 FLOW (5% discount)
    dueDate,
    "ipfs://QmTest" // Test IPFS URI
  );
  const createReceipt = await createInvoiceTx.wait();
  console.log("Invoice created by SME");

  // Get tokenId from event logs
  const mintEvent = createReceipt.logs.find(
    log => log.fragment && log.fragment.name === "InvoiceMinted"
  );
  const tokenId = mintEvent.args[0]; // tokenId is the first argument in InvoiceMinted event
  console.log("Token ID:", tokenId);

  // Day 2: Investor buys invoice
  console.log("\nDay 2: Investor buys invoice...");
  // Approve purchase action to handle NFT
  const approveTx = await invoiceNFT.connect(sme).approve(await purchaseAction.getAddress(), tokenId);
  await approveTx.wait();
  console.log("PurchaseAction approved to handle NFT");

  const purchaseTx = await purchaseAction.connect(investor).execute(tokenId, {
    value: ethers.parseEther("95") // Pay sale price
  });
  await purchaseTx.wait();
  console.log("Invoice purchased by investor");

  // Day 35: Client pays late with 5% penalty
  console.log("\nDay 35: Client pays late with penalty...");
  // Fast forward to day 35 (5 days late)
  await time.increase(35 * 24 * 60 * 60); // 35 days
  console.log("Time fast forwarded to day 35");

  const penalty = ethers.parseEther("5"); // 5% penalty = 5 FLOW
  const totalPayment = ethers.parseEther("105"); // Face value + penalty = 105 FLOW

  const settleTx = await settleAction.connect(client).execute(tokenId, true, {
    value: totalPayment // Pay face value + penalty
  });
  await settleTx.wait();
  console.log("Invoice settled late by client with 5% penalty");

  // Final state check
  const invoice = await invoiceNFT.invoices(tokenId);
  console.log("\nFinal invoice state:");
  console.log("Status:", invoice.status);
  console.log("Current owner:", await invoiceNFT.ownerOf(tokenId));

  // Check balances
  const investorBalance = await ethers.provider.getBalance(investor.address);
  console.log("\nFinal balances:");
  console.log("Investor balance:", ethers.formatEther(investorBalance), "FLOW");
  console.log("Investor total profit: 10 FLOW");
  console.log("- Original profit: 5 FLOW (100 - 95)");
  console.log("- Late penalty: 5 FLOW (5% of 100)");
  
  console.log("\nTest completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });