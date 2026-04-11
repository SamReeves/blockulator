/**
 * Celebration effect — uses SDR particle system (burst around anchor, gravity 5s, release).
 * Replaces old confetti with unified particle canvas.
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { celebrationBurst } from './sdr-particles-bg.js';

function triggerCelebration() {
    const anchor = document.querySelector('.app-header') || document.body;
    celebrationBurst(anchor, 800);
}

export function initConfetti() {
    eventBus.on(EVENTS.CONFETTI, triggerCelebration);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfetti);
} else {
    initConfetti();
}
