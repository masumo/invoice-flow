const fs = require('fs');
const path = require('path');

const contracts = [
  'InvoiceNFT',
  'MintInvoiceAction',
  'PurchaseInvoiceAction',
  'SettleInvoiceAction'
];

const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
const targetDir = path.join(__dirname, '..', 'src', 'artifacts', 'contracts');

// Create target directories if they don't exist
fs.mkdirSync(targetDir, { recursive: true });

contracts.forEach(contract => {
  const contractDir = path.join(targetDir, contract + '.sol');
  fs.mkdirSync(contractDir, { recursive: true });
  
  const sourceFile = path.join(artifactsDir, contract + '.sol', contract + '.json');
  const targetFile = path.join(contractDir, contract + '.json');
  
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Copied ABI for ${contract} to frontend artifacts`);
});