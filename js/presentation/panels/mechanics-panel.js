/**
 * Mechanics Panel Component
 * Renders collapsible documentation about how the discussion board works
 */

export class MechanicsPanel {
    constructor() {
        this.containerElement = null;
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Render the panel
     */
    render() {
        if (!this.containerElement) {
            console.error('Container element not set');
            return;
        }

        this.containerElement.innerHTML = `
            <details class="info-panel mechanics-panel">
                <summary class="panel-summary">
                    <span class="panel-icon">📖</span>
                    <span class="panel-title">How It Works</span>
                    <span class="panel-arrow">▼</span>
                </summary>
                
                <div class="panel-content">
                    <div class="mechanics-grid">
                        <!-- Board Mechanics -->
                        <div class="mechanics-section">
                            <h3>🎯 Discussion Board</h3>
                            <ul>
                                <li><strong>Capacity:</strong> Up to 100 discussions can exist on the board</li>
                                <li><strong>Creation:</strong> Anyone can create a discussion with a minimum initial value (0.0001 ETH)</li>
                                <li><strong>Board Fee:</strong> 10% of initial value goes to board treasury</li>
                                <li><strong>Cooldown:</strong> 5 minutes between creating discussions per address</li>
                                <li><strong>Active vs Inactive:</strong> Discussions become "stale" after 7 days of no activity</li>
                            </ul>
                        </div>

                        <!-- Message Mechanics -->
                        <div class="mechanics-section">
                            <h3>💬 Messages</h3>
                            <ul>
                                <li><strong>Posting:</strong> Each message requires a donation (set by discussion creator)</li>
                                <li><strong>Capacity:</strong> Each discussion has a configurable max messages (1-1000)</li>
                                <li><strong>Replacement:</strong> When full, higher donations replace the lowest donation message</li>
                                <li><strong>Pool Growth:</strong> All donations (including from evicted messages) stay in the pool</li>
                                <li><strong>Cooldown:</strong> 1 minute between posting messages per address</li>
                                <li><strong>Boosting:</strong> Anyone can "splash" ETH on existing messages to protect them from eviction</li>
                            </ul>
                        </div>

                        <!-- Economic Model -->
                        <div class="mechanics-section">
                            <h3>💰 Economics</h3>
                            <ul>
                                <li><strong>Pool:</strong> All donations accumulate in the discussion's pool</li>
                                <li><strong>Survivors:</strong> Message authors with messages still in the discussion at termination</li>
                                <li><strong>Payouts:</strong> When terminated, pool splits equally among unique surviving authors</li>
                                <li><strong>Strategy:</strong> Post valuable content with competitive donations, or boost others' messages</li>
                                <li><strong>Risk:</strong> If your message is evicted, your donation stays in the pool (becomes prize money)</li>
                            </ul>
                        </div>

                        <!-- Termination Rules -->
                        <div class="mechanics-section">
                            <h3>⚫ Termination</h3>
                            <ul>
                                <li><strong>Inactivity:</strong> Any discussion inactive for 7+ days can be terminated by anyone</li>
                                <li><strong>Replacement:</strong> When board is full, new discussions can replace terminated ones</li>
                                <li><strong>Cost to Replace:</strong> New discussion must have higher initial value than lowest inactive</li>
                                <li><strong>Distribution:</strong> On termination, pool is split among surviving message authors</li>
                                <li><strong>Permanent:</strong> Once terminated, a discussion cannot be reactivated</li>
                            </ul>
                        </div>

                        <!-- Game Theory -->
                        <div class="mechanics-section">
                            <h3>🎮 Game Theory</h3>
                            <ul>
                                <li><strong>Quality Signal:</strong> Donations serve as proof of conviction in your message</li>
                                <li><strong>Curation:</strong> Economic pressure naturally filters low-quality content</li>
                                <li><strong>Skin in the Game:</strong> Everyone has ETH at stake, aligning incentives</li>
                                <li><strong>Collaborative:</strong> Boosting others' messages helps them (and you) survive</li>
                                <li><strong>Self-Organizing:</strong> No admins, no moderation - pure algorithmic curation</li>
                            </ul>
                        </div>

                        <!-- Configuration -->
                        <div class="mechanics-section">
                            <h3>⚙️ Discussion Configuration</h3>
                            <p>Discussion creators can customize:</p>
                            <ul>
                                <li><strong>Max Messages:</strong> 1-1000 message slots</li>
                                <li><strong>Max Message Length:</strong> 1-500 characters per message</li>
                                <li><strong>Min Donation:</strong> Minimum ETH required to post (can be 0)</li>
                            </ul>
                            <p class="note">
                                💡 These settings are <strong>immutable</strong> once the discussion is created.
                            </p>
                        </div>
                    </div>

                    <!-- Quick Reference -->
                    <div class="quick-reference">
                        <h3>⚡ Quick Reference</h3>
                        <div class="reference-grid">
                            <div class="reference-item">
                                <strong>Board Limit:</strong> 100 discussions
                            </div>
                            <div class="reference-item">
                                <strong>Min Initial Value:</strong> 0.0001 ETH
                            </div>
                            <div class="reference-item">
                                <strong>Board Fee:</strong> 10%
                            </div>
                            <div class="reference-item">
                                <strong>Inactivity Threshold:</strong> 7 days
                            </div>
                            <div class="reference-item">
                                <strong>Creation Cooldown:</strong> 5 minutes
                            </div>
                            <div class="reference-item">
                                <strong>Message Cooldown:</strong> 1 minute
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        `;

        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const details = this.containerElement.querySelector('details');
        if (details) {
            details.addEventListener('toggle', () => {
                const arrow = details.querySelector('.panel-arrow');
                if (arrow) {
                    arrow.textContent = details.open ? '▲' : '▼';
                }
            });
        }
    }
}

