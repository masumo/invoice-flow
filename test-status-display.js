const { ethers } = require('ethers');
require('dotenv').config();

async function testStatusDisplay() {
  console.log('🧪 Testing Invoice Status Display...\n');

  try {
    // Setup provider and contract
    const provider = new ethers.JsonRpcProvider(process.env.VITE_RPC_URL);
    const invoiceNFTABI = require('./src/artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json');
    const invoiceNFT = new ethers.Contract(process.env.VITE_CONTRACT_ADDRESS, invoiceNFTABI.abi, provider);
    
    // Get all invoices
    const totalInvoices = await invoiceNFT.getTotalInvoices();
    console.log(`📊 Total invoices in contract: ${totalInvoices}`);
    
    if (totalInvoices > 0) {
      console.log('\n📋 Invoice Status Summary:');
      console.log('='.repeat(50));
      
      for (let i = 1; i <= totalInvoices; i++) {
        try {
          const invoice = await invoiceNFT.getInvoice(i);
          const statusNumber = Number(invoice.status);
          
          let statusText;
          switch (statusNumber) {
            case 0: statusText = 'On Market'; break;
            case 1: statusText = 'Sold'; break;
            case 2: statusText = 'Repaid'; break;
            case 3: statusText = 'Defaulted'; break;
            default: statusText = 'Unknown'; break;
          }
          
          console.log(`Invoice #${i}:`);
          console.log(`  Status (raw): ${invoice.status}`);
          console.log(`  Status (number): ${statusNumber}`);
          console.log(`  Status (text): ${statusText}`);
          console.log(`  SME: ${invoice.sme.slice(0, 6)}...${invoice.sme.slice(-4)}`);
          console.log(`  Face Value: ${ethers.formatEther(invoice.faceValue)} FLOW`);
          console.log(`  Sale Price: ${ethers.formatEther(invoice.salePrice)} FLOW`);
          console.log('');
        } catch (error) {
          console.log(`❌ Error fetching invoice #${i}: ${error.message}`);
        }
      }
      
      // Test status filtering
      console.log('\n🔍 Testing Status Filtering:');
      console.log('='.repeat(50));
      
      const statusNames = ['OnMarket', 'Sold', 'Repaid', 'Defaulted'];
      for (let status = 0; status <= 3; status++) {
        try {
          const invoicesByStatus = await invoiceNFT.getInvoicesByStatus(status);
          console.log(`${statusNames[status]} (${status}): ${invoicesByStatus.length} invoices`);
          if (invoicesByStatus.length > 0) {
            console.log(`  Invoice IDs: [${invoicesByStatus.join(', ')}]`);
          }
        } catch (error) {
          console.log(`❌ Error getting ${statusNames[status]} invoices: ${error.message}`);
        }
      }
    } else {
      console.log('ℹ️  No invoices found in the contract');
    }
    
    console.log('\n✅ Status display test completed!');
    
  } catch (error) {
    console.error('❌ Error during status display test:', error);
  }
}

// Run the test
testStatusDisplay()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });