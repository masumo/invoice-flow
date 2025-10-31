const { ethers } = require('ethers');
require('dotenv').config();

async function checkTransactionDetails() {
    console.log('🔍 Checking transaction details from block explorer...\n');
    
    // Transaction hashes from the screenshot
    const transactionHashes = [
        '0x92efe34070...c14e',  // First transaction (15m ago)
        '0x6a421327fb...e1c4'   // Second transaction (53m ago)
    ];
    
    // Full transaction hashes (need to get these from block explorer)
    const fullTxHashes = [
        '0x92efe34070c14e',  // Placeholder - need full hash
        '0x6a421327fbe1c4'   // Placeholder - need full hash
    ];
    
    // Try multiple RPC URLs for Flow testnet
    const rpcUrls = [
        'https://testnet.evm.nodes.onflow.org',
        'https://flow-testnet.g.alchemy.com/v2/demo'
    ];
    
    for (const rpcUrl of rpcUrls) {
        try {
            console.log(`\n🌐 Trying RPC: ${rpcUrl}`);
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Check network connection
            const network = await provider.getNetwork();
            console.log(`✅ Connected to Chain ID: ${network.chainId}`);
            
            // Check recent blocks for transactions to the investor address
            console.log('\n🔍 Checking recent blocks for investor transactions...');
            
            const latestBlock = await provider.getBlockNumber();
            console.log(`Latest block: ${latestBlock}`);
            
            // Check last 50 blocks for transactions
            const startBlock = Math.max(0, latestBlock - 50);
            
            for (let blockNum = latestBlock; blockNum >= startBlock; blockNum--) {
                try {
                    const block = await provider.getBlock(blockNum, true);
                    if (block && block.transactions) {
                        for (const tx of block.transactions) {
                            // Check if transaction involves our contract addresses
                            const contractAddresses = [
                                process.env.VITE_INVOICE_NFT_ADDRESS,
                                process.env.VITE_SETTLE_ACTION_ADDRESS,
                                process.env.VITE_PURCHASE_ACTION_ADDRESS
                            ].filter(addr => addr);
                            
                            if (contractAddresses.includes(tx.to)) {
                                console.log(`\n📋 Found contract transaction in block ${blockNum}:`);
                                console.log(`Hash: ${tx.hash}`);
                                console.log(`From: ${tx.from}`);
                                console.log(`To: ${tx.to}`);
                                console.log(`Value: ${ethers.formatEther(tx.value || 0)} FLOW`);
                                console.log(`Gas Used: ${tx.gasLimit}`);
                                
                                // Get transaction receipt for more details
                                try {
                                    const receipt = await provider.getTransactionReceipt(tx.hash);
                                    if (receipt) {
                                        console.log(`Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
                                        console.log(`Gas Used: ${receipt.gasUsed}`);
                                        console.log(`Logs: ${receipt.logs.length} events`);
                                        
                                        // Check for specific events
                                        for (const log of receipt.logs) {
                                            console.log(`  Event: ${log.address} - ${log.topics[0]}`);
                                        }
                                    }
                                } catch (receiptError) {
                                    console.log(`Could not get receipt: ${receiptError.message}`);
                                }
                            }
                        }
                    }
                } catch (blockError) {
                    // Skip blocks that can't be fetched
                    continue;
                }
                
                // Limit to prevent too many requests
                if (blockNum % 10 === 0) {
                    console.log(`Checked up to block ${blockNum}...`);
                }
            }
            
            return { success: true, rpcUrl };
            
        } catch (error) {
            console.log(`❌ Failed with ${rpcUrl}: ${error.message}`);
            continue;
        }
    }
    
    console.log('\n❌ All RPC URLs failed');
    return { success: false };
}

// Run the check
checkTransactionDetails()
    .then(result => {
        if (result.success) {
            console.log('\n✅ Transaction check completed');
        } else {
            console.log('\n❌ Could not check transactions');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });