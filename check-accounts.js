const { ethers } = require('ethers');

async function checkAccounts() {
  try {
    // Connect to local Hardhat network
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Get all accounts from Hardhat
    const accounts = await provider.listAccounts();
    console.log('Available Hardhat accounts:');
    accounts.forEach((account, index) => {
      console.log(`Account ${index}: ${account.address}`);
    });
    
    console.log('\nAccount details:');
    console.log('- Frontend wallet (from error): 0x24E12d5Db42EefeC360e02aCc6F82C682e3C264d');
    console.log('- Debug script wallet (working): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    
    // Check if the frontend wallet is in the list
    const frontendWallet = '0x24E12d5Db42EefeC360e02aCc6F82C682e3C264d';
    const isHardhatAccount = accounts.some(account => 
      account.address.toLowerCase() === frontendWallet.toLowerCase()
    );
    
    console.log('\nIs frontend wallet a Hardhat account?', isHardhatAccount);
    
    if (!isHardhatAccount) {
      console.log('\n⚠️  ISSUE FOUND: The frontend is using a wallet that is not from Hardhat!');
      console.log('This could cause transaction failures.');
      console.log('\nSolution: Connect MetaMask to use one of the Hardhat accounts above.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAccounts();