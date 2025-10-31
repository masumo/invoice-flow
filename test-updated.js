const hre = require("hardhat");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("Starting updated local test (without approval requirement)...");

  // Get test accounts
  const [sme, investor, client, platformWallet] = await ethers.getSigners();
  console.log("Test accounts:");
  console.log("SME:", sme.address);
  console.log("Investor:", investor.address);
  console.log("Client:", client.address);
  console.log("Platform Wallet:", platformWallet.address);

  // Use deployed contract addresses
  const contractAddresses = {
    InvoiceNFT: "0x367761085BF3C12e5DA2Df99AC6E1a824612b8fb",
    MintInvoiceAction: "0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901",
    PurchaseInvoiceAction: "0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9",
    SettleInvoiceAction: "0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff"
  };

  console.log("\nUsing deployed contracts:");
  console.log("InvoiceNFT:", contractAddresses.InvoiceNFT);
  console.log("MintInvoiceAction:", contractAddresses.MintInvoiceAction);
  console.log("PurchaseInvoiceAction:", contractAddresses.PurchaseInvoiceAction);
  console.log("SettleInvoiceAction:", contractAddresses.SettleInvoiceAction);

  // Get contract instances
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = InvoiceNFT.attach(contractAddresses.InvoiceNFT);

  const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
  const mintAction = MintInvoiceAction.attach(contractAddresses.MintInvoiceAction);

  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
  const purchaseAction = PurchaseInvoiceAction.attach(contractAddresses.PurchaseInvoiceAction);

  const SettleInvoiceAction = await ethers.getContractFactory("SettleInvoiceAction");
  const settleAction = SettleInvoiceAction.attach(contractAddresses.SettleInvoiceAction);

  // Check current total invoices
  const totalInvoicesBefore = await invoiceNFT.getTotalInvoices();
  console.log("\nTotal invoices before test:", totalInvoicesBefore.toString());

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
    "ipfs://QmTestUpdated" // Test IPFS URI
  );
  const createReceipt = await createInvoiceTx.wait();
  console.log("Invoice created by SME");

  // Get tokenId from event logs
  const mintEvent = createReceipt.logs.find(
    log => log.fragment && log.fragment.name === "InvoiceMinted"
  );
  const tokenId = mintEvent.args[0]; // tokenId is the first argument in InvoiceMinted event
  console.log("Token ID:", tokenId.toString());

  // Check invoice details
  const invoice = await invoiceNFT.getInvoice(tokenId);
  console.log("Invoice details:");
  console.log("- Face Value:", ethers.formatEther(invoice.faceValue), "FLOW");
  console.log("- Sale Price:", ethers.formatEther(invoice.salePrice), "FLOW");
  console.log("- Status:", invoice.status.toString(), "(0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)");
  console.log("- SME:", invoice.sme);
  console.log("- Client:", invoice.client);

  // Day 2: Investor buys invoice (NO APPROVAL NEEDED!)
  console.log("\nDay 2: Investor buys invoice (without approval)...");
  
  // Check investor balance before purchase
  const investorBalanceBefore = await ethers.provider.getBalance(investor.address);
  console.log("Investor balance before purchase:", ethers.formatEther(investorBalanceBefore), "FLOW");

  const purchaseTx = await purchaseAction.connect(investor).execute(tokenId, {
    value: ethers.parseEther("95") // Pay sale price
  });
  await purchaseTx.wait();
  console.log("✅ Invoice purchased by investor WITHOUT approval requirement!");

  // Check updated invoice details
  const invoiceAfterPurchase = await invoiceNFT.getInvoice(tokenId);
  console.log("Invoice after purchase:");
  console.log("- Status:", invoiceAfterPurchase.status.toString(), "(0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)");
  console.log("- Investor:", invoiceAfterPurchase.investor);
  console.log("- Current owner:", await invoiceNFT.ownerOf(tokenId));

  // Check investor balance after purchase
  const investorBalanceAfter = await ethers.provider.getBalance(investor.address);
  console.log("Investor balance after purchase:", ethers.formatEther(investorBalanceAfter), "FLOW");

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
  const finalInvoice = await invoiceNFT.getInvoice(tokenId);
  console.log("\nFinal invoice state:");
  console.log("Status:", finalInvoice.status.toString(), "(0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)");
  console.log("Current owner:", await invoiceNFT.ownerOf(tokenId));

  // Check final balances
  const investorBalanceFinal = await ethers.provider.getBalance(investor.address);
  console.log("\nFinal balances:");
  console.log("Investor balance:", ethers.formatEther(investorBalanceFinal), "FLOW");
  
  // Calculate profit
  const profit = investorBalanceFinal - investorBalanceBefore;
  console.log("Investor net profit:", ethers.formatEther(profit), "FLOW");
  console.log("Expected profit breakdown:");
  console.log("- Original profit: 5 FLOW (100 - 95)");
  console.log("- Late penalty: 5 FLOW (5% of 100)");
  console.log("- Total expected: 10 FLOW");
  
  console.log("\n🎉 Test completed successfully!");
  console.log("✅ Purchase worked WITHOUT approval requirement");
  console.log("✅ Contract handles transfers internally");
  console.log("✅ No manual SME approval needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });