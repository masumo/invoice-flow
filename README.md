# InvoiceFlow

A decentralized application for SME invoice financing on the XDC Network, enabling real-world asset tokenization and DeFi solutions for trade finance.

## 🚀 Live Demo & Video

- **Flow Version (Latest)**: [https://invoice-flow-jet.vercel.app](https://invoice-flow-jet.vercel.app)
- **XDC Legacy (Hackathon)**: [https://invoice-flow-qv4pdej95-masumos-projects.vercel.app](https://invoice-flow-qv4pdej95-masumos-projects.vercel.app)
- **Deploy to Vercel**: [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/masumo/invoiceflow)
- **Demo Video**: [Coming Soon - YouTube Link]
- **Presentation**: [Coming Soon - Pitch Deck]

## ⛓️ Smart Contract on Apothem

- **Contract Address**: `0x67aC9ADE0e987782E73F3fd2CB367A2bB738dE7b`
- **Network**: XDC Apothem Testnet (Chain ID: 51)
- **Explorer**: [View on XDC Explorer](https://explorer.apothem.network/address/0x67aC9ADE0e987782E73F3fd2CB367A2bB738dE7b)

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

InvoiceFlow revolutionizes trade finance through **Real-World Asset (RWA) tokenization** on the XDC Network:

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

## 💡 Why XDC Network?

XDC Network is the perfect blockchain for trade finance applications:

### 🚀 **Performance & Cost**
- **Low Transaction Fees**: ~$0.00001 per transaction
- **Fast Finality**: 2-second block times
- **High Throughput**: 2000+ TPS capacity
- **Energy Efficient**: Delegated Proof of Stake consensus

### 🏢 **Enterprise Ready**
- **Trade Finance Focus**: Built specifically for global trade
- **Regulatory Compliance**: KYC/AML compatible architecture
- **Enterprise Adoption**: Used by major trade finance institutions
- **Interoperability**: Bridges to Ethereum and other networks

### 🌍 **Global Reach**
- **International Network**: Masternodes across 6 continents
- **Banking Partnerships**: Integrated with traditional finance
- **Government Support**: Backed by trade finance initiatives
- **Developer Ecosystem**: Growing DeFi and RWA projects

## 🛠️ Tech Stack

### **Blockchain & Smart Contracts**
- **Solidity**: Smart contract development (v0.8.20)
- **OpenZeppelin**: Security-audited contract libraries
- **Hardhat**: Development environment and testing
- **XDC Network**: Blockchain infrastructure

### **Frontend & Web3**
- **React.js**: Modern frontend framework
- **Vite**: Fast build tool and dev server
- **Ethers.js v6**: Web3 library for blockchain interactions
- **Tailwind CSS**: Utility-first styling framework

### **Development Tools**
- **MetaMask**: Wallet integration
- **React Router**: Client-side routing
- **React Hot Toast**: User notifications
- **Heroicons**: Beautiful SVG icons

## ⚙️ Getting Started (Local Setup)

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- XDC testnet tokens (from [XDC Faucet](https://faucet.apothem.network/))

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/invoiceflow.git
cd invoiceflow
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
VITE_RPC_URL=https://rpc.apothem.network
VITE_CHAIN_ID=51
VITE_NETWORK_NAME=XDC Apothem Network
```

### 4. Deploy Smart Contract (Optional)
If you want to deploy your own contract:
```bash
# Compile contracts
npx hardhat compile

# Deploy to XDC Apothem testnet
npx hardhat run scripts/deploy.js --network apothem
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 6. Configure MetaMask
Add XDC Apothem Network to MetaMask:
- **Network Name**: XDC Apothem Network
- **RPC URL**: https://rpc.apothem.network
- **Chain ID**: 51
- **Currency Symbol**: XDC
- **Block Explorer**: https://explorer.apothem.network

## 📱 Usage Guide

### For SMEs (Small & Medium Enterprises)
1. **Connect Wallet**: Connect your MetaMask wallet
2. **Access SME Dashboard**: Navigate to the SME Dashboard
3. **Create Invoice**: Fill in invoice details (client, amount, due date)
4. **Set Sale Price**: Choose your discount rate for immediate liquidity
5. **Tokenize**: Mint your invoice as an NFT on the blockchain
6. **Receive Payment**: Get immediate payment when an investor buys your invoice

### For Investors
1. **Connect Wallet**: Connect your MetaMask wallet with XDC tokens
2. **Browse Marketplace**: View available invoice NFTs
3. **Analyze Opportunities**: Check ROI, due dates, and risk factors
4. **Purchase Invoices**: Buy invoice NFTs at discounted prices
5. **Track Portfolio**: Monitor your investments and returns
6. **Collect Returns**: Receive full invoice value when clients pay

## 🔒 Security Features

- **OpenZeppelin Libraries**: Industry-standard security patterns
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Access Control**: Role-based permissions for contract functions
- **Input Validation**: Comprehensive checks on all user inputs
- **Pausable Contract**: Emergency stop functionality
- **Event Logging**: Complete audit trail of all transactions

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
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/masumo/invoiceflow)

### Manual Deployment

1. **Fork/Clone the repository**
   ```bash
   git clone https://github.com/masumo/invoiceflow.git
   cd invoiceflow
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
   - `VITE_CONTRACT_ADDRESS`: `0x67aC9ADE0e987782E73F3fd2CB367A2bB738dE7b`
   - `VITE_RPC_URL`: `https://rpc.apothem.network`
   - `VITE_CHAIN_ID`: `51`
   - `VITE_NETWORK_NAME`: `XDC Apothem Network`

### Alternative Deployment Options

- **Netlify**: Connect your GitHub repo and deploy automatically
- **GitHub Pages**: Use GitHub Actions for static deployment
- **Railway**: One-click deployment with database support

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **XDC Network**: For providing the perfect blockchain infrastructure for trade finance
- **OpenZeppelin**: For security-audited smart contract libraries
- **Hardhat Team**: For excellent development tools
- **React Community**: For the amazing frontend ecosystem

## 📞 Contact & Support

- **Website**: [Coming Soon]
- **Email**: [Your Email]
- **Twitter**: [@InvoiceFlow]
- **Discord**: [Community Link]
- **Documentation**: [Docs Link]

---

**Built with ❤️ for the XDC VIBES Hackathon**

*Empowering global trade through decentralized finance*