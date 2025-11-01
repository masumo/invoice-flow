# InvoiceFlow

A decentralized application for SME invoice financing on the Flow EVM Network, enabling real-world asset tokenization and DeFi solutions for trade finance.

## 🎉 Forte Hacks Upgrade - What's New!

This project is **InvoiceFlow** upgraded for **Forte Hacks**, running on the **Flow EVM** network.

### 🚀 What's New (Hackathon Special Features):

#### ⚡ **Flow Forte Integration**
Utilizing **Forte Scheduled Transactions** to automate investor payments.

#### 🤖 **100% Automated Payments** 
Investors now receive their funds automatically (pushed) exactly on the due date, without needing to manually "claim" payments.

#### 🔄 **Ported to Flow**
Smart contracts (Solidity) and frontend have been migrated from XDC to **Flow EVM Testnet**.

---

## 🚀 Live Demo & Video

- **Flow Version (Latest)**: [https://invoice-flow-jet.vercel.app](https://invoice-flow-jet.vercel.app)
- **XDC Legacy (Hackathon)**: [https://invoice-flow-qv4pdej95-masumos-projects.vercel.app](https://invoice-flow-qv4pdej95-masumos-projects.vercel.app)
- **Deploy to Vercel**: [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/masumo/invoiceflow)
- **Demo Video**: [InvoiceFlow Demo - A Decentralized Invoice Financing Platform](https://youtu.be/5ZyQ_Zm8vG8)
- **Presentation**: [InvoiceFlow: Revolutionizing SME Financing on Flow Network](https://invoiceflow-revolutioniz-32p44ny.gamma.site/invoiceflow-revolutionizing-sme-financing-on-the-flow-network)

## ⛓️ Smart Contract on Flow EVM

- **Network**: Flow EVM Testnet (Chain ID: 545)
- **RPC URL**: `https://testnet.evm.nodes.onflow.org`
- **Explorer**: [Flow EVM Explorer](https://evm-testnet.flowscan.io/)
- **Previous Network**: Migrated from XDC Apothem Testnet

## 🎯 The Problem We Solve

Small and Medium Enterprises (SMEs) face a critical cash flow gap in global trade finance. When SMEs deliver goods or services, they often wait 30-90 days for payment from clients, creating liquidity challenges that can:

- **Limit Growth**: Unable to take on new orders due to cash flow constraints
- **Increase Costs**: Forced to seek expensive short-term financing
- **Risk Business**: Cash flow gaps can threaten business continuity
- **Reduce Competitiveness**: Cannot offer competitive payment terms to clients

Traditionally, invoice factoring and trade finance solutions are:
- Expensive (high fees and interest rates)
- Slow (lengthy approval processes)
- Exclusive (limited to established businesses)
- Opaque (complex terms and hidden costs)

## ✨ Our Solution

InvoiceFlow revolutionizes trade finance through **Real-World Asset (RWA) tokenization** on the Flow EVM:

### 🏭 For SMEs (Invoice Issuers)
- **Instant Liquidity**: Convert invoices to NFTs and sell them immediately
- **Transparent Pricing**: Market-driven pricing with clear terms
- **Global Access**: Reach international investors without intermediaries
- **Lower Costs**: Reduced fees compared to traditional factoring

### 💰 For Investors (Invoice Buyers)
- **Real-World Returns**: Earn yields from actual business transactions
- **Diversified Portfolio**: Invest across different industries and geographies
- **Transparent Risk**: Clear invoice details and SME information
- **Liquid Assets**: Trade invoice NFTs on secondary markets

### 🔄 How It Works
1. **SME Tokenization**: SMEs mint their invoices as NFTs with metadata
2. **Marketplace Listing**: Invoices appear on the investor marketplace
3. **Investor Purchase**: Investors buy invoice NFTs at a discount
4. **Client Payment**: When due, clients pay the full invoice amount
5. **Automatic Settlement**: Smart contracts distribute payments to investors

## 💡 Why Flow EVM?

Flow EVM is the perfect blockchain for next-generation DeFi applications:

### 🚀 **Performance & Innovation**
- **Low Transaction Fees**: Cost-effective transactions
- **Fast Finality**: Quick transaction confirmation
- **High Throughput**: Scalable infrastructure
- **Forte Integration**: Advanced scheduled transaction capabilities

### 🏢 **Developer & User Friendly**
- **EVM Compatibility**: Full Ethereum tooling support
- **Forte Scheduled Transactions**: Automated payment execution
- **Modern Architecture**: Built for Web3 applications
- **Growing Ecosystem**: Active developer community and hackathon support

## 🛠️ Tech Stack

### **Blockchain & Smart Contracts**
- **Solidity**: Smart contract development (v0.8.20)
- **OpenZeppelin**: Security-audited contract libraries
- **Hardhat**: Development environment and testing
- **Flow EVM**: Blockchain infrastructure with Forte integration

### **Frontend & Web3**
- **React.js**: Modern frontend framework
- **Vite**: Fast build tool and dev server
- **Ethers.js v6**: Web3 library for blockchain interactions
- **Tailwind CSS**: Utility-first styling framework

## ⚙️ Getting Started (Local Setup)

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Flow testnet tokens (from [Flow EVM Faucet](https://testnet-faucet.onflow.org/))

### 1. Clone the Repository
```bash
# Clone the Forte Hacks upgrade branch
git clone -b forte-upgrade https://github.com/masumo/invoice-flow.git
cd invoice-flow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PRIVATE_KEY=your_wallet_private_key_here
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_RPC_URL=https://testnet.evm.nodes.onflow.org
VITE_CHAIN_ID=545
VITE_NETWORK_NAME=Flow EVM Testnet
```

### 4. Deploy Smart Contract (Optional)
If you want to deploy your own contract:
```bash
# Compile contracts
npx hardhat compile

# Deploy to Flow EVM testnet
npx hardhat run scripts/deploy.js --network flow-testnet
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 6. Configure MetaMask
Add Flow EVM Testnet to MetaMask:
- **Network Name**: Flow EVM Testnet
- **RPC URL**: https://testnet.evm.nodes.onflow.org
- **Chain ID**: 545
- **Currency Symbol**: FLOW
- **Block Explorer**: https://evm-testnet.flowscan.io

## 📱 Usage Guide

### For SMEs (Small & Medium Enterprises)
1. **Connect Wallet**: Connect your MetaMask wallet
2. **Access SME Dashboard**: Navigate to the SME Dashboard
3. **Create Invoice**: Fill in invoice details (client, amount, due date)
4. **Set Sale Price**: Choose your discount rate for immediate liquidity
5. **Tokenize**: Mint your invoice as an NFT on the blockchain
6. **Receive Payment**: Get immediate payment when an investor buys your invoice

### For Investors
1. **Connect Wallet**: Connect your MetaMask wallet with FLOW tokens
2. **Browse Marketplace**: View available invoice NFTs
3. **Analyze Opportunities**: Check ROI, due dates, and risk factors
4. **Purchase Invoices**: Buy invoice NFTs at discounted prices
5. **Track Portfolio**: Monitor your investments and returns
6. **Collect Returns**: Receive full invoice value when clients pay

## 🚀 Future Roadmap

### Phase 1: Core Platform (Current)
- ✅ Basic invoice tokenization
- ✅ Marketplace for buying/selling
- ✅ Automatic settlement

### Phase 2: Enhanced Features
- 🔄 Secondary market trading
- 🔄 Credit scoring integration
- 🔄 Multi-currency support
- 🔄 Mobile application

### Phase 3: Enterprise Integration
- 📋 ERP system integrations
- 📋 Traditional bank partnerships
- 📋 Regulatory compliance tools
- 📋 Institutional investor onboarding

### Phase 4: Global Expansion
- 🌍 Multi-chain deployment
- 🌍 Regional compliance
- 🌍 Local currency support
- 🌍 Government partnerships

## 🚀 Deployment to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/masumo/invoice-flow)

### Manual Deployment

1. **Fork/Clone the repository**
   ```bash
   git clone -b forte-upgrade https://github.com/masumo/invoice-flow.git
   cd invoice-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

4. **Configure Environment Variables in Vercel Dashboard**
   - `VITE_CONTRACT_ADDRESS`: `your_deployed_contract_address`
   - `VITE_RPC_URL`: `https://testnet.evm.nodes.onflow.org`
   - `VITE_CHAIN_ID`: `545`
   - `VITE_NETWORK_NAME`: `Flow EVM Testnet`


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

**Built with ❤️ for Forte Hacks**

*Empowering global trade through decentralized finance*
