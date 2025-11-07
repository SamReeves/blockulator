/**
 * Create Discussion Form Component
 * Handles creation of new discussions
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { ValueInput } from '../components/value-input.js';

export class CreateForm {
    constructor(board, web3Provider) {
        this.board = board;
        this.web3Provider = web3Provider;
        this.valueInput = null;
        this.minDonationInput = null;
    }

    /**
     * Initialize the form
     */
    init() {
        this.setupValueInputs();
        this.setupFormHandlers();
        this.updateMinValue();
    }

    /**
     * Setup value input components
     */
    setupValueInputs() {
        // Initial value input (min 0.001 ETH = 1,000,000 GWEI = 1,000,000,000,000,000 WEI)
        this.valueInput = new ValueInput('initial-value-input', {
            label: 'Initial Value',
            hint: '',
            defaultUnit: 'eth',
            minWei: ethers.utils.parseEther('0.001').toString(),
            required: true
        });
        this.valueInput.render();
        // Set default to minimum
        this.valueInput.setValue(ethers.utils.parseEther('0.001').toString());

        // Min donation input (can be 0)
        this.minDonationInput = new ValueInput('min-donation-input', {
            label: 'Min Donation per Message',
            defaultUnit: 'gwei',
            minWei: '0',
            required: true
        });
        this.minDonationInput.render();
        // Set default to 0.001 ETH (1,000,000 GWEI)
        this.minDonationInput.setValue(ethers.utils.parseEther('0.001').toString());
    }

    /**
     * Setup form event handlers
     */
    setupFormHandlers() {
        const form = document.getElementById('create-form');
        if (!form) return;

        const subjectInput = document.getElementById('discussion-subject');
        const bodyInput = document.getElementById('discussion-body');
        const subjectCounter = document.getElementById('subject-counter');
        const bodyCounter = document.getElementById('body-counter');

        // Character counters
        if (subjectInput && subjectCounter) {
            subjectInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                subjectCounter.textContent = `${length}/200`;
            });
        }

        if (bodyInput && bodyCounter) {
            bodyInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                bodyCounter.textContent = `${length}/1000`;
            });
        }

        // Note: Real-time validation disabled - can_create() is expensive
        // Validation will happen on form submit instead

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    /**
     * Validate the initial value
     */
    async validateValue(weiValue, isWei = false) {
        const valueWarning = document.getElementById('value-warning');
        if (!valueWarning) return;

        try {
            const wei = isWei ? ethers.BigNumber.from(weiValue) : ethers.utils.parseEther(weiValue);
            const canCreate = await this.board.canCreate(wei);

            if (!canCreate) {
                const minInactive = await this.board.getMinInactiveValue();
                const minEth = ethers.utils.formatEther(minInactive);
                
                valueWarning.textContent = `⚠️ Board is full. Need > ${parseFloat(minEth).toFixed(4)} ETH to replace lowest inactive discussion.`;
                valueWarning.style.display = 'block';
                return false;
            } else {
                valueWarning.style.display = 'none';
                return true;
            }
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    /**
     * Update minimum value display
     */
    async updateMinValue() {
        const minValueEl = document.getElementById('min-value');
        if (minValueEl) {
            minValueEl.textContent = '0.001 ETH';
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        // Check wallet connection
        if (!this.web3Provider.address) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }

        // Get form values
        const subject = document.getElementById('discussion-subject')?.value.trim();
        const body = document.getElementById('discussion-body')?.value.trim();
        const weiValue = this.valueInput.getWeiValue();
        const maxMessages = document.getElementById('max-messages')?.value;
        const maxMessageLength = document.getElementById('max-message-length')?.value;
        const weiMinDonation = this.minDonationInput.getWeiValue();

        // Validate inputs
        if (!subject) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a subject',
                type: 'warning'
            });
            return;
        }

        if (subject.length > 200) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Subject must be 200 characters or less',
                type: 'warning'
            });
            return;
        }

        if (!body) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a description',
                type: 'warning'
            });
            return;
        }

        if (body.length > 1000) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Description must be 1000 characters or less',
                type: 'warning'
            });
            return;
        }

        if (!weiValue || weiValue.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid value',
                type: 'warning'
            });
            return;
        }

        // Validate max messages
        const maxMessagesNum = parseInt(maxMessages);
        if (!maxMessages || maxMessagesNum < 1 || maxMessagesNum > 1000) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Max messages must be between 1 and 1000',
                type: 'warning'
            });
            return;
        }

        // Validate max message length
        const maxMessageLengthNum = parseInt(maxMessageLength);
        if (!maxMessageLength || maxMessageLengthNum < 1 || maxMessageLengthNum > 500) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Max message length must be between 1 and 500',
                type: 'warning'
            });
            return;
        }

        // Validate min donation
        if (!weiMinDonation || weiMinDonation.lt(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Minimum donation must be 0 or greater',
                type: 'warning'
            });
            return;
        }

        try {
            // Basic validation - check minimum
            const minWei = ethers.utils.parseEther('0.001');
            if (weiValue.lt(minWei)) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Initial value must be at least 0.001 ETH',
                    type: 'warning'
                });
                return;
            }

            // Disable form
            const submitBtn = document.getElementById('create-submit-btn');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating...';
            }

            // Create discussion
            console.log('Creating discussion:', { 
                subject, 
                body, 
                weiValue: weiValue.toString(), 
                maxMessages: maxMessagesNum, 
                maxMessageLength: maxMessageLengthNum, 
                minDonation: weiMinDonation.toString() 
            });
            await this.board.createAndRegister(
                subject, 
                body, 
                maxMessagesNum,
                maxMessageLengthNum,
                weiMinDonation,
                weiValue
            );

            // Clear form
            document.getElementById('create-form')?.reset();
            document.getElementById('subject-counter').textContent = '0/200';
            document.getElementById('body-counter').textContent = '0/1000';
            this.valueInput.reset();
            this.minDonationInput.setValue(ethers.utils.parseEther('0.001').toString());

            // Show success
            eventBus.emit(EVENTS.TOAST, {
                message: '🎉 Discussion created successfully!',
                type: 'success'
            });

            // Trigger refresh
            eventBus.emit('DISCUSSION_CREATED');

            // Re-enable form
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }

        } catch (error) {
            console.error('Failed to create discussion:', error);
            
            let errorMessage = 'Failed to create discussion';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds';
            }

            eventBus.emit(EVENTS.TOAST, {
                message: errorMessage,
                type: 'error'
            });

            // Re-enable form
            const submitBtn = document.getElementById('create-submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Discussion';
            }
        }
    }
}

