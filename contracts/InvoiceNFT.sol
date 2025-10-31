// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InvoiceNFT
 * @dev Core contract for invoice NFTs on Flow EVM
 */
contract InvoiceNFT is ERC721, Ownable, ReentrancyGuard, Pausable {
    // Counter for generating unique token IDs
    uint256 private _tokenIdCounter;
    
    // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant MAX_PLATFORM_FEE = 500;
    
    enum Status {
        OnMarket,   // Invoice is available for purchase
        Sold,       // Invoice has been purchased by an investor
        Repaid,     // Invoice has been repaid by the client
        Defaulted   // Invoice has defaulted (past due date)
    }
    
    struct Invoice {
        uint256 id;           // Unique identifier for the invoice
        address sme;          // Address of the SME that created the invoice
        address investor;     // Address of the current investor (if sold)
        address client;       // Address of the client who owes the invoice
        uint256 faceValue;    // Full amount owed by the client
        uint256 salePrice;    // Discounted price for investors
        uint256 dueDate;      // Unix timestamp when payment is due
        string invoiceURI;    // IPFS URI containing invoice metadata
        Status status;        // Current status of the invoice
        uint256 createdAt;    // Timestamp when invoice was tokenized
    }
    
    // Storage mappings
    mapping(uint256 => Invoice) public invoices;
    mapping(Status => uint256[]) private invoicesByStatus;
    mapping(address => uint256[]) private invoicesByOwner;
    mapping(address => uint256[]) private invoicesByClient;
    mapping(address => uint256[]) private invoicesBySME;
    
    // Index tracking mappings
    mapping(uint256 => mapping(Status => uint256)) private invoiceStatusIndex;
    mapping(uint256 => mapping(address => uint256)) private invoiceOwnerIndex;
    mapping(uint256 => mapping(address => uint256)) private invoiceClientIndex;
    mapping(uint256 => mapping(address => uint256)) private invoiceSMEIndex;
    
    // Events
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
    
    // Authorized minter
    address public authorizedMinter;
    // Authorized settler
    address public authorizedSettler;
    // Authorized purchaser
    address public authorizedPurchaser;

    event AuthorizedMinterUpdated(address oldMinter, address newMinter);
    event AuthorizedSettlerUpdated(address oldSettler, address newSettler);
    event AuthorizedPurchaserUpdated(address oldPurchaser, address newPurchaser);

    constructor() ERC721("InvoiceFlow NFT", "INVOICE") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    function setAuthorizedMinter(address minter) external onlyOwner {
        address oldMinter = authorizedMinter;
        authorizedMinter = minter;
        emit AuthorizedMinterUpdated(oldMinter, minter);
    }

    function setAuthorizedSettler(address settler) external onlyOwner {
        address oldSettler = authorizedSettler;
        authorizedSettler = settler;
        emit AuthorizedSettlerUpdated(oldSettler, settler);
    }

    function setAuthorizedPurchaser(address purchaser) external onlyOwner {
        address oldPurchaser = authorizedPurchaser;
        authorizedPurchaser = purchaser;
        emit AuthorizedPurchaserUpdated(oldPurchaser, purchaser);
    }
    
    // Core NFT functionality
    function mint(
        address to,
        address client,
        uint256 faceValue,
        uint256 salePrice,
        uint256 dueDate,
        string memory invoiceURI
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(msg.sender == owner() || msg.sender == authorizedMinter, "Not authorized to mint");
        require(client != address(0), "Client address cannot be zero");
        require(client != to, "SME cannot be the client");
        require(faceValue > 0, "Face value must be greater than zero");
        require(salePrice > 0, "Sale price must be greater than zero");
        require(salePrice < faceValue, "Sale price must be less than face value");
        require(dueDate > block.timestamp, "Due date must be in the future");
        require(bytes(invoiceURI).length > 0, "Invoice URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        invoices[tokenId] = Invoice({
            id: tokenId,
            sme: to,
            investor: address(0),
            client: client,
            faceValue: faceValue,
            salePrice: salePrice,
            dueDate: dueDate,
            invoiceURI: invoiceURI,
            status: Status.OnMarket,
            createdAt: block.timestamp
        });
        
        _safeMint(to, tokenId);
        
        _addToStatusArray(tokenId, Status.OnMarket);
        _addToOwnerArray(tokenId, to);
        _addToClientArray(tokenId, client);
        _addToSMEArray(tokenId, to);
        
        emit InvoiceTokenized(
            tokenId,
            to,
            client,
            faceValue,
            salePrice,
            dueDate,
            invoiceURI
        );
        
        return tokenId;
    }
    
    // View functions
    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        return invoices[tokenId];
    }
    
    function getInvoicesByStatus(Status status) external view returns (uint256[] memory) {
        return invoicesByStatus[status];
    }
    
    function getInvoicesByOwner(address owner) external view returns (uint256[] memory) {
        return invoicesByOwner[owner];
    }
    
    function getInvoicesByClient(address client) external view returns (uint256[] memory) {
        return invoicesByClient[client];
    }
    
    function getInvoicesBySME(address sme) external view returns (uint256[] memory) {
        return invoicesBySME[sme];
    }
    
    function getTotalInvoices() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    function calculateProfit(uint256 tokenId) external view returns (uint256) {
        Invoice memory invoice = invoices[tokenId];
        require(invoice.faceValue > invoice.salePrice, "Invalid invoice data");
        return invoice.faceValue - invoice.salePrice;
    }
    
    // Admin functions
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PLATFORM_FEE, "Fee exceeds maximum allowed");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }
    
    // Internal array management functions
    function _addToStatusArray(uint256 tokenId, Status status) private {
        invoicesByStatus[status].push(tokenId);
        invoiceStatusIndex[tokenId][status] = invoicesByStatus[status].length - 1;
    }
    
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
    
    function _addToOwnerArray(uint256 tokenId, address owner) private {
        invoicesByOwner[owner].push(tokenId);
        invoiceOwnerIndex[tokenId][owner] = invoicesByOwner[owner].length - 1;
    }
    
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
    
    function _addToClientArray(uint256 tokenId, address client) private {
        invoicesByClient[client].push(tokenId);
        invoiceClientIndex[tokenId][client] = invoicesByClient[client].length - 1;
    }
    
    function _removeFromClientArray(uint256 tokenId, address client) private {
        uint256[] storage clientArray = invoicesByClient[client];
        uint256 index = invoiceClientIndex[tokenId][client];
        uint256 lastIndex = clientArray.length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = clientArray[lastIndex];
            clientArray[index] = lastTokenId;
            invoiceClientIndex[lastTokenId][client] = index;
        }
        
        clientArray.pop();
        delete invoiceClientIndex[tokenId][client];
    }
    
    function _addToSMEArray(uint256 tokenId, address sme) private {
        invoicesBySME[sme].push(tokenId);
        invoiceSMEIndex[tokenId][sme] = invoicesBySME[sme].length - 1;
    }
    
    function _removeFromSMEArray(uint256 tokenId, address sme) private {
        uint256[] storage smeArray = invoicesBySME[sme];
        uint256 index = invoiceSMEIndex[tokenId][sme];
        uint256 lastIndex = smeArray.length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = smeArray[lastIndex];
            smeArray[index] = lastTokenId;
            invoiceSMEIndex[lastTokenId][sme] = index;
        }
        
        smeArray.pop();
        delete invoiceSMEIndex[tokenId][sme];
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        return invoices[tokenId].invoiceURI;
    }
    
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Status update functions
    function markAsRepaid(uint256 tokenId) external {
        require(msg.sender == owner() || msg.sender == authorizedSettler, "Not authorized to settle");
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == Status.Sold, "Invoice not in sold state");

        _removeFromStatusArray(tokenId, Status.Sold);
        invoice.status = Status.Repaid;
        _addToStatusArray(tokenId, Status.Repaid);

        emit InvoiceRepaid(
            tokenId,
            invoice.investor,
            invoice.client,
            invoice.faceValue
        );
    }

    function markAsDefaulted(uint256 tokenId) external {
        require(msg.sender == owner() || msg.sender == authorizedSettler, "Not authorized to settle");
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == Status.Sold, "Invoice not in sold state");

        _removeFromStatusArray(tokenId, Status.Sold);
        invoice.status = Status.Defaulted;
        _addToStatusArray(tokenId, Status.Defaulted);

        emit InvoiceDefaulted(
            tokenId,
            invoice.investor,
            invoice.faceValue
        );
    }
    
    /**
     * @dev Update invoice status and transfer ownership if needed
     * @param tokenId The ID of the invoice to update
     * @param newStatus The new status to set
     * @param newOwner The new owner address (if status is Sold)
     */
    function updateInvoiceStatus(
        uint256 tokenId,
        Status newStatus,
        address newOwner
    ) external {
        require(msg.sender == owner() || _ownerOf(tokenId) == _msgSender() || getApproved(tokenId) == _msgSender() || isApprovedForAll(_ownerOf(tokenId), _msgSender()) || msg.sender == authorizedPurchaser, "Not authorized");
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        
        Invoice storage invoice = invoices[tokenId];
        Status oldStatus = invoice.status;
        
        // Remove from old status array
        _removeFromStatusArray(tokenId, oldStatus);
        
        // Update status
        invoice.status = newStatus;
        
        // Add to new status array
        _addToStatusArray(tokenId, newStatus);
        
        // If status is Sold, update owner and investor
        if (newStatus == Status.Sold) {
            require(newOwner != address(0), "Invalid new owner");
            invoice.investor = newOwner;
            _transfer(invoice.sme, newOwner, tokenId);
            
            // Update owner arrays
            _removeFromOwnerArray(tokenId, invoice.sme);
            _addToOwnerArray(tokenId, newOwner);
            
            emit InvoiceSold(tokenId, invoice.sme, newOwner, invoice.salePrice);
        }
    }
}