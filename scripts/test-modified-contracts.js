const { ethers } = require("hardhat");

async function main() {
    console.log("Starting test with modified contracts (no approval required)...");
    
    // Get test accounts
    const [sme, investor, client, platformWallet] = await ethers.getSigners();
    
    console.log("Test accounts:");
    console.log("SME:", sme.address);
    console.log("Investor:", investor.address);
    console.log("Client:", client.address);
    console.log("Platform Wallet:", platformWallet.address);
    console.log();

    console.log("Deploying modified contracts...");
    
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

    // Deploy PurchaseInvoiceAction (modified - no approval required)
    const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
    const platformFeeRate = 100; // 1% platform fee
    const purchaseAction = await PurchaseInvoiceAction.deploy(
        await invoiceNFT.getAddress(),
        platformFeeRate,
        platformWallet.address
    );
    await purchaseAction.waitForDeployment();
    console.log("PurchaseInvoiceAction deployed to:", await purchaseAction.getAddress());

    // Deploy SettleInvoiceAction
    const SettleInvoiceAction = await ethers.getContractFactory("SettleInvoiceAction");
    const settleAction = await SettleInvoiceAction.deploy(await invoiceNFT.getAddress());
    await settleAction.waitForDeployment();
    console.log("SettleInvoiceAction deployed to:", await settleAction.getAddress());
    console.log();

    console.log("Setting up permissions...");
    // Set MintInvoiceAction as authorized minter
    await invoiceNFT.setAuthorizedMinter(await mintAction.getAddress());
    console.log("MintInvoiceAction set as authorized minter");

    // Set PurchaseInvoiceAction as authorized purchaser
    await invoiceNFT.setAuthorizedPurchaser(await purchaseAction.getAddress());
    console.log("PurchaseInvoiceAction set as authorized purchaser");

    // Set SettleInvoiceAction as authorized settler
    await invoiceNFT.setAuthorizedSettler(await settleAction.getAddress());
    console.log("SettleInvoiceAction set as authorized settler");
    console.log();

    // Check initial state
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log("Initial total invoices:", totalInvoices.toString());

    // Day 1: SME creates invoice
    console.log("Day 1: SME creates invoice...");
    const faceValue = ethers.parseEther("100"); // 100 FLOW
    const salePrice = ethers.parseEther("95");  // 95 FLOW (5% discount)
    const currentBlock = await ethers.provider.getBlock('latest');
    const dueDate = currentBlock.timestamp + (30 * 24 * 60 * 60); // 30 days from now
    const invoiceURI = "https://example.com/invoice/1";

    const mintTx = await mintAction.connect(sme).execute(
        sme.address,
        client.address,
        faceValue,
        salePrice,
        dueDate,
        invoiceURI
    );
    await mintTx.wait();
    console.log("Invoice created by SME");

    const newTotalInvoices = await invoiceNFT.getTotalInvoices();
    const tokenId = newTotalInvoices;
    console.log("Token ID:", tokenId.toString());

    // Check invoice details
    const invoice = await invoiceNFT.getInvoice(tokenId);
    console.log("Invoice face value:", ethers.formatEther(invoice.faceValue), "FLOW");
    console.log("Invoice sale price:", ethers.formatEther(invoice.salePrice), "FLOW");
    console.log("Invoice status:", invoice.status.toString(), "(0=Listed)");
    


    // Day 2: Investor buys invoice (NO APPROVAL NEEDED!)
    console.log("Day 2: Investor buys invoice (no approval required)...");
    console.log("🚀 TESTING: Purchase without approval requirement!");
    
    // Record investor balance before purchase
    const investorBalanceBefore = await ethers.provider.getBalance(investor.address);
    console.log("Investor balance before:", ethers.formatEther(investorBalanceBefore), "FLOW");

    // Purchase invoice directly without approval
    console.log("⚡ Purchasing invoice directly (no approval step)...");
    const purchaseTx = await purchaseAction.connect(investor).execute(tokenId, {
        value: salePrice
    });
    await purchaseTx.wait();
    console.log("✅ Invoice purchased by investor successfully!");
    console.log("🎉 NO APPROVAL WAS REQUIRED!");

    // Check invoice status after purchase
    const invoiceAfterPurchase = await invoiceNFT.getInvoice(tokenId);
    console.log("Invoice status after purchase:", invoiceAfterPurchase.status.toString(), "(1=Sold)");
    
    // Check ownership
    const owner = await invoiceNFT.ownerOf(tokenId);
    console.log("Invoice owner:", owner);
    console.log("Is investor the owner?", owner === investor.address);
    console.log();

    // Day 35: Client pays late with penalty
    console.log("Day 35: Client pays late with penalty...");
    
    // Fast forward time to make it late (35 days)
    await ethers.provider.send("evm_increaseTime", [35 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    console.log("Time fast forwarded to day 35");

    // Calculate penalty (5% of face value)
    const penaltyRate = 500; // 5% in basis points
    const penalty = (faceValue * BigInt(penaltyRate)) / BigInt(10000);
    const totalPayment = faceValue + penalty;

    console.log("Face value:", ethers.formatEther(faceValue), "FLOW");
    console.log("Penalty (5%):", ethers.formatEther(penalty), "FLOW");
    console.log("Total payment:", ethers.formatEther(totalPayment), "FLOW");

    // Client settles invoice with penalty
    const settleTx = await settleAction.connect(client).execute(tokenId, true, {
        value: totalPayment
    });
    await settleTx.wait();
    console.log("Invoice settled late by client with 5% penalty");
    console.log();

    // Final state
    console.log("Final invoice state:");
    const finalInvoice = await invoiceNFT.getInvoice(tokenId);
    console.log("Status:", finalInvoice.status.toString(), "(2=Settled)");
    console.log("Current owner:", await invoiceNFT.ownerOf(tokenId));
    console.log();

    // Final balances
    console.log("Final balances:");
    const investorBalanceAfter = await ethers.provider.getBalance(investor.address);
    console.log("Investor balance:", ethers.formatEther(investorBalanceAfter), "FLOW");
    
    const profit = investorBalanceAfter - investorBalanceBefore + salePrice;
    console.log("Investor total profit:", ethers.formatEther(profit), "FLOW");
    console.log("- Original profit:", ethers.formatEther(faceValue - salePrice), "FLOW", "(", ethers.formatEther(faceValue), "-", ethers.formatEther(salePrice), ")");
    console.log("- Late penalty:", ethers.formatEther(penalty), "FLOW", "(5% of", ethers.formatEther(faceValue), ")");
    console.log();

    console.log("🎉 SUCCESS! Test completed successfully!");
    console.log("✅ Key Achievement: Invoice purchase worked WITHOUT approval requirement!");
    console.log("✅ The modified PurchaseInvoiceAction contract handles transfers internally!");
    console.log("✅ User experience is now seamless - no manual approval step needed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });