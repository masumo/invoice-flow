const { ethers } = require('ethers');
require('dotenv').config();

async function debugTokenize() {
  try {
    // Connect to local Hardhat network
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Use the first account from Hardhat
    const signer = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // First Hardhat account private key
      provider
    );
    
    console.log('Signer address:', await signer.getAddress());
    
    // Contract details
    const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
    console.log('Contract address:', contractAddress);
    
    const contractABI = [
      "function tokenizeInvoice(address client, uint256 faceValue, uint256 salePrice, uint256 dueDate, string memory invoiceURI) external returns (uint256)",
      "function getTotalInvoices() external view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    
    // Test parameters - using the same values from the error
    const client = '0xDf6AE824c6121Ab2022199f9b746eC2324Ad7cf2';
    const faceValue = ethers.parseEther('10'); // 10 XDC
    const salePrice = ethers.parseEther('8'); // 8 XDC  
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
    const invoiceURI = `ipfs://invoice-${Date.now()}`;
    
    console.log('Parameters:');
    console.log('- Client:', client);
    console.log('- Face Value:', ethers.formatEther(faceValue), 'XDC');
    console.log('- Sale Price:', ethers.formatEther(salePrice), 'XDC');
    console.log('- Due Date:', new Date(dueDate * 1000).toISOString());
    console.log('- Invoice URI:', invoiceURI);
    
    // Check current total invoices
    const totalBefore = await contract.getTotalInvoices();
    console.log('Total invoices before:', totalBefore.toString());
    
    // Try to estimate gas first
    console.log('\nEstimating gas...');
    try {
      const gasEstimate = await contract.tokenizeInvoice.estimateGas(
        client,
        faceValue,
        salePrice,
        dueDate,
        invoiceURI
      );
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.error('Gas estimation failed:', gasError.message);
      
      // Try to get more details about the error
      if (gasError.data) {
        console.log('Error data:', gasError.data);
      }
      
      // Check if it's a revert with reason
      if (gasError.reason) {
        console.log('Revert reason:', gasError.reason);
      }
      
      return;
    }
    
    // If gas estimation succeeds, try the actual transaction
    console.log('\nSending transaction...');
    const tx = await contract.tokenizeInvoice(
      client,
      faceValue,
      salePrice,
      dueDate,
      invoiceURI
    );
    
    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    const totalAfter = await contract.getTotalInvoices();
    console.log('Total invoices after:', totalAfter.toString());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTokenize();