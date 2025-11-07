/**
 * Post Message Form Component
 * Handles message posting to discussions
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class PostMessageForm {
    constructor(discussion, web3Provider, discussionData) {
        this.discussion = discussion;
        this.web3Provider = web3Provider;
        this.discussionData = discussionData;
        this.containerElement = null;
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Render the form
     */
    render() {
        if (!this.containerElement) {
            console.error('Container element not set');
            return;
        }

        const minDonation = ethers.utils.formatEther(this.discussionData.minDonation);
        const minDonationFormatted = parseFloat(minDonation).toFixed(4);

        this.containerElement.innerHTML = `
            <form id="post-message-form" class="message-form">
                <h3 class="form-title">Post Your Message</h3>
                
                <div class="form-group">
                    <label for="message-content">
                        Message Content
                        <span class="char-counter" id="message-char-counter">
                            0/${this.discussionData.maxMessageLength}
                        </span>
                    </label>
                    <textarea 
                        id="message-content" 
                        name="content" 
                        placeholder="Enter your message..."
                        maxlength="${this.discussionData.maxMessageLength}"
                        rows="4"
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="message-donation">
                        Donation (ETH)
                        <span class="hint">Min: ${minDonationFormatted} ETH</span>
                    </label>
                    <input 
                        type="number" 
                        id="message-donation" 
                        name="donation"
                        placeholder="${minDonationFormatted}"
                        min="${minDonation}"
                        step="0.001"
                        required
                    />
                </div>

                <div class="form-info">
                    <p>
                        💡 <strong>How it works:</strong> 
                        ${this.discussionData.messageCount < this.discussionData.maxMessages 
                            ? `Your message will be added to the discussion (${this.discussionData.messageCount}/${this.discussionData.maxMessages} slots used).`
                            : `Discussion is full! Your donation must exceed the lowest to replace it.`
                        }
                    </p>
                    ${this.discussionData.messageCount >= this.discussionData.maxMessages ? `
                        <p class="warning">
                            ⚠️ When replaced, the evicted message's donation stays in the pool as prize money!
                        </p>
                    ` : ''}
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-submit" id="submit-message-btn">
                        Send Message
                    </button>
                </div>
            </form>
        `;

        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Character counter
        const textarea = this.containerElement.querySelector('#message-content');
        const counter = this.containerElement.querySelector('#message-char-counter');
        
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                const length = textarea.value.length;
                counter.textContent = `${length}/${this.discussionData.maxMessageLength}`;
                
                // Visual feedback when approaching limit
                if (length > this.discussionData.maxMessageLength * 0.9) {
                    counter.style.color = '#f59e0b';
                } else {
                    counter.style.color = '';
                }
            });
        }

        // Form submission
        const form = this.containerElement.querySelector('#post-message-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSubmit(e);
            });
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        const formData = new FormData(e.target);
        const content = formData.get('content');
        const donation = formData.get('donation');

        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }

        // Validate
        if (!content || content.trim().length === 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Message content cannot be empty',
                type: 'error'
            });
            return;
        }

        if (!donation || parseFloat(donation) < parseFloat(ethers.utils.formatEther(this.discussionData.minDonation))) {
            eventBus.emit(EVENTS.TOAST, {
                message: `Donation must be at least ${ethers.utils.formatEther(this.discussionData.minDonation)} ETH`,
                type: 'error'
            });
            return;
        }

        try {
            const donationWei = ethers.utils.parseEther(donation);
            
            // Disable submit button
            const submitBtn = this.containerElement.querySelector('#submit-message-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Posting...';
            }

            eventBus.emit(EVENTS.TOAST, {
                message: 'Posting message...',
                type: 'info'
            });

            await this.discussion.postMessage(content, donationWei);

            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Message posted successfully!',
                type: 'success'
            });

            // Reset form
            e.target.reset();
            
            // Update character counter
            const counter = this.containerElement.querySelector('#message-char-counter');
            if (counter) {
                counter.textContent = `0/${this.discussionData.maxMessageLength}`;
            }

            // Emit event to refresh parent view
            eventBus.emit('MESSAGE_POSTED');

        } catch (error) {
            console.error('Failed to post message:', error);
            
            let errorMessage = 'Failed to post message';
            if (error.message) {
                if (error.message.includes('Donation below minimum')) {
                    errorMessage = 'Donation is below the minimum required';
                } else if (error.message.includes('Donation too low to replace')) {
                    errorMessage = 'Discussion is full - your donation must be higher than the lowest message';
                } else if (error.message.includes('Message cooldown active')) {
                    errorMessage = 'Please wait before posting another message';
                } else if (error.message.includes('Discussion terminated')) {
                    errorMessage = 'This discussion has been terminated';
                } else {
                    errorMessage = error.message;
                }
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: errorMessage,
                type: 'error'
            });

        } finally {
            // Re-enable submit button
            const submitBtn = this.containerElement.querySelector('#submit-message-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        }
    }
}

