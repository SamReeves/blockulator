/**
 * Message Board - Minimalist
 * Pay to post messages on-chain
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { MessageFeed } from '../../presentation/components/message-feed.js';
import { getTemplate } from './templates/message-board.tpl.js';

export class MessageBoard extends Game {
    static metadata = {
        id: 'message-board',
        title: 'Message Board',
        emoji: '💬',
        description: 'Permanent on-chain messages',
        color: '#3b82f6',
        contract: {
            source: 'contracts/src/games/message_board.vy',
            abi: 'contracts/build/abis/message-board.json',
            addresses: {
                sepolia: '0xE93Ac949Fe806d8b1cA93EB14e5f4d799cAc0d55',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const messageCount = await contract.get_message_count();
        return { messageCount };
    }

    constructor() {
        super();
        this.feeInput = null;
        this.messageFeed = null;
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: this.metadata.color
        });
    }

    initComponents() {
        this.messageFeed = new MessageFeed('message-feed-container', {
            maxVisible: 10,
            currentAddress: this.web3Provider?.currentAddress
        });
        this.messageFeed.init();
    }

    bindListeners() {
        super.bindListeners();
        
        const content = document.getElementById('msg-content');
        const charCount = document.getElementById('char-count');
        
        if (content && charCount) {
            content.addEventListener('input', () => {
                charCount.textContent = content.value.length;
            });
        }
        
        this.feeInput = this.createValueInput('msg-fee-input', {
            label: 'Fee',
            hint: 'Minimum fee set by contract',
            minWei: '0'
        });
    }

    getListeners() {
        return {
            'post-btn': () => this.post()
        };
    }

    async post() {
        if (!this.requiresWallet('post messages')) return;
        
        const content = document.getElementById('msg-content').value.trim();
        const fee = this.feeInput.getWeiValue();
        
        if (!content) {
            this.toast('Please enter a message', 'warning');
            return;
        }
        
        if (!fee || fee.lte(0)) {
            this.toast('Please enter a fee', 'warning');
            return;
        }
        
        try {
            await this.transactionHandler.execute(
                this.contract.post_message(content, { value: fee }),
                { game: 'message-board', message: content, fee: fee.toString() },
                (isLoading) => this.setButtonState('post-btn', isLoading, '⏳ Posting...', '💬 Post')
            );
            
            document.getElementById('msg-content').value = '';
            this.feeInput.reset();
            document.getElementById('char-count').textContent = '0';
            
            await this.refreshState();
            
        } catch (error) {
            console.error('Post failed:', error);
        }
    }

    async fetchAndRenderState() {
        const [count, total, minFee, rateLimit] = await Promise.all([
            this.contract.get_message_count(),
            this.contract.total_collected(),
            this.contract.minimum_post_fee(),
            this.contract.rate_limit_seconds()
        ]);
        
        const badge = document.getElementById('msg-count-badge');
        if (badge) badge.textContent = count.toString();
        
        const minFeeWei = minFee.toString();
        this.dom.updateInfo('min-fee', this.dom.formatWei(minFee));
        
        if (this.feeInput && minFee) {
            this.feeInput.setMinimum(minFeeWei);
            this.feeInput.setValue(minFeeWei);
        }
        
        if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
            const waitTime = await this.contract.get_time_until_next_post(this.web3Provider.currentAddress);

            const wait = waitTime.toNumber();
            this.dom.updateInfo('wait-time', wait === 0 ? 'Now ✅' : `${wait}s ⏳`);
        } else {
            this.dom.updateInfo('wait-time', 'Connect wallet');
        }
        
        await this.loadMessages(count.toNumber());
    }

    async loadMessages(msgCount) {
        if (!this.messageFeed) return;
        
        if (msgCount === 0) {
            this.messageFeed.setMessages([]);
            return;
        }
        
        try {
            const recent = Math.min(msgCount, 20);
            const messages = await this.contract.get_recent_messages(recent);
            
            this.messageFeed.updateCurrentAddress(this.web3Provider?.currentAddress);
            this.messageFeed.setMessages(messages);
            
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.messageFeed.setMessages([]);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('MessagePosted', async (poster, messageId, amount, content) => {
            if (this.messageFeed) {
                this.messageFeed.addMessage({
                    poster,
                    content,
                    amount,
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }
            
            await this.refreshState();
            
            if (this.isCurrentUser(poster)) {
                this.toast('Message posted successfully', 'success');
            }
        });
    }
}
