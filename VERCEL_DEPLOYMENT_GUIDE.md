# Vercel Deployment Guide - Flow Network Configuration

## Problem
The Vercel deployment is requesting connection to XDC network instead of Flow network, even when MetaMask is connected to Flow EVM Testnet.

## Root Cause
Environment variables in Vercel are likely still configured for XDC network from the previous deployment.

## Solution: Update Vercel Environment Variables

### 1. Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your InvoiceFlow project
3. Go to **Settings** → **Environment Variables**

### 2. Update/Add These Environment Variables

**Required Variables for Flow Network:**

```env
VITE_CONTRACT_ADDRESS=0x67aC9ADE0e987782E73F3fd2CB367A2bB738dE7b
VITE_RPC_URL=https://testnet.evm.nodes.onflow.org
VITE_CHAIN_ID=545
VITE_NETWORK_NAME=Flow EVM Testnet
VITE_MINT_ACTION_ADDRESS=your_mint_action_address_here
VITE_PURCHASE_ACTION_ADDRESS=your_purchase_action_address_here
VITE_SETTLE_ACTION_ADDRESS=your_settle_action_address_here
```

**Important Notes:**
- Make sure `VITE_CHAIN_ID` is set to `545` (Flow EVM Testnet)
- Make sure `VITE_RPC_URL` is set to `https://testnet.evm.nodes.onflow.org`
- Make sure `VITE_NETWORK_NAME` is set to `Flow EVM Testnet`

### 3. Remove Old XDC Variables (if any)
Delete any environment variables that reference:
- XDC Apothem (Chain ID 51)
- XDC Mainnet (Chain ID 50)
- XDC RPC URLs

### 4. Redeploy
After updating environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Verification Steps

### 1. Check Browser Console
After deployment, open browser console and look for:
```
Environment Variables: {
  CONTRACT_ADDRESS: "0x67aC9ADE0e987782E73F3fd2CB367A2bB738dE7b",
  TARGET_CHAIN_ID: 545,
  TARGET_NETWORK_NAME: "Flow EVM Testnet",
  RPC_URL: "https://testnet.evm.nodes.onflow.org"
}
```

### 2. Test Wallet Connection
1. Connect MetaMask to Flow EVM Testnet
2. Try connecting wallet on the deployed site
3. Should show "Connected to Flow EVM" instead of requesting XDC network

## Flow EVM Testnet Configuration

**Network Details:**
- **Network Name**: Flow EVM Testnet
- **RPC URL**: https://testnet.evm.nodes.onflow.org
- **Chain ID**: 545
- **Currency Symbol**: FLOW
- **Block Explorer**: https://evm-testnet.flowscan.io

## Troubleshooting

### If still showing XDC network request:
1. Clear browser cache and cookies
2. Disconnect and reconnect MetaMask
3. Check that environment variables are correctly set in Vercel
4. Verify the deployment is using the latest code

### If environment variables don't take effect:
1. Make sure variable names start with `VITE_` (required for Vite)
2. Redeploy after changing environment variables
3. Check that variables are set for the correct environment (Production/Preview)

## Current Deployment URLs
- **Flow EVM (Current)**: https://invoice-flow-jet.vercel.app
- **XDC Legacy**: https://invoice-flow-qv4pdej95-masumos-projects.vercel.app

The legacy XDC deployment should remain as-is for reference, while the main deployment should use Flow network configuration.