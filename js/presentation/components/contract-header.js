/**
 * Contract Header Component
 * Presentation layer - reusable contract information display
 */

export class ContractHeaderComponent {
    /**
     * Create a contract header with title, description, and contract info
     */
    static create(config) {
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = config.title;
        header.appendChild(title);
        
        if (config.description) {
            const description = document.createElement('p');
            description.className = 'game-description';
            description.textContent = config.description;
            header.appendChild(description);
        }
        
        // Add contract info section
        if (config.contractAddress) {
            const contractInfo = this.createContractInfo(
                config.contractAddress, 
                config.sourceFile, 
                config.abiFile
            );
            header.appendChild(contractInfo);
        }
        
        return header;
    }

    /**
     * Create contract info section with links
     */
    static createContractInfo(contractAddress, sourceFile = null, abiFile = null) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'contract-info';
        
        const label = document.createElement('span');
        label.className = 'contract-label';
        label.textContent = 'Contract:';
        
        const addressLink = document.createElement('a');
        addressLink.className = 'contract-address';
        addressLink.href = `https://sepolia.etherscan.io/address/${contractAddress}`;
        addressLink.target = '_blank';
        addressLink.rel = 'noopener noreferrer';
        addressLink.textContent = this.formatAddress(contractAddress);
        addressLink.title = contractAddress;
        
        const viewBadge = document.createElement('a');
        viewBadge.className = 'contract-badge';
        viewBadge.href = `https://sepolia.etherscan.io/address/${contractAddress}#code`;
        viewBadge.target = '_blank';
        viewBadge.rel = 'noopener noreferrer';
        viewBadge.innerHTML = '📜 View on Etherscan';
        
        infoContainer.appendChild(label);
        infoContainer.appendChild(addressLink);
        infoContainer.appendChild(viewBadge);
        
        if (sourceFile) {
            const viewSourceBtn = document.createElement('button');
            viewSourceBtn.className = 'contract-badge contract-badge-source';
            viewSourceBtn.innerHTML = '🐍 View Vyper Source';
            viewSourceBtn.onclick = () => this.showSourceModal(sourceFile);
            infoContainer.appendChild(viewSourceBtn);
        }
        
        if (abiFile) {
            const viewAbiBtn = document.createElement('button');
            viewAbiBtn.className = 'contract-badge contract-badge-abi';
            viewAbiBtn.innerHTML = '📋 View ABI';
            viewAbiBtn.onclick = () => this.showAbiModal(abiFile);
            infoContainer.appendChild(viewAbiBtn);
        }
        
        return infoContainer;
    }

    static formatAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    static async showSourceModal(sourceFile) {
        // Placeholder - this would need to be implemented with modal logic
        console.log('Show source modal for:', sourceFile);
    }

    static async showAbiModal(abiFile) {
        // Placeholder - this would need to be implemented with modal logic
        console.log('Show ABI modal for:', abiFile);
    }
}

