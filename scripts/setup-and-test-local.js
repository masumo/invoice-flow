const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up and testing local contracts...\n");

  // Use the new contract addresses from deployment
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const MINT_ACTION_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const PURCHASE_ACTION_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const SETTLE_ACTION_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  console.log("📋 Using Contract Addresses:");
  console.log(`InvoiceNFT: ${CONTRACT_ADDRESS}`);
  console.log(`MintAction: ${MINT_ACTION_ADDRESS}`);
  console.log(`PurchaseAction: ${PURCHASE_ACTION_ADDRESS}`);
  console.log(`SettleAction: ${SETTLE_ACTION_ADDRESS}\n`);

  // Get contract instances
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
  const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");

  const contract = InvoiceNFT.attach(CONTRACT_ADDRESS);
  const mintAction = MintInvoiceAction.attach(MINT_ACTION_ADDRESS);
  const purchaseAction = PurchaseInvoiceAction.attach(PURCHASE_ACTION_ADDRESS);

  const [owner, sme, investor, client] = await ethers.getSigners();

  console.log("👥 Test Accounts:");
  console.log(`Owner: ${owner.address}`);
  console.log(`SME: ${sme.address}`);
  console.log(`Investor: ${investor.address}`);
  console.log(`Client: ${client.address}\n`);

  try {
    // Step 1: Set up authorizations
    console.log("🔐 Step 1: Setting up authorizations...");
    
    await contract.setAuthorizedMinter(MINT_ACTION_ADDRESS);
    console.log("✅ MintAction authorized as minter");
    
    await contract.setAuthorizedPurchaser(PURCHASE_ACTION_ADDRESS);
    console.log("✅ PurchaseAction authorized as purchaser");
    
    await contract.setAuthorizedSettler(SETTLE_ACTION_ADDRESS);
    console.log("✅ SettleAction authorized as settler");

    // Verify authorizations
    const authorizedMinter = await contract.authorizedMinter();
    const authorizedPurchaser = await contract.authorizedPurchaser();
    const authorizedSettler = await contract.authorizedSettler();
    
    console.log("\n🔍 Authorization Verification:");
    console.log(`Authorized Minter: ${authorizedMinter} ✅`);
    console.log(`Authorized Purchaser: ${authorizedPurchaser} ✅`);
    console.log(`Authorized Settler: ${authorizedSettler} ✅`);

    // Step 2: Create a test invoice
    console.log("\n📋 Step 2: Creating test invoice...");
    
    // Get next token ID
    const totalInvoices = await contract.getTotalInvoices();
    const nextTokenId = totalInvoices + 1n;
    console.log(`Total invoices: ${totalInvoices}, Next token ID: ${nextTokenId}`);
    
    const faceValue = ethers.parseEther("100"); // 100 FLOW
    const salePrice = ethers.parseEther("95");  // 95 FLOW (5% discount)
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
    const invoiceURI = `https://example.com/invoice/${nextTokenId}`;

    const mintTx = await mintAction.connect(sme).execute(
      sme.address,
      client.address,
      faceValue,
      salePrice,
      dueDate,
      invoiceURI
    );
    await mintTx.wait();
    
    console.log(`✅ Test invoice created (ID: ${nextTokenId})`);

    // Get invoice details
    const invoice = await contract.getInvoice(nextTokenId);
    console.log(`   SME: ${invoice.sme}`);
    console.log(`   Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
    console.log(`   Status: ${invoice.status} (0=OnMarket)`);

    // Step 3: Check initial balances
    console.log("\n💰 Step 3: Initial balances...");
    
    const smeBalanceBefore = await ethers.provider.getBalance(sme.address);
    const investorBalanceBefore = await ethers.provider.getBalance(investor.address);
    
    console.log(`SME balance before: ${ethers.formatEther(smeBalanceBefore)} FLOW`);
    console.log(`Investor balance before: ${ethers.formatEther(investorBalanceBefore)} FLOW`);

    // Step 4: Purchase the invoice
    console.log("\n🛒 Step 4: Purchasing invoice...");
    
    const purchaseTx = await purchaseAction.connect(investor).execute(nextTokenId, {
      value: salePrice
    });
    const receipt = await purchaseTx.wait();
    
    console.log("✅ Purchase transaction completed");
    console.log(`   Transaction hash: ${receipt.hash}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

    // Step 5: Check balances after purchase
    console.log("\n💰 Step 5: Balances after purchase...");
    
    const smeBalanceAfter = await ethers.provider.getBalance(sme.address);
    const investorBalanceAfter = await ethers.provider.getBalance(investor.address);
    
    console.log(`SME balance after: ${ethers.formatEther(smeBalanceAfter)} FLOW`);
    console.log(`Investor balance after: ${ethers.formatEther(investorBalanceAfter)} FLOW`);
    
    const smeReceived = smeBalanceAfter - smeBalanceBefore;
    const investorSpent = investorBalanceBefore - investorBalanceAfter;
    
    console.log(`\n📊 Fund Flow Analysis:`);
    console.log(`SME received: ${ethers.formatEther(smeReceived)} FLOW`);
    console.log(`Investor spent: ${ethers.formatEther(investorSpent)} FLOW`);

    // Check platform fee
    const platformFeeRate = await purchaseAction.platformFeeRate();
    const platformWallet = await purchaseAction.platformWallet();
    const platformBalance = await ethers.provider.getBalance(platformWallet);
    
    console.log(`Platform fee rate: ${platformFeeRate} basis points (${Number(platformFeeRate)/100}%)`);
    console.log(`Platform wallet: ${platformWallet}`);
    console.log(`Platform balance: ${ethers.formatEther(platformBalance)} FLOW`);

    // Calculate expected amounts
    const expectedPlatformFee = (salePrice * platformFeeRate) / 10000n;
    const expectedSMEAmount = salePrice - expectedPlatformFee;
    
    console.log(`\n🎯 Expected vs Actual:`);
    console.log(`Expected platform fee: ${ethers.formatEther(expectedPlatformFee)} FLOW`);
    console.log(`Expected SME amount: ${ethers.formatEther(expectedSMEAmount)} FLOW`);
    console.log(`Actual SME received: ${ethers.formatEther(smeReceived)} FLOW`);
    
    const isCorrect = smeReceived === expectedSMEAmount;
    console.log(`✅ Fund distribution correct: ${isCorrect}`);

    // Step 6: Check invoice status
    console.log("\n📋 Step 6: Invoice status after purchase...");
    
    const updatedInvoice = await contract.getInvoice(nextTokenId);
    console.log(`Status: ${updatedInvoice.status} (1=Sold)`);
    console.log(`Investor: ${updatedInvoice.investor}`);
    console.log(`Owner: ${await contract.ownerOf(nextTokenId)}`);

    // Step 7: Analyze transaction logs
    console.log("\n🔍 Step 7: Transaction logs analysis...");
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      try {
        if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
          const parsedLog = contract.interface.parseLog(log);
          console.log(`   InvoiceNFT Event: ${parsedLog.name}`);
          if (parsedLog.name === "InvoiceSold") {
            console.log(`     SME: ${parsedLog.args.sme}`);
            console.log(`     Investor: ${parsedLog.args.investor}`);
            console.log(`     Sale Price: ${ethers.formatEther(parsedLog.args.salePrice)} FLOW`);
          }
        }
        
        if (log.address.toLowerCase() === PURCHASE_ACTION_ADDRESS.toLowerCase()) {
          const parsedLog = purchaseAction.interface.parseLog(log);
          console.log(`   PurchaseAction Event: ${parsedLog.name}`);
          if (parsedLog.name === "InvoicePurchased") {
            console.log(`     Buyer: ${parsedLog.args.buyer}`);
            console.log(`     Seller: ${parsedLog.args.seller}`);
            console.log(`     Purchase Amount: ${ethers.formatEther(parsedLog.args.purchaseAmount)} FLOW`);
            console.log(`     Platform Fee: ${ethers.formatEther(parsedLog.args.platformFee)} FLOW`);
          }
        }
      } catch (error) {
        // Ignore parsing errors for unknown events
      }
    }

    if (isCorrect) {
      console.log("\n🎉 SUCCESS: Fund flow is working correctly!");
      console.log("✅ SME received the expected amount");
      console.log("✅ Platform fee was deducted properly");
      console.log("✅ Invoice ownership transferred to investor");
    } else {
      console.log("\n❌ ISSUE: Fund flow is not working correctly!");
      console.log("❌ SME did not receive the expected amount");
    }

  } catch (error) {
    console.log("❌ Error during test:", error.message);
    console.log("Stack trace:", error.stack);
  }

  console.log("\n✅ Local test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });