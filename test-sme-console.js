const { ethers } = require('ethers');

// Flow testnet configuration
const RPC_URL = 'https://evm.testnet.flow.com';
const CONTRACT_ADDRESS = '0x1c8f2cE46f7E1FA213900149f92fCb90522CfEE6';

// Minimal ABI for testing
const INVOICE_ABI = [
  'function getTotalInvoices() external view returns (uint256)',
  'function getInvoice(uint256 tokenId) external view returns (tuple(uint256 id, address sme, address investor, address client, uint256 faceValue, uint256 salePrice, uint256 dueDate, string invoiceURI, uint8 status, uint256 createdAt))',
  'function getInvoicesByClient(address client) external view returns (uint256[])'
];

async function testSMEData() {
  try {
    console.log('🔍 Testing SME data on Flow testnet...');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('RPC URL:', RPC_URL);
    
    // Connect to Flow testnet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_ABI, provider);
    
    // Check total invoices
    const totalInvoices = await contract.getTotalInvoices();
    console.log('📊 Total invoices:', totalInvoices.toString());
    
    if (totalInvoices > 0) {
      // Test first invoice
      console.log('\n🧾 Testing first invoice (ID: 1)...');
      const invoice = await contract.getInvoice(1);
      
      console.log('Invoice data:');
      console.log('- ID:', invoice.id.toString());
      console.log('- SME:', invoice.sme);
      console.log('- Investor:', invoice.investor);
      console.log('- Client:', invoice.client);
      console.log('- Face Value:', ethers.formatEther(invoice.faceValue), 'FLOW');
      console.log('- Sale Price:', ethers.formatEther(invoice.salePrice), 'FLOW');
      console.log('- Status:', invoice.status.toString());
      
      // Check if SME field is populated
      if (invoice.sme && invoice.sme !== '0x0000000000000000000000000000000000000000') {
        console.log('✅ SME field is populated correctly');
        console.log('📝 SME address (formatted):', `${invoice.sme.slice(0, 6)}...${invoice.sme.slice(-4)}`);
      } else {
        console.log('❌ SME field is empty or zero address');
      }
      
      // Test getInvoicesByClient if client exists
      if (invoice.client && invoice.client !== '0x0000000000000000000000000000000000000000') {
        console.log('\n🔍 Testing getInvoicesByClient...');
        const clientInvoices = await contract.getInvoicesByClient(invoice.client);
        console.log('Client invoices count:', clientInvoices.length);
        
        if (clientInvoices.length > 0) {
          console.log('✅ getInvoicesByClient working correctly');
        }
      }
      
    } else {
      console.log('ℹ️  No invoices found in contract');
    }
    
    console.log('\n✅ Console test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing SME data:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testSMEData();