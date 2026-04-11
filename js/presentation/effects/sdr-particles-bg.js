/**
 * SDR particle effects — on-demand only (no ambient background).
 * Vendor copy under vendor/sdr/lib/ (run scripts/sync-sdr.sh to refresh).
 */

import { createParticleSystem } from '../../../vendor/sdr/lib/particles/index.js';

let sharedSystem = null;

function ensureSystem() {
    if (sharedSystem) return sharedSystem;

    const canvas = document.getElementById('sdr-particles-canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return null;

    sharedSystem = createParticleSystem(canvas, { count: 0, size: 1, opacityMult: 0.72 });
    sharedSystem.start();
    return sharedSystem;
}

/**
 * Celebration burst: spawn particles at element, gravity for 5s, then release and fade.
 * @param {HTMLElement} anchor - element to spawn particles around
 * @param {number} [burstCount=800] - how many particles
 */
export function celebrationBurst(anchor, burstCount = 800) {
    const sys = ensureSystem();
    if (!sys) return;

    const canvas = document.getElementById('sdr-particles-canvas');
    const rect = anchor.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 - canvasRect.left;
    const cy = rect.top + rect.height / 2 - canvasRect.top;

    const burstAttractor = { x: cx, y: cy };
    sys.addAttractor(burstAttractor);

    const before = sys.getCount();
    sys.setCount(before + burstCount);

    setTimeout(() => {
        sys.removeAttractor(burstAttractor);
    }, 5000);

    setTimeout(() => {
        sys.setCount(Math.max(0, sys.getCount() - burstCount));
    }, 15000);
}

/**
 * Hover particle stream with multiple attractor nodes.
 * Spawns particles continuously while hovering, using multiple elements as attractors.
 * @param {HTMLElement} triggerElement - element that triggers hover
 * @param {HTMLElement[]} attractorElements - elements to use as attractor nodes
 * @param {number} [intervalMs=50] - spawn interval in ms
 * @param {number} [particlesPerSpawn=1] - particles per interval
 * @param {number} [maxParticles=10000] - max particles, FIFO overwrite when exceeded
 * @param {HTMLElement} [countDisplay=null] - element to display particle count
 */
export function attachHoverParticles(triggerElement, attractorElements = [], intervalMs = 50, particlesPerSpawn = 1, maxParticles = 10000, countDisplay = null) {
    let intervalId = null;
    let attractors = [];
    let spawnedCount = 0;
    let isHovering = false;
    let mouseMoveHandler = null;

    function getElementCenter(el) {
        const canvas = document.getElementById('sdr-particles-canvas');
        if (!canvas) return null;
        const rect = el.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - canvasRect.left,
            y: rect.top + rect.height / 2 - canvasRect.top
        };
    }

    function updateAttractorPositions() {
        attractors.forEach((attr, i) => {
            const el = attractorElements[i];
            if (el) {
                const center = getElementCenter(el);
                if (center) {
                    attr.x = center.x;
                    attr.y = center.y;
                }
            }
        });
    }

    function updateCountDisplay(sys) {
        if (countDisplay && sys) {
            countDisplay.textContent = sys.getCount().toLocaleString();
        }
    }

    function onEnter() {
        if (isHovering) return;
        isHovering = true;

        const sys = ensureSystem();
        if (!sys) return;

        sys.setMouseRepel(false);
        if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }
        sys.resume();

        attractors = attractorElements.map(el => {
            const center = getElementCenter(el);
            return center ? { x: center.x, y: center.y } : null;
        }).filter(Boolean);

        attractors.forEach(attr => sys.addAttractor(attr));
        
        sys.setSpawnConfig({ targets: attractors });

        updateCountDisplay(sys);

        intervalId = setInterval(() => {
            if (!isHovering) return;
            updateAttractorPositions();
            sys.setSpawnConfig({ targets: attractors });
            const currentCount = sys.getCount();
            if (currentCount < maxParticles) {
                sys.setCount(currentCount + particlesPerSpawn);
                spawnedCount += particlesPerSpawn;
            }
            updateCountDisplay(sys);
        }, intervalMs);
    }

    function onLeave() {
        if (!isHovering) return;
        isHovering = false;

        const sys = ensureSystem();

        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        if (sys) {
            sys.pause();
            sys.setMouseRepel(true);
            sys.setSpawnConfig(null);
            attractors.forEach(attr => sys.removeAttractor(attr));

            mouseMoveHandler = (e) => {
                sys.updateMousePosition(e.clientX, e.clientY);
            };
            document.addEventListener('mousemove', mouseMoveHandler);
        }
        attractors = [];
    }

    triggerElement.addEventListener('mouseenter', onEnter);
    triggerElement.addEventListener('mouseleave', onLeave);

    return () => {
        triggerElement.removeEventListener('mouseenter', onEnter);
        triggerElement.removeEventListener('mouseleave', onLeave);
        if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler);
        }
        if (isHovering) onLeave();
    };
}
