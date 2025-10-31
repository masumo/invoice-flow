const hre = require("hardhat");

async function main() {
  console.log("Setting authorized minter...");

  // Get the InvoiceNFT contract instance
  const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.attach("0x702DaA9D2dc8B7b057eBA65A418619E0Feecd6BB");

  // Set MintInvoiceAction as authorized minter
  const tx = await invoiceNFT.setAuthorizedMinter("0xaa55e8FBA4583b7dD8FDbc60Dd74D2314626E23E");
  await tx.wait();

  console.log("✅ MintInvoiceAction set as authorized minter");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });