/**
 * Confetti Animation System
 * Simple pixel confetti rain effect
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

class ConfettiParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = -20;
        this.size = Math.random() < 0.5 ? 2 : 3; // Either 2px or 3px (crisp integers)
        this.speedY = Math.random() * 1 + 0.5; // Slower: 0.5-1.5 pixels per frame
        this.speedX = (Math.random() - 0.5) * 1; // Slower horizontal drift
        this.opacity = 1;
        
        // Simple color palette
        const colors = ['#FFD700', '#FF1493', '#00CED1', '#32CD32', '#FF4500', '#9370DB'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.speedY += 0.05; // Less gravity
        this.speedX *= 0.99; // Air resistance
        
        // Fade out near bottom
        if (this.y > this.canvas.height - 100) {
            this.opacity -= 0.02;
        }
        
        return this.y < this.canvas.height && this.opacity > 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        // Use Math.round for crisp integer coordinates
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    }
}

class ConfettiAnimation {
    constructor() {
        this.canvas = document.getElementById('effects-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        
        this.particles = [];
        this.isActive = false;
        this.spawnTimer = 0;
        this.spawnDuration = 3000;
        this.spawnStartTime = 0;
        
        eventBus.on(EVENTS.CONFETTI, () => this.trigger());
    }

    trigger() {
        if (this.isActive) {
            this.spawnStartTime = performance.now();
            return;
        }
        
        this.isActive = true;
        this.spawnStartTime = performance.now();
        this.particles = [];
        this.animate();
    }

    animate() {
        if (!this.isActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Spawn particles slower
        const timeSinceStart = performance.now() - this.spawnStartTime;
        if (timeSinceStart < this.spawnDuration) {
            this.spawnTimer++;
            if (this.spawnTimer > 2) { // Every 3 frames
                for (let i = 0; i < 8; i++) { // Fewer particles at once
                    this.particles.push(new ConfettiParticle(this.canvas));
                }
                this.spawnTimer = 0;
            }
        }
        
        // Update and draw
        this.particles = this.particles.filter(p => {
            const alive = p.update();
            if (alive) p.draw(this.ctx);
            return alive;
        });
        
        if (this.particles.length > 0 || timeSinceStart < this.spawnDuration) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isActive = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

let confettiInstance = null;

export function initConfetti() {
    if (!confettiInstance) confettiInstance = new ConfettiAnimation();
    return confettiInstance;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfetti);
} else {
    initConfetti();
}

