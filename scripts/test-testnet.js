const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting testnet test...");

  // Get deployer account (SME)
  const [sme] = await ethers.getSigners();
  
  // Create investor and client wallets from private keys
  const investor = new ethers.Wallet("e6ee8948333ee037b6681cc08d4ef496d41b4c632c1c981f9c611336c724c3d9", ethers.provider);
  const client = new ethers.Wallet("126a4a423909d4c66e8e68de35c08b8eb1a3ed3e416e532128a83d0e11f522ac", ethers.provider);

  console.log("Test accounts:");
  console.log("SME:", sme.address);
  console.log("Investor:", investor.address);
  console.log("Client:", client.address);

  // Get deployed contracts
  console.log("\nConnecting to deployed contracts...");
  
  const invoiceNFT = await ethers.getContractAt(
    "InvoiceNFT",
    "0xd5b23E573cfB5A55a30824c83b5AA6E0801587b8"
  );
  console.log("Connected to InvoiceNFT");

  const mintAction = await ethers.getContractAt(
    "MintInvoiceAction",
    "0x0753Bb3da502fA6F8C948B31DE97d7558e94E9a4"
  );
  console.log("Connected to MintInvoiceAction");

  const purchaseAction = await ethers.getContractAt(
    "PurchaseInvoiceAction",
    "0x6B566d9d3f866d41411DBd22627ade29C833fbED"
  );
  console.log("Connected to PurchaseInvoiceAction");

  // SME creates invoice
  console.log("\nSME creates invoice...");
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

  // Get invoice details
  const invoice = await invoiceNFT.invoices(tokenId);
  console.log("\nInvoice details:");
  console.log("Face value:", ethers.formatEther(invoice.faceValue), "FLOW");
  console.log("Sale price:", ethers.formatEther(invoice.salePrice), "FLOW");
  console.log("Due date:", new Date(Number(invoice.dueDate) * 1000).toLocaleString());
  console.log("Status:", invoice.status);
  console.log("Current owner:", await invoiceNFT.ownerOf(tokenId));

  // Investor buys invoice
  console.log("\nInvestor buys invoice...");
  // Approve purchase action to handle NFT
  const approveTx = await invoiceNFT.connect(sme).approve(purchaseAction.getAddress(), tokenId);
  await approveTx.wait();
  console.log("PurchaseAction approved to handle NFT");

  const purchaseTx = await purchaseAction.connect(investor).execute(tokenId, {
    value: ethers.parseEther("95") // Pay sale price
  });
  await purchaseTx.wait();
  console.log("Invoice purchased by investor");

  // Get final invoice state
  const finalInvoice = await invoiceNFT.invoices(tokenId);
  console.log("\nFinal invoice state:");
  console.log("Status:", finalInvoice.status);
  console.log("Current owner:", await invoiceNFT.ownerOf(tokenId));

  console.log("\nTest completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });