const { ethers } = require("hardhat");

async function main() {
    console.log("Starting test with deployed contracts (no approval required)...");
    
    // Get test accounts
    const [sme, investor, client, platformWallet] = await ethers.getSigners();
    
    console.log("Test accounts:");
    console.log("SME:", sme.address);
    console.log("Investor:", investor.address);
    console.log("Client:", client.address);
    console.log("Platform Wallet:", platformWallet.address);
    console.log();

    // Use deployed contract addresses
    const contractAddresses = {
        InvoiceNFT: "0x367761085BF3C12e5DA2Df99AC6E1a824612b8fb",
        MintInvoiceAction: "0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901",
        PurchaseInvoiceAction: "0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9",
        SettleInvoiceAction: "0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff"
    };

    console.log("Using deployed contracts:");
    console.log("InvoiceNFT:", contractAddresses.InvoiceNFT);
    console.log("MintInvoiceAction:", contractAddresses.MintInvoiceAction);
    console.log("PurchaseInvoiceAction:", contractAddresses.PurchaseInvoiceAction);
    console.log("SettleInvoiceAction:", contractAddresses.SettleInvoiceAction);
    console.log();

    // Get contract instances
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    const MintInvoiceAction = await ethers.getContractFactory("MintInvoiceAction");
    const PurchaseInvoiceAction = await ethers.getContractFactory("PurchaseInvoiceAction");
    const SettleInvoiceAction = await ethers.getContractFactory("SettleInvoiceAction");

    const invoiceNFT = InvoiceNFT.attach(contractAddresses.InvoiceNFT);
    const mintAction = MintInvoiceAction.attach(contractAddresses.MintInvoiceAction);
    const purchaseAction = PurchaseInvoiceAction.attach(contractAddresses.PurchaseInvoiceAction);
    const settleAction = SettleInvoiceAction.attach(contractAddresses.SettleInvoiceAction);

    // Check initial state
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log("Initial total invoices:", totalInvoices.toString());

    // Day 1: SME creates invoice
    console.log("Day 1: SME creates invoice...");
    const faceValue = ethers.parseEther("100"); // 100 FLOW
    const salePrice = ethers.parseEther("95");  // 95 FLOW (5% discount)
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
    const invoiceURI = "https://example.com/invoice/1";

    const mintTx = await mintAction.connect(sme).execute(
        faceValue,
        salePrice,
        dueDate,
        invoiceURI,
        client.address,
        platformWallet.address
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
    console.log();

    // Day 2: Investor buys invoice (NO APPROVAL NEEDED!)
    console.log("Day 2: Investor buys invoice (no approval required)...");
    
    // Record investor balance before purchase
    const investorBalanceBefore = await ethers.provider.getBalance(investor.address);
    console.log("Investor balance before:", ethers.formatEther(investorBalanceBefore), "FLOW");

    // Purchase invoice directly without approval
    const purchaseTx = await purchaseAction.connect(investor).execute(tokenId, {
        value: salePrice
    });
    await purchaseTx.wait();
    console.log("Invoice purchased by investor (no approval step needed!)");

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
    const settleTx = await settleAction.connect(client).execute(tokenId, {
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

    console.log("✅ Test completed successfully! No approval was required for purchase.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });