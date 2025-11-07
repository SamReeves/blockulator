/**
 * Contract Deployment Utility
 * Handles deploying new contract instances from the frontend
 */

import { eventBus, EVENTS } from '../ui/events.js';

export class ContractDeployer {
    /**
     * Deploy a contract
     * @param {string} contractName - Name in kebab-case (e.g., 'gaussian-future')
     * @param {Object} web3Provider - Web3 provider with signer
     * @param {Array} constructorArgs - Constructor arguments
     * @param {Object} deploymentOptions - Options like value (for payable constructors)
     * @returns {Promise<Object>} Deployed contract instance and transaction
     */
    static async deploy(contractName, web3Provider, constructorArgs = [], deploymentOptions = {}) {
        if (!web3Provider.isConnected()) {
            throw new Error('Wallet must be connected to deploy contracts');
        }

        try {
            // Fetch bytecode and ABI
            const response = await fetch(`/contracts/bytecode/${contractName}.json`);
            if (!response.ok) {
                throw new Error(`Bytecode file not found: ${contractName}.json`);
            }
            const { bytecode, abi } = await response.json();
            
            if (!bytecode || !abi) {
                throw new Error(`Invalid bytecode file for ${contractName}`);
            }

            // Get signer
            const signer = web3Provider.getSigner();
            if (!signer) {
                throw new Error('No signer available');
            }

            // Create contract factory
            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            
            // Prepare deployment options
            const txOptions = {};
            if (deploymentOptions.value) {
                txOptions.value = deploymentOptions.value;
            }
            if (deploymentOptions.gasLimit) {
                txOptions.gasLimit = deploymentOptions.gasLimit;
            }

            console.log(`🚀 Deploying ${contractName}...`);
            console.log('Constructor args:', constructorArgs);
            console.log('Transaction options:', txOptions);

            // Deploy contract
            const contract = await factory.deploy(...constructorArgs, txOptions);
            
            console.log(`⏳ Deployment transaction sent: ${contract.deployTransaction.hash}`);
            
            // Wait for deployment
            await contract.deployed();
            
            console.log(`✅ Contract deployed at: ${contract.address}`);
            
            return {
                contract,
                address: contract.address,
                deployTransaction: contract.deployTransaction
            };

        } catch (error) {
            console.error(`Failed to deploy contract ${contractName}:`, error);
            throw error;
        }
    }

    /**
     * Estimate deployment gas
     * @param {string} contractName - Name in kebab-case
     * @param {Object} web3Provider - Web3 provider with signer
     * @param {Array} constructorArgs - Constructor arguments
     * @param {Object} deploymentOptions - Options like value
     * @returns {Promise<BigNumber>} Estimated gas
     */
    static async estimateDeploymentGas(contractName, web3Provider, constructorArgs = [], deploymentOptions = {}) {
        if (!web3Provider.isConnected()) {
            return null;
        }

        try {
            const response = await fetch(`/contracts/bytecode/${contractName}.json`);
            if (!response.ok) return null;
            
            const { bytecode, abi } = await response.json();
            const signer = web3Provider.getSigner();
            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            
            const txOptions = {};
            if (deploymentOptions.value) {
                txOptions.value = deploymentOptions.value;
            }

            const deployTx = factory.getDeployTransaction(...constructorArgs, txOptions);
            const estimatedGas = await signer.estimateGas(deployTx);
            
            return estimatedGas;
        } catch (error) {
            console.error('Failed to estimate gas:', error);
            return null;
        }
    }
}

