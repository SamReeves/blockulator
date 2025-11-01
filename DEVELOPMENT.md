# Development Guide

## Quick Start

### Option 1: Direct Browser (Simplest)
Just open `index.html` in your browser! For Web3 functionality, you'll need a local server due to CORS:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000`

### Option 2: Docker (Production-like)
```bash
docker-compose up
```
Visit: `http://localhost`

## Architecture Deep Dive

### Event Bus Pattern

The app uses a centralized event bus to decouple game logic from UI effects:

```javascript
// Game emits event
eventBus.emit(EVENTS.PLAY_CONFIRMED, { number, wei });

// Animation listens
eventBus.on(EVENTS.PLAY_CONFIRMED, (data) => {
    // Trigger animation
});
```

This allows you to:
- Add animations without modifying game code
- Create easter eggs that respond to game events
- Build physics engines that react to blockchain state changes

### Module Pattern

Each game/tool follows this pattern:

```javascript
export class GameName {
    constructor() {
        // Initialize state
    }
    
    async init(container, web3Provider) {
        // Load contract, render UI, setup listeners
    }
    
    render() {
        // Build DOM structure
    }
    
    setupListeners() {
        // Add event listeners
    }
    
    async play(number, weiAmount) {
        // Execute game logic
    }
    
    async refreshState() {
        // Update from blockchain
    }
    
    destroy() {
        // Cleanup
    }
}
```

### Adding a New Game

1. **Create game file**: `js/games/your-game.js`
2. **Import in main.js**:
   ```javascript
   import { YourGame } from './games/your-game.js';
   ```
3. **Register in constructor**:
   ```javascript
   this.games.set('your-game', YourGame);
   ```
4. **Add UI card** in `index.html`:
   ```html
   <button class="game-card" data-game="your-game">
       <h3>🎮 Your Game</h3>
       <p>Description</p>
   </button>
   ```

### Canvas Effects

Access the effects canvas from anywhere:

```javascript
const canvas = window.effectsCanvas;
const ctx = window.effectsCtx;

// Draw something
ctx.fillStyle = 'rgba(37, 99, 235, 0.5)';
ctx.fillRect(x, y, width, height);
```

Example particle system:

```javascript
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= 0.01;
    }
    
    draw(ctx) {
        ctx.fillStyle = `rgba(37, 99, 235, ${this.life})`;
        ctx.fillRect(this.x, this.y, 4, 4);
    }
}

// Trigger on event
eventBus.on(EVENTS.SPLASH, () => {
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(
            window.innerWidth / 2,
            window.innerHeight / 2
        ));
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, i) => {
            p.update();
            p.draw(ctx);
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        });
        
        if (particles.length > 0) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
});
```

## Web3 Integration

### Reading Contract State

```javascript
const value = await this.contract.someStateVariable();
const result = await this.contract.someViewFunction(arg1, arg2);
```

### Writing to Contract

```javascript
// Simple transaction
const tx = await this.contract.someFunction(arg1, arg2);
await tx.wait();

// With value (sending ETH)
const tx = await this.contract.someFunction(arg1, {
    value: ethers.utils.parseEther("0.1")
});
await tx.wait();

// With Wei
const tx = await this.contract.someFunction(arg1, {
    value: ethers.BigNumber.from(weiAmount)
});
await tx.wait();
```

### Listening to Events

```javascript
// Listen to contract events
this.contract.on("EventName", (arg1, arg2, event) => {
    console.log("Event triggered:", arg1, arg2);
    this.refreshState();
});

// Don't forget to cleanup in destroy()
destroy() {
    this.contract.removeAllListeners();
}
```

## Styling Conventions

### CSS Variables
Use the predefined CSS variables for consistency:

```css
color: var(--primary);          /* Blue */
background: var(--bg-secondary); /* Dark slate */
border-radius: var(--border-radius); /* 12px */
padding: var(--spacing-md);     /* 16px */
```

### Responsive Breakpoints
```css
/* Mobile first - default styles */

@media (min-width: 768px) {
    /* Tablet */
}

@media (min-width: 1024px) {
    /* Desktop */
}
```

## Testing

### Manual Testing Checklist
- [ ] Connect wallet (MetaMask)
- [ ] Switch accounts (test wallet change handling)
- [ ] Switch networks (test network change handling)
- [ ] Play each game
- [ ] Test with pending transactions
- [ ] Test with failed transactions
- [ ] Test on mobile device
- [ ] Test on different screen sizes
- [ ] Test with slow network
- [ ] Test with wallet locked

### Browser Console
Monitor the console for:
- Contract initialization logs
- Transaction logs
- Event emissions
- Errors

## Performance Tips

### Minimize Blockchain Calls
Cache state when possible:

```javascript
this.cachedState = {
    value: null,
    timestamp: 0
};

async getState() {
    const now = Date.now();
    if (now - this.cachedState.timestamp < 5000) {
        return this.cachedState.value;
    }
    
    const value = await this.contract.getState();
    this.cachedState = { value, timestamp: now };
    return value;
}
```

### Debounce User Input
For inputs that trigger blockchain reads:

```javascript
let timeout;
input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        this.updatePreview(e.target.value);
    }, 300);
});
```

### Canvas Optimization
Only clear and redraw what's necessary:

```javascript
// Bad: Clear entire canvas every frame
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Good: Clear only dirty regions
ctx.clearRect(x, y, width, height);
```

## Deployment

### Environment Variables
For production, you might want to inject contract addresses via environment:

```javascript
export const CONTRACT_ADDRESSES = {
    PISSING_CONTEST: process.env.PISSING_CONTEST_ADDRESS || '0x...',
    // ...
};
```

### Building for Production
No build step needed! Just:
1. Update contract addresses
2. Test thoroughly
3. Build Docker image
4. Deploy

### CDN Considerations
The app uses ethers.js from CDN. For production, consider:
- Self-hosting ethers.js
- Using integrity checksums
- Having a fallback CDN

```html
<script 
    src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"
    integrity="sha256-..."
    crossorigin="anonymous"
    onerror="this.src='https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js'">
</script>
```

## Troubleshooting

### "Web3 not defined"
- Make sure ethers.js CDN loaded
- Check browser console for network errors
- Try using a local copy

### "Cannot read property of undefined"
- Wallet not connected
- Contract not initialized
- Check async/await usage

### Transactions failing
- Insufficient gas
- Wrong network
- Contract reverted (check contract code)
- Insufficient funds

### Styles not applying
- Check CSS specificity
- Verify class names match
- Clear browser cache
- Check for CSS syntax errors

## Resources

- [Ethers.js Docs](https://docs.ethers.org/)
- [Web3 Modal Patterns](https://web3modal.com/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

