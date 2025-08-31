const { ethers } = require('hardhat');

async function testInvoice() {
  try {
    const [signer] = await ethers.getSigners();
    console.log('Signer address:', signer.address);
    
    const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
    const abi = [
      'function getTotalInvoices() external view returns (uint256)',
      'function getInvoice(uint256 tokenId) external view returns (tuple(uint256 id, address sme, address investor, address client, uint256 faceValue, uint256 salePrice, uint256 dueDate, string invoiceURI, uint8 status, uint256 createdAt))'
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, signer);
    
    // Test getTotalInvoices
    const totalInvoices = await contract.getTotalInvoices();
    console.log('Total invoices:', totalInvoices.toString());
    
    if (totalInvoices > 0) {
      // Test getInvoice for ID 1
      try {
        const invoice = await contract.getInvoice(1);
        console.log('Invoice 1 data:', {
          id: invoice.id.toString(),
          sme: invoice.sme,
          investor: invoice.investor,
          client: invoice.client,
          faceValue: ethers.formatEther(invoice.faceValue),
          salePrice: ethers.formatEther(invoice.salePrice),
          dueDate: invoice.dueDate.toString(),
          invoiceURI: invoice.invoiceURI,
          status: invoice.status.toString(),
          createdAt: invoice.createdAt.toString()
        });
      } catch (error) {
        console.error('Error getting invoice 1:', error.message);
      }
    } else {
      console.log('No invoices found in contract');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testInvoice();