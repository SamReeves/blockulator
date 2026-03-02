/**
 * DiceThreeD Component - CSS 3D Transform Die
 * A draggable 3D die that snaps to show the selected face
 */

export class DiceThreeD {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.selectedFace = null;
        this.onSelect = options.onSelect || (() => {});
        
        // Rotation state
        this.currentRotation = { x: -30, y: 45 }; // Initial tilt for visibility
        this.isAnimating = false; // Prevent overlapping animations
        
        // Face rotation configurations (degrees)
        // Shows each number facing forward
        this.faceRotations = {
            1: { x: 0, y: -90 },     // Left face
            2: { x: 0, y: 90 },      // Right face  
            3: { x: -90, y: 0 },     // Top face
            4: { x: 90, y: 0 },      // Bottom face
            5: { x: 0, y: 0 },       // Front face
            6: { x: 0, y: 180 }      // Back face
        };
        
        // Face colors matching dice-gods theme
        this.faceColors = {
            1: '#ef4444',
            2: '#f59e0b', 
            3: '#10b981',
            4: '#3b82f6',
            5: '#8b5cf6',
            6: '#ec4899'
        };
        
        this.dieElement = null;
        this.sceneElement = null;
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
        this.sceneElement = container.querySelector('.dice-scene');
        this.dieElement = container.querySelector('.die-cube');
        
        this.attachEventListeners();
        this.updateRotation();
    }
    
    getHTML() {
        return `
            <div class="dice-scene">
                <div class="die-cube">
                    ${this.createFace(1, 'die-face-1')}
                    ${this.createFace(2, 'die-face-2')}
                    ${this.createFace(3, 'die-face-3')}
                    ${this.createFace(4, 'die-face-4')}
                    ${this.createFace(5, 'die-face-5')}
                    ${this.createFace(6, 'die-face-6')}
                </div>
            </div>
        `;
    }
    
    createFace(number, className) {
        const color = this.faceColors[number];
        const dots = this.createDotPattern(number);
        
        return `
            <div class="die-face ${className}" data-number="${number}" style="background: linear-gradient(135deg, ${color}dd 0%, ${color}aa 100%);">
                <div class="die-face-content">
                    ${dots}
                </div>
            </div>
        `;
    }
    
    createDotPattern(number) {
        // Create traditional die dot patterns
        const dotHTML = '<span class="die-dot"></span>';
        const patterns = {
            1: '<div class="dot-center">' + dotHTML + '</div>',
            2: '<div class="dot-two-opposite">' + dotHTML + dotHTML + '</div>',
            3: '<div class="dot-three-diagonal">' + dotHTML + dotHTML + dotHTML + '</div>',
            4: '<div class="dot-four-corners">' + dotHTML.repeat(4) + '</div>',
            5: '<div class="dot-five-quincunx">' + dotHTML.repeat(5) + '</div>',
            6: '<div class="dot-six-columns">' + dotHTML.repeat(6) + '</div>'
        };
        return patterns[number] || '';
    }
    
    attachEventListeners() {
        // No interactive event listeners needed - die is display only
    }
    
    updateRotation() {
        if (this.dieElement) {
            this.dieElement.style.transform = 
                `rotateX(${this.currentRotation.x}deg) rotateY(${this.currentRotation.y}deg)`;
        }
    }
    
    selectFace(faceNumber) {
        if (faceNumber < 1 || faceNumber > 6) return;
        
        // Allow selection even during animation, but set flag
        this.isAnimating = true;
        this.selectedFace = faceNumber;
        
        // Set exact rotation for this face (lock it in)
        const targetRotation = this.faceRotations[faceNumber];
        this.currentRotation.x = targetRotation.x;
        this.currentRotation.y = targetRotation.y;
        
        // Add transition for smooth snap
        this.dieElement.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.updateRotation();
        
        // Remove transition after animation and ensure rotation is locked
        setTimeout(() => {
            if (this.dieElement) {
                this.dieElement.style.transition = '';
                // Double-check the rotation is exactly correct
                this.currentRotation.x = targetRotation.x;
                this.currentRotation.y = targetRotation.y;
                this.updateRotation();
                this.isAnimating = false;
            }
        }, 600);
        
        // Update UI
        this.highlightSelectedFace();
        
        // Trigger callback
        this.onSelect(faceNumber);
    }
    
    highlightSelectedFace() {
        // Remove previous highlights
        const faces = this.sceneElement.querySelectorAll('.die-face');
        faces.forEach(face => face.classList.remove('selected'));
        
        // Highlight selected (after rotation completes)
        setTimeout(() => {
            const selectedFaceEl = this.sceneElement.querySelector(`[data-number="${this.selectedFace}"]`);
            if (selectedFaceEl) {
                selectedFaceEl.classList.add('selected');
            }
        }, 600);
    }
    
    getSelectedFace() {
        return this.selectedFace;
    }
    
    rotateTo(faceNumber) {
        this.selectFace(faceNumber);
    }
    
    destroy() {
        // No event listeners to clean up
    }
}

