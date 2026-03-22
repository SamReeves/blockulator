/**
 * Message Board Template
 * HTML template for the Message Board game UI
 */

export function getTemplate(config = {}) {
    const { panelColor = '#3b82f6', btnColor = '#3b82f6' } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="flex-between" style="margin-bottom: 0.75rem;">
                    <h3 class="game-panel-header">
                        <span>💬</span>
                        <span>Message Board</span>
                    </h3>
                    <div style="font-size: 0.75rem;">
                        <span id="msg-count-badge">0</span> posts
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start;">
                    <div class="min-w-0">
                        <textarea 
                            id="msg-content"
                            placeholder="Write something permanent..."
                            maxlength="280"
                            rows="3"
                            style="width: 100%; padding: 0.75rem; background: var(--md-sys-color-surface); border: 2px solid ${panelColor}; border-radius: 6px; color: var(--md-sys-color-on-surface); font-size: 0.9rem; resize: vertical; font-family: inherit; margin-bottom: 0.5rem;"
                        ></textarea>
                        <div style="font-size: 0.7rem; opacity: 0.6; text-align: right; margin-bottom: 0.75rem;">
                            <span id="char-count">0</span>/280
                        </div>
                        
                        <div id="msg-fee-input" style="margin-bottom: 0.75rem;"></div>
                        
                        <button id="post-btn" class="btn-action">
                            💬 Post
                        </button>
                        
                        <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.7rem;">
                            <div class="stat-box" style="--stat-color: #10b981;">
                                <div class="stat-box-label">Min Fee</div>
                                <div id="min-fee" class="stat-box-value" style="font-size: 0.75rem;">0 wei</div>
                            </div>
                            <div class="stat-box" style="--stat-color: #8b5cf6;">
                                <div class="stat-box-label">Can Post</div>
                                <div id="wait-time" class="stat-box-value" style="font-size: 0.75rem;">Now</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="min-w-0">
                        <div id="message-feed-container"></div>
                    </div>
                </div>
            </div>

            <details class="contest-info-panel" open>
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📖 How to Post</span>
                </summary>
                <div style="margin-top: 1rem;">
                    <div class="strategy-callout" style="margin-bottom: 1rem;">
                        <strong>💬 Post messages permanently on-chain.</strong> Your message is stored forever in the blockchain.
                    </div>
                    
                    <div style="padding: 1rem; background: color-mix(in srgb, var(--panel-color) 5%, transparent); border-radius: 8px; font-size: 0.85rem;">
                        <strong style="display: block; margin-bottom: 0.5rem;">Rules:</strong>
                        • Maximum 280 characters per message<br>
                        • Minimum fee set by contract (shown above)<br>
                        • Rate limit prevents spam (cooldown between posts)<br>
                        • Messages are permanent and uncensored
                    </div>
                </div>
            </details>
        </div>
    `;
}
