const { ethers } = require('hardhat');

async function createTestInvoice() {
  try {
    const [deployer, client] = await ethers.getSigners();
    console.log('Deployer address:', deployer.address);
    console.log('Client address:', client.address);
    
    // Get the contract
    const InvoiceNFT = await ethers.getContractFactory('InvoiceNFT');
    const contract = InvoiceNFT.attach('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');
    
    // Create a test invoice
    const faceValue = ethers.parseEther('10.0'); // 10 XDC
    const salePrice = ethers.parseEther('8.0');  // 8 XDC (20% discount)
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
    const invoiceURI = 'ipfs://test-invoice-uri';
    
    console.log('Creating test invoice...');
    console.log('Face Value:', ethers.formatEther(faceValue), 'XDC');
    console.log('Sale Price:', ethers.formatEther(salePrice), 'XDC');
    console.log('Due Date:', new Date(dueDate * 1000).toLocaleDateString());
    
    const tx = await contract.mint(
      deployer.address, // SME address (to)
      client.address,   // client address
      faceValue,
      salePrice,
      dueDate,
      invoiceURI
    );
    
    console.log('Transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // Get the tokenId from the event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'InvoiceTokenized';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsedEvent = contract.interface.parseLog(event);
      const tokenId = parsedEvent.args.tokenId;
      console.log('Invoice tokenized with ID:', tokenId.toString());
      
      // Verify the invoice was created
      const totalInvoices = await contract.getTotalInvoices();
      console.log('Total invoices in contract:', totalInvoices.toString());
      
      // Get invoice details
      const invoice = await contract.getInvoice(tokenId);
      console.log('Invoice details:', {
        id: invoice.id.toString(),
        sme: invoice.sme,
        client: invoice.client,
        faceValue: ethers.formatEther(invoice.faceValue) + ' XDC',
        salePrice: ethers.formatEther(invoice.salePrice) + ' XDC',
        status: invoice.status.toString() + ' (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)'
      });
    }
    
  } catch (error) {
    console.error('Error creating test invoice:', error);
  }
}

createTestInvoice();