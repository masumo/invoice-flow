const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting InvoiceNFT deployment...");
  
  // Get the network information
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Deploying to network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} XDC`);
  
  if (balance === 0n) {
    throw new Error("❌ Deployer account has no balance. Please fund the account with XDC tokens.");
  }
  
  try {
    // Get the contract factory
    console.log("📋 Getting InvoiceNFT contract factory...");
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    
    // Deploy the contract
    console.log("⏳ Deploying InvoiceNFT contract...");
    const invoiceNFT = await InvoiceNFT.deploy();
    
    // Wait for deployment to be mined
    console.log("⛏️  Waiting for deployment transaction to be mined...");
    await invoiceNFT.waitForDeployment();
    
    const contractAddress = await invoiceNFT.getAddress();
    
    console.log("\n🎉 Deployment successful!");
    console.log("=".repeat(50));
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`⛽ Gas Used: Estimating...`);
    
    // Get deployment transaction details
    const deploymentTx = invoiceNFT.deploymentTransaction();
    if (deploymentTx) {
      console.log(`📝 Transaction Hash: ${deploymentTx.hash}`);
      
      // Wait for transaction receipt to get gas used
      const receipt = await deploymentTx.wait();
      if (receipt) {
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`💸 Gas Price: ${ethers.formatUnits(receipt.gasPrice || 0n, "gwei")} gwei`);
      }
    }
    
    console.log("=".repeat(50));
    
    // Verify contract deployment by calling a view function
    try {
      const name = await invoiceNFT.name();
      const symbol = await invoiceNFT.symbol();
      const owner = await invoiceNFT.owner();
      
      console.log("\n✅ Contract verification:");
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Total Invoices: ${await invoiceNFT.getTotalInvoices()}`);
    } catch (error) {
      console.log("⚠️  Warning: Could not verify contract deployment");
      console.log(`   Error: ${error.message}`);
    }
    
    // Save deployment information to a file
    const deploymentInfo = {
      contractAddress: contractAddress,
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: deploymentTx?.hash || "N/A"
    };
    
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
    
    // Create/update .env file with contract address
    const envPath = path.join(__dirname, "..", ".env");
    let envContent = "";
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    
    // Update or add contract address
    const contractAddressLine = `VITE_CONTRACT_ADDRESS=${contractAddress}`;
    if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/g, contractAddressLine);
    } else {
      envContent += `\n${contractAddressLine}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`📝 Updated .env file with contract address`);
    
    // Display next steps
    console.log("\n🎯 Next Steps:");
    console.log("   1. Update your frontend with the contract address above");
    console.log("   2. Fund some test accounts with XDC tokens for testing");
    console.log("   3. Test the contract functions on the frontend");
    
    if (network.chainId === 51n) {
      console.log(`   4. View on Explorer: https://explorer.apothem.network/address/${contractAddress}`);
    } else if (network.chainId === 50n) {
      console.log(`   4. View on Explorer: https://explorer.xinfin.network/address/${contractAddress}`);
    }
    
    console.log("\n🚀 InvoiceFlow is ready for the XDC VIBES Hackathon!");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Solution: Fund your deployer account with XDC tokens");
      if (network.chainId === 51n) {
        console.error("   Get testnet XDC from: https://faucet.apothem.network/");
      }
    }
    
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Unexpected error:");
    console.error(error);
    process.exit(1);
  });