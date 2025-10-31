const { ethers } = require('ethers');
require('dotenv').config();

async function checkInvestorBalance() {
    console.log('🔍 Checking investor balance...\n');
    
    // Known investor address from Hardhat (for comparison)
    const hardhatInvestorAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    
    // Try local first, then testnet
    const networks = [
        { name: 'Local Hardhat', url: 'http://127.0.0.1:8545', address: hardhatInvestorAddress },
        { name: 'Flow Testnet', url: 'https://testnet.evm.nodes.onflow.org', address: hardhatInvestorAddress },
        { name: 'Flow Testnet (Alchemy)', url: 'https://flow-testnet.g.alchemy.com/v2/demo', address: hardhatInvestorAddress }
    ];
    
    for (const network of networks) {
        try {
            console.log(`\n🌐 Trying ${network.name}: ${network.url}`);
            const provider = new ethers.JsonRpcProvider(network.url);
            
            // Set timeout
            provider.pollingInterval = 4000;
            
            // Check network connection
            const networkInfo = await provider.getNetwork();
            console.log(`✅ Connected to network: Chain ID ${networkInfo.chainId}`);
            
            // Validate address format
            if (!ethers.isAddress(network.address)) {
                throw new Error(`Invalid address format: ${network.address}`);
            }
            
            console.log(`Checking balance for: ${network.address}`);
            
            // Get investor balance
            const balance = await provider.getBalance(network.address);
            const balanceInFlow = ethers.formatEther(balance);
            
            console.log(`\n💰 ${network.name} Balance:`);
            console.log(`Address: ${network.address}`);
            console.log(`Balance: ${balanceInFlow} FLOW`);
            console.log(`Balance (Wei): ${balance.toString()}`);
            
            // Get latest block for reference
            const latestBlock = await provider.getBlockNumber();
            console.log(`📊 Latest block: ${latestBlock}`);
            
            return {
                success: true,
                balance: balanceInFlow,
                balanceWei: balance.toString(),
                network: network.name,
                rpcUrl: network.url
            };
            
        } catch (error) {
            console.log(`❌ Failed with ${network.name}: ${error.message}`);
            continue;
        }
    }
    
    console.log('❌ All RPC URLs failed');
    return { success: false };
}

// Run the check
checkInvestorBalance()
    .then(result => {
        if (result.success) {
            console.log('\n✅ Balance check completed successfully');
            console.log(`Final balance: ${result.balance} FLOW`);
        } else {
            console.log('\n❌ Could not check balance');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });