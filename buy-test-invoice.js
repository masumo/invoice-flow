const { ethers } = require('hardhat');

async function buyTestInvoice() {
  try {
    const [deployer, client, investor] = await ethers.getSigners();
    console.log('Investor address:', investor.address);
    
    // Get the contract
    const InvoiceNFT = await ethers.getContractFactory('InvoiceNFT');
    const contract = InvoiceNFT.attach('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');
    
    // Get invoice details first
    const invoice = await contract.getInvoice(1);
    console.log('Invoice before purchase:', {
      id: invoice.id.toString(),
      sme: invoice.sme,
      investor: invoice.investor,
      client: invoice.client,
      faceValue: ethers.formatEther(invoice.faceValue) + ' XDC',
      salePrice: ethers.formatEther(invoice.salePrice) + ' XDC',
      status: invoice.status.toString() + ' (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)'
    });
    
    if (invoice.status !== 0n) {
      console.log('Invoice is not available for purchase (status:', invoice.status.toString(), ')');
      return;
    }
    
    // Buy the invoice
    const salePrice = invoice.salePrice;
    console.log('Buying invoice for:', ethers.formatEther(salePrice), 'XDC');
    
    const tx = await contract.connect(investor).buyInvoice(1, {
      value: salePrice
    });
    
    console.log('Purchase transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    console.log('Purchase confirmed in block:', receipt.blockNumber);
    
    // Verify the purchase
    const updatedInvoice = await contract.getInvoice(1);
    console.log('Invoice after purchase:', {
      id: updatedInvoice.id.toString(),
      sme: updatedInvoice.sme,
      investor: updatedInvoice.investor,
      client: updatedInvoice.client,
      faceValue: ethers.formatEther(updatedInvoice.faceValue) + ' XDC',
      salePrice: ethers.formatEther(updatedInvoice.salePrice) + ' XDC',
      status: updatedInvoice.status.toString() + ' (0=OnMarket, 1=Sold, 2=Repaid, 3=Defaulted)'
    });
    
    console.log('\n✅ Invoice successfully purchased!');
    console.log('Now the client can repay this invoice for', ethers.formatEther(updatedInvoice.faceValue), 'XDC');
    
  } catch (error) {
    console.error('Error buying test invoice:', error);
  }
}

buyTestInvoice();