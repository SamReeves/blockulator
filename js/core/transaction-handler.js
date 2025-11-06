/**
 * Transaction Execution Wrapper
 * Standardizes transaction flow with loading states, events, and error handling
 * 
 * Usage:
 *   import { TransactionHandler } from '../core/transaction-handler.js';
 *   await TransactionHandler.execute(
 *       this.contract.donate({ value: amount }),
 *       { game: 'pay-it-forward', amount }
 *   );
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';

export class TransactionHandler {
    /**
     * Execute a transaction with full lifecycle handling
     * @param {Promise} txPromise - Transaction promise from contract call
     * @param {Object} context - Context data for events (game name, action, etc.)
     * @returns {Promise<TransactionReceipt>} Transaction receipt
     * @throws {Error} If transaction fails
     */
    static async execute(txPromise, context = {}) {
        GameRenderer.setLoading(true);
        
        // Emit submission event
        eventBus.emit(EVENTS.PLAY_SUBMITTED, {
            ...context,
            timestamp: Date.now()
        });

        try {
            // Send transaction
            const tx = await txPromise;
            
            console.log('Transaction sent:', {
                hash: tx.hash,
                ...context
            });

            // Show waiting toast
            eventBus.emit(EVENTS.TOAST, {
                message: '⏳ Transaction sent, waiting for confirmation...',
                type: 'info'
            });

            // Wait for confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            });

            // Emit success events
            eventBus.emit(EVENTS.PLAY_CONFIRMED, {
                ...context,
                receipt,
                hash: tx.hash,
                timestamp: Date.now()
            });

            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Transaction confirmed!',
                type: 'success'
            });

            return receipt;

        } catch (error) {
            console.error('Transaction failed:', error);

            // Emit failure events
            eventBus.emit(EVENTS.PLAY_FAILED, {
                ...context,
                error: error.message,
                timestamp: Date.now()
            });

            // User-friendly error message
            let errorMessage = 'Transaction failed';
            
            if (error.code === 4001) {
                errorMessage = 'Transaction rejected by user';
            } else if (error.reason) {
                errorMessage = `Failed: ${error.reason}`;
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction';
            } else if (error.message) {
                errorMessage = `Failed: ${error.message}`;
            }

            eventBus.emit(EVENTS.TOAST, {
                message: errorMessage,
                type: 'error'
            });

            throw error;

        } finally {
            GameRenderer.setLoading(false);
        }
    }

    /**
     * Execute transaction with automatic state refresh callback
     * @param {Promise} txPromise
     * @param {Object} context
     * @param {Function} refreshCallback - Called after successful transaction
     * @returns {Promise<TransactionReceipt|null>}
     */
    static async executeWithRefresh(txPromise, context, refreshCallback) {
        try {
            const receipt = await this.execute(txPromise, context);
            
            if (refreshCallback && typeof refreshCallback === 'function') {
                await refreshCallback();
            }
            
            return receipt;
        } catch (error) {
            // Error already handled by execute()
            return null;
        }
    }
}

