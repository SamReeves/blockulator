/**
 * LazySusan3D Component - CSS 3D Transform Rotating Platform
 * A rotating lazy susan (turntable) that displays three items and allows selection
 * Perfect for Satan, Moloch, and Baal!
 */

export class LazySusan3D {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.items = options.items || []; // Array of {emoji, name, color, subtitle}
        this.selectedIndex = null;
        this.onSelect = options.onSelect || (() => {});
        
        // Rotation state - starts at neutral position
        this.currentRotationY = 0;
        this.isAnimating = false;
        
        // Each item is positioned 120 degrees apart (360/3)
        this.itemPositions = [
            { angle: 0, index: 0 },      // Front center
            { angle: 120, index: 1 },    // Back right
            { angle: 240, index: 2 }     // Back left
        ];
        
        this.platformElement = null;
        this.sceneElement = null;
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
        this.sceneElement = container.querySelector('.lazy-susan-scene');
        this.platformElement = container.querySelector('.lazy-susan-platform');
        
        this.attachEventListeners();
        this.updateRotation();
        
        // Start with a gentle continuous rotation
        this.startIdleRotation();
    }
    
    getHTML() {
        return `
            <div class="lazy-susan-scene">
                <div class="lazy-susan-platform">
                    ${this.items.map((item, index) => this.createItem(item, index)).join('')}
                    
                    <!-- Pentagram Base -->
                    <div class="lazy-susan-pentagram">
                        <svg viewBox="0 0 200 200" width="180" height="180">
                            <defs>
                                <filter id="pentagram-glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <!-- Pentagram star -->
                            <path d="M 100 20 L 115 75 L 175 75 L 125 110 L 145 165 L 100 130 L 55 165 L 75 110 L 25 75 L 85 75 Z" 
                                  fill="none" 
                                  stroke="#ef4444" 
                                  stroke-width="3" 
                                  filter="url(#pentagram-glow)"
                                  opacity="0.8"/>
                            <!-- Inner circle -->
                            <circle cx="100" cy="100" r="35" 
                                    fill="none" 
                                    stroke="#dc2626" 
                                    stroke-width="2" 
                                    opacity="0.6"/>
                        </svg>
                    </div>
                    
                    <!-- Fire emoji rising from center -->
                    <div class="lazy-susan-fire">🔥</div>
                </div>
            </div>
            
            <!-- Arrow Controls -->
            <div class="lazy-susan-controls">
                <button class="lazy-susan-arrow lazy-susan-arrow-left" id="lazy-susan-prev" title="Rotate Left">
                    <span>◀</span>
                </button>
                <button class="lazy-susan-select-btn" id="lazy-susan-select" title="Vote for Selected Demon">
                    <span id="lazy-susan-current-emoji" style="font-size: 2rem;">😈</span>
                    <span id="lazy-susan-current-name" style="font-size: 1rem; font-weight: bold;">SATAN</span>
                    <span style="font-size: 0.875rem;">VOTE NOW</span>
                </button>
                <button class="lazy-susan-arrow lazy-susan-arrow-right" id="lazy-susan-next" title="Rotate Right">
                    <span>▶</span>
                </button>
            </div>
        `;
    }
    
    createItem(item, index) {
        const angle = this.itemPositions[index].angle;
        const color = item.color;
        
        return `
            <div class="lazy-susan-item" 
                 data-index="${index}" 
                 data-angle="${angle}"
                 style="
                    --item-angle: ${angle}deg;
                    --item-color: ${color};
                    transform: rotateY(${angle}deg) translateZ(150px);
                 ">
                <div class="lazy-susan-item-content" style="background: linear-gradient(135deg, ${color}dd 0%, ${color}aa 100%);">
                    <div class="lazy-susan-emoji">${item.emoji}</div>
                    <div class="lazy-susan-name">${item.name}</div>
                    ${item.subtitle ? `<div class="lazy-susan-subtitle">${item.subtitle}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        // Arrow buttons
        const prevBtn = document.getElementById('lazy-susan-prev');
        const nextBtn = document.getElementById('lazy-susan-next');
        const selectBtn = document.getElementById('lazy-susan-select');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.rotatePrevious());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.rotateNext());
        }
        
        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.confirmSelection());
        }
        
        // Keyboard accessibility
        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDownBound);
        
        // Set initial selection
        this.selectedIndex = 0;
        this.updateSelectionDisplay();
    }
    
    handleKeyDown(e) {
        // Arrow keys to rotate
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.rotatePrevious();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.rotateNext();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.confirmSelection();
        }
        // Allow direct selection via keyboard 1, 2, 3
        const num = parseInt(e.key);
        if (num >= 1 && num <= this.items.length) {
            this.selectItem(num - 1);
        }
    }
    
    rotatePrevious() {
        this.stopIdleRotation();
        this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
        this.rotateToSelected(false); // false = rotate counter-clockwise
    }
    
    rotateNext() {
        this.stopIdleRotation();
        this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        this.rotateToSelected(true); // true = rotate clockwise
    }
    
    rotateToSelected(clockwise = true) {
        if (!this.isAnimating) {
            this.isAnimating = true;
            
            // Continuous rotation - always move in the specified direction
            if (clockwise) {
                this.currentRotationY -= 120; // Rotate 120 degrees clockwise (360/3)
            } else {
                this.currentRotationY += 120; // Rotate 120 degrees counter-clockwise
            }
            
            // Add smooth transition
            this.platformElement.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            this.updateRotation();
            
            // Update the selection display
            this.updateSelectionDisplay();
            
            setTimeout(() => {
                if (this.platformElement) {
                    this.platformElement.style.transition = '';
                    this.isAnimating = false;
                }
            }, 600);
        }
    }
    
    updateSelectionDisplay() {
        const currentItem = this.items[this.selectedIndex];
        const emojiEl = document.getElementById('lazy-susan-current-emoji');
        const nameEl = document.getElementById('lazy-susan-current-name');
        
        if (emojiEl) emojiEl.textContent = currentItem.emoji;
        if (nameEl) nameEl.textContent = currentItem.name;
        
        // Update button color
        const selectBtn = document.getElementById('lazy-susan-select');
        if (selectBtn) {
            selectBtn.style.background = `linear-gradient(135deg, ${currentItem.color}dd 0%, ${currentItem.color}aa 100%)`;
        }
    }
    
    confirmSelection() {
        // Trigger the callback
        this.onSelect(this.selectedIndex, this.items[this.selectedIndex]);
    }
    
    startIdleRotation() {
        // Gentle bobbing animation when idle
        let bobDirection = 1;
        let bobAmount = 0;
        this.idleInterval = setInterval(() => {
            if (!this.isAnimating) {
                bobAmount += 0.3 * bobDirection;
                if (Math.abs(bobAmount) > 3) {
                    bobDirection *= -1;
                }
                // Subtle tilt variation
                if (this.platformElement) {
                    const baseX = -15;
                    this.platformElement.style.transform = 
                        `rotateX(${baseX + bobAmount}deg) rotateY(${this.currentRotationY}deg)`;
                }
            }
        }, 50);
    }
    
    stopIdleRotation() {
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;
        }
    }
    
    updateRotation() {
        if (this.platformElement) {
            this.platformElement.style.transform = 
                `rotateX(-15deg) rotateY(${this.currentRotationY}deg)`;
            
            // Counter-rotate all item contents to keep them facing forward
            const items = this.platformElement.querySelectorAll('.lazy-susan-item');
            items.forEach(item => {
                const itemAngle = parseFloat(item.dataset.angle) || 0;
                const content = item.querySelector('.lazy-susan-item-content');
                if (content) {
                    // Counter-rotate: subtract the platform rotation and the item's position
                    content.style.transform = `rotateY(${-itemAngle - this.currentRotationY}deg)`;
                }
            });
        }
    }
    
    selectItem(index) {
        if (index < 0 || index >= this.items.length) return;
        
        // Stop idle rotation
        this.stopIdleRotation();
        
        // Calculate direction for direct selection (shortest path)
        const currentIndex = this.selectedIndex;
        this.selectedIndex = index;
        
        // Find shortest rotation direction
        const diff = (index - currentIndex + this.items.length) % this.items.length;
        const clockwise = diff <= this.items.length / 2;
        
        // Rotate the required number of steps
        const steps = clockwise ? diff : this.items.length - diff;
        const stepAngle = clockwise ? -120 : 120;
        this.currentRotationY += stepAngle * steps;
        
        this.isAnimating = true;
        this.platformElement.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.updateRotation();
        this.updateSelectionDisplay();
        
        setTimeout(() => {
            if (this.platformElement) {
                this.platformElement.style.transition = '';
                this.isAnimating = false;
            }
        }, 600);
    }
    
    getSelectedIndex() {
        return this.selectedIndex;
    }
    
    getSelectedItem() {
        return this.selectedIndex !== null ? this.items[this.selectedIndex] : null;
    }
    
    reset() {
        this.selectedIndex = 0;
        // Don't reset rotation - maintain continuous rotation state
        this.updateSelectionDisplay();
        
        // Restart idle rotation
        if (!this.idleInterval) {
            this.startIdleRotation();
        }
    }
    
    destroy() {
        this.stopIdleRotation();
        
        // Cleanup event listeners
        if (this.handleKeyDownBound) {
            document.removeEventListener('keydown', this.handleKeyDownBound);
        }
        
        const prevBtn = document.getElementById('lazy-susan-prev');
        const nextBtn = document.getElementById('lazy-susan-next');
        const selectBtn = document.getElementById('lazy-susan-select');
        
        if (prevBtn) prevBtn.replaceWith(prevBtn.cloneNode(true));
        if (nextBtn) nextBtn.replaceWith(nextBtn.cloneNode(true));
        if (selectBtn) selectBtn.replaceWith(selectBtn.cloneNode(true));
    }
}

