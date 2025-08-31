// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InvoiceNFT
 * @dev A smart contract for tokenizing invoices as NFTs on the XDC Network
 * @notice This contract enables SMEs to tokenize their invoices and sell them to investors
 */
contract InvoiceNFT is ERC721, Ownable, ReentrancyGuard, Pausable {
    // Counter for generating unique token IDs
    uint256 private _tokenIdCounter;
    
    // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    
    // Maximum platform fee that can be set (5%)
    uint256 public constant MAX_PLATFORM_FEE = 500;
    
    /**
     * @dev Enum representing the status of an invoice
     */
    enum Status {
        OnMarket,   // Invoice is available for purchase
        Sold,       // Invoice has been purchased by an investor
        Repaid,     // Invoice has been repaid by the client
        Defaulted   // Invoice has defaulted (past due date)
    }
    
    /**
     * @dev Struct containing all invoice data
     */
    struct Invoice {
        uint256 id;           // Unique identifier for the invoice
        address sme;          // Address of the SME that created the invoice
        address investor;     // Address of the investor who bought the invoice
        address client;       // Address of the client who owes the invoice
        uint256 faceValue;    // Full amount owed by the client
        uint256 salePrice;    // Discounted price for investors
        uint256 dueDate;      // Unix timestamp when payment is due
        string invoiceURI;    // IPFS URI containing invoice metadata
        Status status;        // Current status of the invoice
        uint256 createdAt;    // Timestamp when invoice was tokenized
    }
    
    // Mapping from token ID to invoice data
    mapping(uint256 => Invoice) public invoices;
    
    // Mapping to track invoices by status for efficient querying
    mapping(Status => uint256[]) private invoicesByStatus;
    
    // Mapping to track invoices by owner for efficient querying
    mapping(address => uint256[]) private invoicesByOwner;
    
    // Mapping to track invoice positions in arrays for efficient removal
    mapping(uint256 => mapping(Status => uint256)) private invoiceStatusIndex;
    mapping(uint256 => mapping(address => uint256)) private invoiceOwnerIndex;
    
    /**
     * @dev Events for tracking important contract interactions
     */
    event InvoiceTokenized(
        uint256 indexed tokenId,
        address indexed sme,
        address indexed client,
        uint256 faceValue,
        uint256 salePrice,
        uint256 dueDate,
        string invoiceURI
    );
    
    event InvoiceSold(
        uint256 indexed tokenId,
        address indexed sme,
        address indexed investor,
        uint256 salePrice
    );
    
    event InvoiceRepaid(
        uint256 indexed tokenId,
        address indexed investor,
        address indexed client,
        uint256 faceValue
    );
    
    event InvoiceDefaulted(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 faceValue
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    /**
     * @dev Constructor initializes the ERC721 token
     */
    constructor() ERC721("InvoiceFlow NFT", "INVOICE") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs from 1
    }
    
    /**
     * @dev Modifier to check if caller is the SME of a specific invoice
     */
    modifier onlySME(uint256 tokenId) {
        require(invoices[tokenId].sme == msg.sender, "Only SME can perform this action");
        _;
    }
    
    /**
     * @dev Modifier to check if caller is the client of a specific invoice
     */
    modifier onlyClient(uint256 tokenId) {
        require(invoices[tokenId].client == msg.sender, "Only client can perform this action");
        _;
    }
    
    /**
     * @dev Tokenize an invoice as an NFT
     * @param client Address of the client who owes the invoice
     * @param faceValue Full amount owed by the client (in wei)
     * @param salePrice Discounted price for investors (in wei)
     * @param dueDate Unix timestamp when payment is due
     * @param invoiceURI IPFS URI containing invoice metadata
     * @return tokenId The ID of the newly minted invoice NFT
     */
    function tokenizeInvoice(
        address client,
        uint256 faceValue,
        uint256 salePrice,
        uint256 dueDate,
        string memory invoiceURI
    ) external whenNotPaused nonReentrant returns (uint256) {
        // Input validation
        require(client != address(0), "Client address cannot be zero");
        require(client != msg.sender, "SME cannot be the client");
        require(faceValue > 0, "Face value must be greater than zero");
        require(salePrice > 0, "Sale price must be greater than zero");
        require(salePrice < faceValue, "Sale price must be less than face value");
        require(dueDate > block.timestamp, "Due date must be in the future");
        require(bytes(invoiceURI).length > 0, "Invoice URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create the invoice struct
        invoices[tokenId] = Invoice({
            id: tokenId,
            sme: msg.sender,
            investor: address(0),
            client: client,
            faceValue: faceValue,
            salePrice: salePrice,
            dueDate: dueDate,
            invoiceURI: invoiceURI,
            status: Status.OnMarket,
            createdAt: block.timestamp
        });
        
        // Mint the NFT to the SME
        _safeMint(msg.sender, tokenId);
        
        // Add to tracking arrays
        _addToStatusArray(tokenId, Status.OnMarket);
        _addToOwnerArray(tokenId, msg.sender);
        
        emit InvoiceTokenized(
            tokenId,
            msg.sender,
            client,
            faceValue,
            salePrice,
            dueDate,
            invoiceURI
        );
        
        return tokenId;
    }
    
    /**
     * @dev Buy an invoice NFT from the marketplace
     * @param tokenId ID of the invoice NFT to purchase
     */
    function buyInvoice(uint256 tokenId) external payable whenNotPaused nonReentrant {
        Invoice storage invoice = invoices[tokenId];
        
        // Validation checks
        require(invoice.status == Status.OnMarket, "Invoice is not available for sale");
        require(msg.sender != invoice.sme, "SME cannot buy their own invoice");
        require(msg.sender != invoice.client, "Client cannot buy the invoice");
        require(msg.value == invoice.salePrice, "Incorrect payment amount");
        require(block.timestamp < invoice.dueDate, "Invoice has expired");
        
        address sme = invoice.sme;
        uint256 salePrice = invoice.salePrice;
        
        // Calculate platform fee
        uint256 fee = (salePrice * platformFee) / 10000;
        uint256 smeAmount = salePrice - fee;
        
        // Update invoice status and investor
        invoice.status = Status.Sold;
        invoice.investor = msg.sender;
        
        // Update tracking arrays
        _removeFromStatusArray(tokenId, Status.OnMarket);
        _addToStatusArray(tokenId, Status.Sold);
        _removeFromOwnerArray(tokenId, sme);
        _addToOwnerArray(tokenId, msg.sender);
        
        // Transfer the NFT to the investor
        _transfer(sme, msg.sender, tokenId);
        
        // Transfer payments
        (bool smeSuccess, ) = payable(sme).call{value: smeAmount}("");
        require(smeSuccess, "Payment to SME failed");
        
        if (fee > 0) {
            (bool feeSuccess, ) = payable(owner()).call{value: fee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        emit InvoiceSold(tokenId, sme, msg.sender, salePrice);
    }
    
    /**
     * @dev Repay an invoice (called by the client)
     * @param tokenId ID of the invoice NFT to repay
     */
    function repayInvoice(uint256 tokenId) external payable onlyClient(tokenId) whenNotPaused nonReentrant {
        Invoice storage invoice = invoices[tokenId];
        
        require(invoice.status == Status.Sold, "Invoice must be sold to be repaid");
        require(msg.value == invoice.faceValue, "Incorrect repayment amount");
        require(block.timestamp <= invoice.dueDate, "Invoice payment is overdue");
        
        address investor = invoice.investor;
        uint256 faceValue = invoice.faceValue;
        
        // Update invoice status
        invoice.status = Status.Repaid;
        
        // Update tracking arrays
        _removeFromStatusArray(tokenId, Status.Sold);
        _addToStatusArray(tokenId, Status.Repaid);
        
        // Transfer the full face value to the investor
        (bool success, ) = payable(investor).call{value: faceValue}("");
        require(success, "Payment to investor failed");
        
        emit InvoiceRepaid(tokenId, investor, msg.sender, faceValue);
    }
    
    /**
     * @dev Mark an invoice as defaulted (can be called by anyone after due date)
     * @param tokenId ID of the invoice NFT to mark as defaulted
     */
    function markAsDefaulted(uint256 tokenId) external whenNotPaused {
        Invoice storage invoice = invoices[tokenId];
        
        require(invoice.status == Status.Sold, "Invoice must be sold to default");
        require(block.timestamp > invoice.dueDate, "Invoice is not yet overdue");
        
        // Update invoice status
        invoice.status = Status.Defaulted;
        
        // Update tracking arrays
        _removeFromStatusArray(tokenId, Status.Sold);
        _addToStatusArray(tokenId, Status.Defaulted);
        
        emit InvoiceDefaulted(tokenId, invoice.investor, invoice.faceValue);
    }
    
    /**
     * @dev Get invoices by status
     * @param status The status to filter by
     * @return Array of token IDs with the specified status
     */
    function getInvoicesByStatus(Status status) external view returns (uint256[] memory) {
        return invoicesByStatus[status];
    }
    
    /**
     * @dev Get invoices by owner
     * @param owner The owner address to filter by
     * @return Array of token IDs owned by the specified address
     */
    function getInvoicesByOwner(address owner) external view returns (uint256[] memory) {
        return invoicesByOwner[owner];
    }
    
    /**
     * @dev Get detailed information about an invoice
     * @param tokenId The token ID to query
     * @return The complete invoice struct
     */
    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        return invoices[tokenId];
    }
    
    /**
     * @dev Get the total number of invoices created
     * @return The total count of invoices
     */
    function getTotalInvoices() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Calculate potential profit for an invoice
     * @param tokenId The token ID to calculate profit for
     * @return The potential profit amount
     */
    function calculateProfit(uint256 tokenId) external view returns (uint256) {
        Invoice memory invoice = invoices[tokenId];
        require(invoice.faceValue > invoice.salePrice, "Invalid invoice data");
        return invoice.faceValue - invoice.salePrice;
    }
    
    /**
     * @dev Set the platform fee (only owner)
     * @param newFee The new platform fee in basis points
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PLATFORM_FEE, "Fee exceeds maximum allowed");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw accumulated platform fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }
    
    /**
     * @dev Internal function to add invoice to status array
     */
    function _addToStatusArray(uint256 tokenId, Status status) private {
        invoicesByStatus[status].push(tokenId);
        invoiceStatusIndex[tokenId][status] = invoicesByStatus[status].length - 1;
    }
    
    /**
     * @dev Internal function to remove invoice from status array
     */
    function _removeFromStatusArray(uint256 tokenId, Status status) private {
        uint256[] storage statusArray = invoicesByStatus[status];
        uint256 index = invoiceStatusIndex[tokenId][status];
        uint256 lastIndex = statusArray.length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = statusArray[lastIndex];
            statusArray[index] = lastTokenId;
            invoiceStatusIndex[lastTokenId][status] = index;
        }
        
        statusArray.pop();
        delete invoiceStatusIndex[tokenId][status];
    }
    
    /**
     * @dev Internal function to add invoice to owner array
     */
    function _addToOwnerArray(uint256 tokenId, address owner) private {
        invoicesByOwner[owner].push(tokenId);
        invoiceOwnerIndex[tokenId][owner] = invoicesByOwner[owner].length - 1;
    }
    
    /**
     * @dev Internal function to remove invoice from owner array
     */
    function _removeFromOwnerArray(uint256 tokenId, address owner) private {
        uint256[] storage ownerArray = invoicesByOwner[owner];
        uint256 index = invoiceOwnerIndex[tokenId][owner];
        uint256 lastIndex = ownerArray.length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = ownerArray[lastIndex];
            ownerArray[index] = lastTokenId;
            invoiceOwnerIndex[lastTokenId][owner] = index;
        }
        
        ownerArray.pop();
        delete invoiceOwnerIndex[tokenId][owner];
    }
    
    /**
     * @dev Override tokenURI to return invoice metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        return invoices[tokenId].invoiceURI;
    }
    
    /**
     * @dev Override supportsInterface for ERC721 and additional interfaces
     */
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}