/**
 * SDR Design System — Portable Particle System
 * 4-force model: pull toward attractors, tangential stir, velocity alignment, damping
 * https://sdr.dev/lib/particles/index.js
 */

import { palette as defaultPalette } from './palette.js';
import { defaults } from './config.js';

const MAX_PARTICLES = 1000000;

export function createParticleSystem(canvas, options = {}) {
  const cfg = { ...defaults, ...options };
  const pal = options.palette || defaultPalette;
  const ctx = canvas.getContext('2d', { alpha: true });

  let count = Math.min(MAX_PARTICLES, cfg.count);
  let x = new Float32Array(MAX_PARTICLES);
  let y = new Float32Array(MAX_PARTICLES);
  let vx = new Float32Array(MAX_PARTICLES);
  let vy = new Float32Array(MAX_PARTICLES);
  let stirSign = new Int8Array(MAX_PARTICLES);

  const attractors = [];
  let animId = null;
  let canvasW = 0;
  let canvasH = 0;
  let dpr = 1;
  let paused = false;
  let spawnConfig = null;
  let mouseRepelActive = false;
  let mouseX = 0, mouseY = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let mouseVX = 0, mouseVY = 0;

  const alignFalloff2 = cfg.alignFalloffDist * cfg.alignFalloffDist;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;
    canvas.width = Math.max(1, Math.floor(canvasW * dpr));
    canvas.height = Math.max(1, Math.floor(canvasH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticles(startIdx, endIdx) {
    const targets = spawnConfig?.targets;
    
    if (targets && targets.length > 0) {
      for (let i = startIdx; i < endIdx; i++) {
        const t = targets[i % targets.length];
        x[i] = t.x + (Math.random() - 0.5) * 20;
        y[i] = t.y + (Math.random() - 0.5) * 20;
        vx[i] = (Math.random() - 0.5) * 0.5;
        vy[i] = (Math.random() - 0.5) * 0.5;
        stirSign[i] = Math.random() < 0.5 ? -1 : 1;
      }
    } else {
      const R = cfg.spawnRadius;
      const R2 = R * R;
      const centerX = canvasW / 2;
      const centerY = canvasH / 2;

      for (let i = startIdx; i < endIdx; i++) {
        let px, py;
        do {
          px = (Math.random() * 2 - 1) * R;
          py = (Math.random() * 2 - 1) * R;
        } while (px * px + py * py > R2);

        x[i] = centerX + px;
        y[i] = centerY + py;
        vx[i] = (Math.random() - 0.5) * 1.2;
        vy[i] = (Math.random() - 0.5) * 1.2;
        stirSign[i] = Math.random() < 0.5 ? -1 : 1;
      }
    }
  }

  function updateAttractorPositions() {
    for (const attr of attractors) {
      if (attr.element) {
        const rect = attr.element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        attr.x = rect.left + rect.width / 2 - canvasRect.left;
        attr.y = rect.top + rect.height / 2 - canvasRect.top;
      }
    }
  }

  function step() {
    if (count === 0 || attractors.length === 0) return;

    const pullK = cfg.centerPull;
    const stirK = cfg.stirStrength;
    const alignR2 = cfg.alignRadius2;
    const alignK = cfg.alignStrength;
    const damp = cfg.damping;
    const numAttractors = attractors.length;

    for (let i = 0; i < count; i++) {
      const px = x[i], py = y[i];
      let pvx = vx[i], pvy = vy[i];

      let nearestD2 = 1e12;
      let nearestX = 0, nearestY = 0;
      for (let a = 0; a < numAttractors; a++) {
        const attr = attractors[a];
        const dx = attr.x - px, dy = attr.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearestD2) {
          nearestD2 = d2;
          nearestX = attr.x;
          nearestY = attr.y;
        }
      }

      const dx = nearestX - px, dy = nearestY - py;
      pvx += dx * pullK;
      pvy += dy * pullK;

      const rdx = px - nearestX;
      const rdy = py - nearestY;
      const rLen2 = rdx * rdx + rdy * rdy + 1;
      const invLen = 1 / Math.sqrt(rLen2);
      const stir = stirK * stirSign[i];
      pvx -= rdy * invLen * stir;
      pvy += rdx * invLen * stir;

      const effAlignK = nearestD2 < alignFalloff2
        ? alignK * nearestD2 / alignFalloff2
        : alignK;

      const j = (i + 1) % count;
      const adx = x[j] - px, ady = y[j] - py;
      const ad2 = adx * adx + ady * ady;
      if (ad2 < alignR2) {
        const w = effAlignK * (1 - ad2 / alignR2);
        pvx += (vx[j] - pvx) * w;
        pvy += (vy[j] - pvy) * w;
      }

      pvx *= damp;
      pvy *= damp;

      x[i] = px + pvx;
      y[i] = py + pvy;
      vx[i] = pvx;
      vy[i] = pvy;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    const baseSize = cfg.size;
    const opacityMult = cfg.opacityMult;

    for (let i = 0; i < count; i++) {
      const px = x[i], py = y[i];

      if (px < -16 || px > canvasW + 16 || py < -16 || py > canvasH + 16) {
        continue;
      }

      const pvx = vx[i], pvy = vy[i];
      const speed = Math.sqrt(pvx * pvx + pvy * pvy);
      const opacity = Math.min(1, Math.max(0.03, speed * opacityMult));

      const region = (pvx < 0 ? 8 : 0) | (pvy < 0 ? 4 : 0) |
                     ((pvy > pvx || pvy < -pvx) ? 2 : 0) |
                     ((speed > 0.5) ? 1 : 0);

      ctx.globalAlpha = opacity;
      ctx.fillStyle = pal[region];
      ctx.fillRect(px, py, baseSize, baseSize);
    }
  }

  function applyMouseRepel() {
    if (!mouseRepelActive) return;
    const radius = 15;
    const radius2 = radius * radius;
    
    for (let i = 0; i < count; i++) {
      const dx = x[i] - mouseX;
      const dy = y[i] - mouseY;
      const d2 = dx * dx + dy * dy;
      
      if (d2 < radius2 && d2 > 0) {
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        
        const approachSpeed = -(mouseVX * nx + mouseVY * ny);
        if (approachSpeed <= 0) continue;
        
        const bounce = approachSpeed * 1.8;
        const tangent = (mouseVX * (-ny) + mouseVY * nx) * 0.4;
        
        x[i] += nx * 2;
        y[i] += ny * 2;
        
        vx[i] = nx * bounce + (-ny) * tangent;
        vy[i] = ny * bounce + nx * tangent;
      }
    }
  }

  function loop() {
    if (!paused) {
      step();
    } else {
      applyMouseRepel();
    }
    render();
    animId = requestAnimationFrame(loop);
  }

  function init() {
    resizeCanvas();
    spawnParticles(0, count);
  }

  const resizeHandler = () => {
    resizeCanvas();
    updateAttractorPositions();
  };

  return {
    addAttractor(target) {
      if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        attractors.push({
          element: target,
          x: rect.left + rect.width / 2 - canvasRect.left,
          y: rect.top + rect.height / 2 - canvasRect.top,
        });
      } else {
        attractors.push({ x: target.x, y: target.y });
      }
    },

    removeAttractor(target) {
      const idx = attractors.findIndex(a =>
        a.element === target || (a.x === target.x && a.y === target.y)
      );
      if (idx >= 0) attractors.splice(idx, 1);
    },

    updateAttractors() {
      updateAttractorPositions();
    },

    setCount(n) {
      const newCount = Math.max(0, Math.min(MAX_PARTICLES, n));
      if (newCount > count) {
        spawnParticles(count, newCount);
      }
      count = newCount;
    },

    getCount() {
      return count;
    },

    setSpawnConfig(config) {
      spawnConfig = config;
    },

    pause() {
      paused = true;
    },

    resume() {
      paused = false;
    },

    setMouseRepel(active) {
      mouseRepelActive = active;
    },

    updateMousePosition(mx, my) {
      const canvasRect = canvas.getBoundingClientRect();
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = mx - canvasRect.left;
      mouseY = my - canvasRect.top;
      mouseVX = mouseX - prevMouseX;
      mouseVY = mouseY - prevMouseY;
    },

    start() {
      if (animId) return;
      init();
      window.addEventListener('resize', resizeHandler);
      loop();
    },

    stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      window.removeEventListener('resize', resizeHandler);
    },

    destroy() {
      this.stop();
      attractors.length = 0;
      count = 0;
    },

    getAttractors() {
      return attractors;
    },
  };
}
