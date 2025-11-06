/**
 * Confetti Animation System
 * Creates a metallic glittery pixel confetti rain effect
 */

import { eventBus, EVENTS } from './events.js';

class ConfettiParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        // Random starting position across the width
        this.x = Math.random() * this.canvas.width;
        this.y = -20;
        
        // Particle properties - smaller!
        this.size = Math.random() * 4 + 2; // 2-6px squares (smaller)
        this.speedY = Math.random() * 3 + 2; // Fall speed
        this.speedX = (Math.random() - 0.5) * 2; // Horizontal drift
        this.opacity = 1;
        
        // More metallic glittery colors!
        const colors = [
            { base: '#C0C0C0', highlight: '#F0F0F0', name: 'silver' },      // Silver
            { base: '#FFD700', highlight: '#FFED4E', name: 'gold' },        // Gold
            { base: '#CD7F32', highlight: '#E89B4E', name: 'bronze' },      // Bronze
            { base: '#E8E8E8', highlight: '#FFFFFF', name: 'chrome' },      // Chrome
            { base: '#B8860B', highlight: '#FFD700', name: 'darkgold' },    // Dark gold
            { base: '#A0A0A0', highlight: '#D0D0D0', name: 'lightsilver' }, // Light silver
            { base: '#FF1493', highlight: '#FF69B4', name: 'pink' },        // Hot pink
            { base: '#00CED1', highlight: '#00FFFF', name: 'cyan' },        // Cyan
            { base: '#9370DB', highlight: '#BA55D3', name: 'purple' },      // Purple
            { base: '#FF4500', highlight: '#FF6347', name: 'orange' },      // Orange red
            { base: '#32CD32', highlight: '#7FFF00', name: 'lime' },        // Lime green
            { base: '#1E90FF', highlight: '#87CEEB', name: 'blue' },        // Dodger blue
            { base: '#FF69B4', highlight: '#FFB6C1', name: 'lightpink' },   // Light pink
            { base: '#FFD700', highlight: '#FFA500', name: 'amber' },       // Amber
            { base: '#40E0D0', highlight: '#AFEEEE', name: 'turquoise' },   // Turquoise
            { base: '#EE82EE', highlight: '#DDA0DD', name: 'violet' }       // Violet
        ];
        
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // White flash effect
        this.flashPhase = Math.random() * Math.PI * 2;
        this.flashSpeed = Math.random() * 0.15 + 0.1;
    }

    update(deltaTime) {
        // Update position
        this.y += this.speedY;
        this.x += this.speedX;
        
        // Update white flash
        this.flashPhase += this.flashSpeed;
        
        // Gravity and air resistance - stronger gravity!
        this.speedY += 0.2;
        this.speedX *= 0.99;
        
        // Fade out near bottom
        if (this.y > this.canvas.height - 100) {
            this.opacity -= 0.02;
        }
        
        // Check if off screen
        return this.y < this.canvas.height && this.opacity > 0;
    }

    draw(ctx) {
        ctx.save();
        
        // Move to particle position (no rotation)
        ctx.translate(this.x, this.y);
        
        // White flash intensity (pulsing)
        const flashIntensity = Math.sin(this.flashPhase) * 0.5 + 0.5;
        
        // Draw main square
        if (flashIntensity > 0.6) {
            // Flash white!
            ctx.fillStyle = '#FFFFFF';
        } else {
            // Draw with gradient for metallic look
            const gradient = ctx.createLinearGradient(
                -this.size / 2, -this.size / 2, 
                this.size / 2, this.size / 2
            );
            
            gradient.addColorStop(0, this.color.highlight);
            gradient.addColorStop(0.5, this.color.base);
            gradient.addColorStop(1, this.color.highlight);
            
            ctx.fillStyle = gradient;
        }
        
        ctx.globalAlpha = this.opacity;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        ctx.restore();
    }
}

class ConfettiAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.isActive = false;
        this.animationId = null;
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnDuration = 3000; // Spawn confetti for 3 seconds
        this.spawnStartTime = 0;
        
        this.init();
    }

    init() {
        // Get the effects canvas from the DOM
        this.canvas = document.getElementById('effects-canvas');
        if (!this.canvas) {
            console.error('Effects canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Listen for confetti event
        eventBus.on(EVENTS.CONFETTI, () => {
            this.trigger();
        });
        
        console.log('✨ Confetti animation system initialized');
    }

    trigger() {
        console.log('🎉 Triggering confetti!');
        
        if (this.isActive) {
            // Already running, extend the duration
            this.spawnStartTime = performance.now();
            return;
        }
        
        this.isActive = true;
        this.spawnStartTime = performance.now();
        this.particles = [];
        
        // Start animation loop
        this.animate(performance.now());
    }

    spawnParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new ConfettiParticle(this.canvas));
        }
    }

    animate(currentTime) {
        if (!this.isActive) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Spawn new particles during spawn duration
        const timeSinceStart = currentTime - this.spawnStartTime;
        if (timeSinceStart < this.spawnDuration) {
            // Spawn particles continuously - MORE particles!
            this.spawnTimer += deltaTime;
            if (this.spawnTimer > 30) { // Spawn every 30ms (faster)
                this.spawnParticles(15); // 15 particles at a time (3x more!)
                this.spawnTimer = 0;
            }
        }
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            const isAlive = particle.update(deltaTime);
            if (isAlive) {
                particle.draw(this.ctx);
            }
            return isAlive;
        });
        
        // Continue animation if there are particles or still spawning
        if (this.particles.length > 0 || timeSinceStart < this.spawnDuration) {
            this.animationId = requestAnimationFrame((time) => this.animate(time));
        } else {
            this.stop();
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Create singleton instance
let confettiInstance = null;

export function initConfetti() {
    if (!confettiInstance) {
        confettiInstance = new ConfettiAnimation();
    }
    return confettiInstance;
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initConfetti();
    });
} else {
    initConfetti();
}

