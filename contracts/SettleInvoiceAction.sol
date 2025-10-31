// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InvoiceNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SettleInvoiceAction
 * @dev FLIP-338 Action for settling invoice NFTs (repayment or default)
 */
contract SettleInvoiceAction is Ownable, ReentrancyGuard {
    // The InvoiceNFT contract
    InvoiceNFT public immutable invoiceNFT;
    
    // Action metadata
    string public constant name = "SettleInvoiceAction";
    string public constant description = "Settle an invoice NFT through repayment or default";
    string public constant version = "1.0.0";
    
    // Events
    event InvoiceSettled(
        uint256 indexed tokenId,
        address indexed settler,
        address indexed recipient,
        uint256 amount,
        bool isRepayment
    );
    
    constructor(address _invoiceNFT) Ownable(msg.sender) {
        require(_invoiceNFT != address(0), "Invalid InvoiceNFT address");
        invoiceNFT = InvoiceNFT(_invoiceNFT);
    }
    
    /**
     * @dev Execute the settlement action
     * @param tokenId The ID of the invoice NFT to settle
     * @param isRepayment True if settling through repayment, false if marking as defaulted
     * @return success Whether the action was successful
     */
    function execute(uint256 tokenId, bool isRepayment) external payable nonReentrant returns (bool success) {
        // Get invoice details
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        require(invoice.status == InvoiceNFT.Status.Sold, "Invoice not in sold state");
        
        address currentOwner = invoiceNFT.ownerOf(tokenId);
        
        if (isRepayment) {
            // Handle repayment
            require(msg.sender == invoice.client, "Only client can repay");
            require(msg.value >= invoice.faceValue, "Insufficient payment amount");
            
            // Transfer full amount to current NFT owner (investor)
            (bool transferSuccess,) = currentOwner.call{value: msg.value}("");
            require(transferSuccess, "Payment transfer failed");
            
            // Update invoice status
            invoiceNFT.markAsRepaid(tokenId);
            
            // Emit event
            emit InvoiceSettled(
                tokenId,
                msg.sender,
                currentOwner,
                msg.value,
                true
            );
        } else {
            // Handle default
            require(
                msg.sender == currentOwner || msg.sender == owner(),
                "Only owner or investor can mark default"
            );
            
            // Update invoice status
            invoiceNFT.markAsDefaulted(tokenId);
            
            // Emit event
            emit InvoiceSettled(
                tokenId,
                msg.sender,
                currentOwner,
                0,
                false
            );
        }
        
        return true;
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
    
    // Allow contract to receive native token payments
    receive() external payable {}
}