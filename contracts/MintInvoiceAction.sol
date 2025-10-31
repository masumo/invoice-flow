// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InvoiceNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MintInvoiceAction
 * @dev FLIP-338 Action for minting invoice NFTs
 */
contract MintInvoiceAction is Ownable, ReentrancyGuard {
    // The InvoiceNFT contract
    InvoiceNFT public immutable invoiceNFT;
    
    // Action metadata
    string public constant name = "MintInvoiceAction";
    string public constant description = "Mint an invoice as an NFT with specified parameters";
    string public constant version = "1.0.0";
    
    // Event emitted when an invoice is minted
    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed sme,
        address indexed client,
        uint256 faceValue,
        uint256 salePrice,
        uint256 dueDate,
        string invoiceURI
    );
    
    constructor(address _invoiceNFT) Ownable(msg.sender) {
        require(_invoiceNFT != address(0), "Invalid InvoiceNFT address");
        invoiceNFT = InvoiceNFT(_invoiceNFT);
    }
    
    /**
     * @dev Execute the mint action
     * @param sme Address of the SME creating the invoice
     * @param client Address of the client who owes the invoice
     * @param faceValue Full amount owed by the client
     * @param salePrice Discounted price for investors
     * @param dueDate Unix timestamp when payment is due
     * @param invoiceURI IPFS URI containing invoice metadata
     * @return success Whether the action was successful
     * @return tokenId The ID of the newly minted invoice NFT
     */
    function execute(
        address sme,
        address client,
        uint256 faceValue,
        uint256 salePrice,
        uint256 dueDate,
        string memory invoiceURI
    ) external nonReentrant returns (bool success, uint256 tokenId) {
        // Input validation
        require(sme != address(0), "SME address cannot be zero");
        require(client != address(0), "Client address cannot be zero");
        require(client != sme, "SME cannot be the client");
        require(faceValue > 0, "Face value must be greater than zero");
        require(salePrice > 0, "Sale price must be greater than zero");
        require(salePrice < faceValue, "Sale price must be less than face value");
        require(dueDate > block.timestamp, "Due date must be in the future");
        require(bytes(invoiceURI).length > 0, "Invoice URI cannot be empty");
        
        // Mint the invoice NFT
        tokenId = invoiceNFT.mint(
            sme,
            client,
            faceValue,
            salePrice,
            dueDate,
            invoiceURI
        );
        
        // Emit event
        emit InvoiceMinted(
            tokenId,
            sme,
            client,
            faceValue,
            salePrice,
            dueDate,
            invoiceURI
        );
        
        return (true, tokenId);
    }
    
    /**
     * @dev Get the action metadata
     * @return name The name of the action
     * @return description A description of what the action does
     * @return version The semantic version of the action
     */
    function getMetadata() external pure returns (
        string memory,
        string memory,
        string memory
    ) {
        return (name, description, version);
    }
}