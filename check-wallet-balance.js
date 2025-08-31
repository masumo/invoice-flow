const { ethers } = require('hardhat');

async function checkWalletBalance() {
  try {
    // Get provider
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Frontend wallet address from error
    const frontendWallet = '0x24E12d5Db42EefeC360e02aCc6F82C682e3C264d';
    
    // Check balance
    const balance = await provider.getBalance(frontendWallet);
    console.log('Frontend wallet address:', frontendWallet);
    console.log('Balance (Wei):', balance.toString());
    console.log('Balance (ETH):', ethers.formatEther(balance));
    
    // Check network
    const network = await provider.getNetwork();
    console.log('Network:', network);
    
    // Check if wallet exists on this network
    const code = await provider.getCode(frontendWallet);
    console.log('Wallet code (should be 0x for EOA):', code);
    
    // Get all Hardhat accounts for comparison
    const accounts = await ethers.getSigners();
    console.log('\nHardhat accounts:');
    for (let i = 0; i < Math.min(5, accounts.length); i++) {
      const account = accounts[i];
      const balance = await provider.getBalance(account.address);
      console.log(`Account ${i}: ${account.address} - Balance: ${ethers.formatEther(balance)} ETH`);
    }
    
    // Check if frontend wallet matches any Hardhat account
    const isHardhatAccount = accounts.some(account => 
      account.address.toLowerCase() === frontendWallet.toLowerCase()
    );
    console.log('\nIs frontend wallet a Hardhat account?', isHardhatAccount);
    
    if (balance === 0n) {
      console.log('\n❌ PROBLEM: Frontend wallet has 0 ETH balance!');
      console.log('Solution: Import a Hardhat account to MetaMask or fund this wallet.');
    } else {
      console.log('\n✅ Wallet has sufficient balance.');
    }
    
  } catch (error) {
    console.error('Error checking wallet:', error);
  }
}

checkWalletBalance();