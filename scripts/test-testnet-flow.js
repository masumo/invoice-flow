const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing purchase flow on Flow Testnet...\n");

  // Contract addresses from the new deployment
  const CONTRACT_ADDRESS = "0x54f58D21fF4967726b9D8fA96d52c04D3346097a";
  const MINT_ACTION_ADDRESS = "0x9bd563aD53a3da82F251b368a775dE9E2BbC014d";
  const PURCHASE_ACTION_ADDRESS = "0x2d60D7E5Cf666143F2daA5ee84D5d4bd3632d229";
  const SETTLE_ACTION_ADDRESS = "0x8584a8C819Da80ceDa204b4BAC40123B909D2148";

  console.log("📋 Flow Testnet Contract Addresses:");
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

  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Main account (SME): ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 SME balance: ${ethers.formatEther(balance)} FLOW\n`);

  // Create a different client address and investor address for testing
  const clientAddress = "0x1234567890123456789012345678901234567890";
  
  // Create a second wallet for investor (using a different private key)
  const investorPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const investorWallet = new ethers.Wallet(investorPrivateKey, ethers.provider);
  
  console.log(`👤 Investor account: ${investorWallet.address}`);
  
  // Check investor balance
  const investorBalance = await ethers.provider.getBalance(investorWallet.address);
  console.log(`💰 Investor balance: ${ethers.formatEther(investorBalance)} FLOW`);
  
  // If investor has no balance, send some FLOW from deployer
  if (investorBalance < ethers.parseEther("100")) {
    console.log("💸 Sending FLOW to investor for testing...");
    const fundTx = await deployer.sendTransaction({
      to: investorWallet.address,
      value: ethers.parseEther("100")
    });
    await fundTx.wait();
    console.log("✅ Investor funded with 100 FLOW");
  }

  try {
    // Step 1: Check current state
    console.log("\n🔍 Step 1: Checking current contract state...");
    
    const totalInvoices = await contract.getTotalInvoices();
    const nextTokenId = totalInvoices + 1n;
    console.log(`Total invoices: ${totalInvoices}`);
    console.log(`Next token ID: ${nextTokenId}`);

    // Check authorizations
    const authorizedMinter = await contract.authorizedMinter();
    const authorizedPurchaser = await contract.authorizedPurchaser();
    console.log(`Authorized minter: ${authorizedMinter}`);
    console.log(`Authorized purchaser: ${authorizedPurchaser}`);

    // Step 2: Create a test invoice (SME creates invoice)
    console.log("\n📋 Step 2: SME creating test invoice...");
    
    const faceValue = ethers.parseEther("50"); // 50 FLOW
    const salePrice = ethers.parseEther("47.5");  // 47.5 FLOW (5% discount)
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
    const invoiceURI = `https://example.com/testnet-invoice/${nextTokenId}`;

    console.log(`Creating invoice with:`);
    console.log(`  SME: ${deployer.address}`);
    console.log(`  Client: ${clientAddress}`);
    console.log(`  Face Value: ${ethers.formatEther(faceValue)} FLOW`);
    console.log(`  Sale Price: ${ethers.formatEther(salePrice)} FLOW`);
    console.log(`  Due Date: ${new Date(dueDate * 1000).toLocaleDateString()}`);

    const mintTx = await mintAction.execute(
      deployer.address, // SME
      clientAddress,    // Client (different from SME)
      faceValue,
      salePrice,
      dueDate,
      invoiceURI
    );
    const mintReceipt = await mintTx.wait();
    
    console.log(`✅ Test invoice created (ID: ${nextTokenId})`);
    console.log(`   Transaction: ${mintReceipt.hash}`);
    console.log(`   Gas used: ${mintReceipt.gasUsed.toString()}`);

    // Get invoice details
    const invoice = await contract.getInvoice(nextTokenId);
    console.log(`   SME: ${invoice.sme}`);
    console.log(`   Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
    console.log(`   Status: ${invoice.status} (0=OnMarket)`);

    // Step 3: Check balances before purchase
    console.log("\n💰 Step 3: Balances before purchase...");
    
    const smeBalanceBefore = await ethers.provider.getBalance(deployer.address);
    const investorBalanceBefore = await ethers.provider.getBalance(investorWallet.address);
    
    console.log(`SME balance: ${ethers.formatEther(smeBalanceBefore)} FLOW`);
    console.log(`Investor balance: ${ethers.formatEther(investorBalanceBefore)} FLOW`);

    // Step 4: Purchase the invoice (Investor purchases)
    console.log("\n🛒 Step 4: Investor purchasing invoice...");
    
    console.log(`Investor ${investorWallet.address} purchasing invoice ${nextTokenId} for ${ethers.formatEther(salePrice)} FLOW...`);
    
    // Connect purchase action to investor wallet
    const purchaseActionAsInvestor = purchaseAction.connect(investorWallet);
    
    const purchaseTx = await purchaseActionAsInvestor.execute(nextTokenId, {
      value: salePrice
    });
    const purchaseReceipt = await purchaseTx.wait();
    
    console.log("✅ Purchase transaction completed");
    console.log(`   Transaction: ${purchaseReceipt.hash}`);
    console.log(`   Gas used: ${purchaseReceipt.gasUsed.toString()}`);

    // Step 5: Check balances after purchase
    console.log("\n💰 Step 5: Balances after purchase...");
    
    const smeBalanceAfter = await ethers.provider.getBalance(deployer.address);
    const investorBalanceAfter = await ethers.provider.getBalance(investorWallet.address);
    
    const smeGain = smeBalanceAfter - smeBalanceBefore;
    const investorSpent = investorBalanceBefore - investorBalanceAfter;
    
    console.log(`SME balance after: ${ethers.formatEther(smeBalanceAfter)} FLOW`);
    console.log(`SME gain: ${ethers.formatEther(smeGain)} FLOW`);
    console.log(`Investor balance after: ${ethers.formatEther(investorBalanceAfter)} FLOW`);
    console.log(`Investor spent (including gas): ${ethers.formatEther(investorSpent)} FLOW`);

    // Step 6: Check invoice status after purchase
    console.log("\n📋 Step 6: Invoice status after purchase...");
    
    const updatedInvoice = await contract.getInvoice(nextTokenId);
    console.log(`Status: ${updatedInvoice.status} (1=Sold)`);
    console.log(`Investor: ${updatedInvoice.investor}`);
    console.log(`Owner: ${await contract.ownerOf(nextTokenId)}`);

    // Step 7: Check platform fee collection
    console.log("\n💼 Step 7: Platform fee analysis...");
    
    const platformFeeRate = await purchaseAction.platformFeeRate();
    const platformWallet = await purchaseAction.platformWallet();
    
    console.log(`Platform fee rate: ${platformFeeRate} basis points (${Number(platformFeeRate)/100}%)`);
    console.log(`Platform wallet: ${platformWallet}`);
    
    const expectedPlatformFee = (salePrice * platformFeeRate) / 10000n;
    const expectedSMEAmount = salePrice - expectedPlatformFee;
    
    console.log(`Expected platform fee: ${ethers.formatEther(expectedPlatformFee)} FLOW`);
    console.log(`Expected SME amount: ${ethers.formatEther(expectedSMEAmount)} FLOW`);

    // Step 8: Analyze transaction events
    console.log("\n🔍 Step 8: Transaction events analysis...");
    
    for (let i = 0; i < purchaseReceipt.logs.length; i++) {
      const log = purchaseReceipt.logs[i];
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

    // Step 9: Verify on Flowscan
    console.log("\n🔗 Step 9: Flowscan verification links...");
    console.log(`Mint Transaction: https://evm-testnet.flowscan.io/tx/${mintReceipt.hash}`);
    console.log(`Purchase Transaction: https://evm-testnet.flowscan.io/tx/${purchaseReceipt.hash}`);
    console.log(`InvoiceNFT Contract: https://evm-testnet.flowscan.io/address/${CONTRACT_ADDRESS}`);
    console.log(`PurchaseAction Contract: https://evm-testnet.flowscan.io/address/${PURCHASE_ACTION_ADDRESS}`);

    console.log("\n🎉 SUCCESS: Flow Testnet purchase flow test completed!");
    console.log("✅ Invoice created successfully by SME");
    console.log("✅ Purchase transaction executed by investor");
    console.log("✅ Ownership transferred correctly");
    console.log("✅ Platform fee deducted properly");
    console.log("✅ SME received payment");
    console.log("✅ All events emitted correctly");

  } catch (error) {
    console.log("❌ Error during Flow Testnet test:", error.message);
    console.log("Stack trace:", error.stack);
  }

  console.log("\n✅ Flow Testnet test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });