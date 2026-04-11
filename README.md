# Blockulator

A mobile-first web application for blockchain-based games and on-chain scientific computing. Built with vanilla JavaScript for simplicity and deployed as static files.

## 🎮 Games

- **💦 Pissing Contest** - Compete to make the biggest splash
- **👑 King of the Hill** - Dethrone the king
- **🎲 Dice Gods** - Pick the least popular number
- **⏰ Last Call** - Last donor wins after timer
- **🍩 Time to Make the Donuts** - First donor daily at midnight

## 🛠️ Mathematical Tools

- **📈 e^x Estimator** - On-chain exponential calculation
- **🔢 Factorial Lookup** - On-chain factorial computation

## 🏗️ Architecture

### Pure Vanilla JavaScript
- **No frameworks** - Direct DOM manipulation for maximum control
- **Zero build step** - What you write is what runs
- **Event-driven** - Loose coupling between game logic and animations
- **Modular** - Each game/tool is an independent module

### Routing
- **Hash-based SPA routing** - Client-side navigation using URL hash fragments
- **Deep links** - Direct links to any page or sub-page work out of the box
  - Main views: `https://site.com/#/games`, `https://site.com/#/calculator`, `https://site.com/#/futures`
  - Sub-routes: `https://site.com/#/games/pissing-contest`
- **No server configuration required** - All routes handled client-side with JavaScript

**Styling:** `index.html` loads `css/main.css`, which pulls in `css/variables.css` (SDR-aligned tokens) and the rest of the split stylesheets. The DigitalOcean static site build copies the `css/` tree into `dist/`. Root `styles.css` is a legacy monolith and is not used by the SPA or the deploy bundle.

Literal hex and `rgb()` / `rgba()` in application code must live only in `css/variables.css` and the mirrored `js/theme/sdr-palette.js`; everything else uses `var(--sdr-*)` / MD aliases or imports from that palette module (`npm test` runs `scripts/check-sdr-colors.mjs`).

### Project Structure

```
blockulator/
├── index.html              # Single page application (SPA)
├── css/                    # Canonical theme (`main.css` imports variables, layout, games, …)
├── styles.css              # Legacy monolith (not loaded by `index.html`; do not extend for new UI)
├── games/
│   └── index.html          # Games listing (routes to SPA)
├── js/
│   ├── application/        # Core application logic
│   │   ├── master-app.js   # Main SPA controller
│   │   └── master-router.js # Hash routing (#/games, #/calculator, etc)
│   ├── domain/             # Business logic
│   │   ├── games/          # Game modules (9 games)
│   │   ├── calculators/    # Calculator modules (21 calculators)
│   │   └── discussions/    # Discussion modules
│   ├── infrastructure/     # Framework code
│   │   ├── blockchain/     # Web3 provider
│   │   ├── config/         # Configuration
│   │   └── events/         # Event bus
│   └── presentation/       # UI components
│       ├── components/     # Reusable components
│       ├── views/          # Page views
├── contracts/
│   ├── src/               # Vyper source code
│   │   ├── games/         # Game contracts
│   │   ├── futures/       # Future contracts
│   │   ├── discussions/   # Discussion contracts
│   │   └── tools/         # Math utility contracts
│   ├── build/             # Compilation artifacts
│   │   ├── abis/          # Contract ABI JSON files
│   │   └── bytecode/      # Contract bytecode
│   └── deployments/       # Deployment scripts
└── blockulator.png         # Logo
```

## 🚀 Getting Started

### Local Development

1. **Open `index.html` directly in your browser** - No build step needed!
   ```bash
   # Using Python's built-in server (optional)
   python3 -m http.server 8000
   
   # Or using Node's http-server
   npx http-server -p 8000
   ```

2. **Connect your wallet** - Make sure you have MetaMask installed

3. **Update contract configuration**:
   - Add your contract ABIs to `contracts/build/abis/`
   - Update contract addresses in `contracts/deployments/addresses.js`

### Production Deployment

Deploy static files to any web server or CDN. No build step required - just upload the files.

## 🔧 Integrating Your Contracts

### 1. Add Contract ABIs

Contract ABIs are automatically generated in `contracts/build/abis/` from Vyper source files.

Example ABI structure:
```json
[
  {
    "inputs": [{"name": "number", "type": "uint256"}],
    "name": "play",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]
```

### 2. Update Contract Addresses

Contract addresses are configured in `js/infrastructure/config/contract-addresses.js`.

### 3. Update Game Modules

In each game file (e.g., `js/domain/games/pissing-contest.js`), update the contract initialization:

```javascript
import { CONTRACT_ADDRESSES } from '../../contracts/deployments/addresses.js';

// Load ABI
const response = await fetch('/contracts/build/abis/pissing-contest.json');
const abi = await response.json();

// Initialize contract
this.contract = web3Provider.getContract(
    CONTRACT_ADDRESSES.PISSING_CONTEST,
    abi
);
```

### 4. Implement Contract Calls

Replace the placeholder code with actual contract interactions:

```javascript
async play(number, weiAmount) {
    const tx = await this.contract.play(number, {
        value: ethers.BigNumber.from(weiAmount)
    });
    await tx.wait();
    
    // Update UI
    await this.refreshState();
}
```

## 🎨 Adding Animations

The app includes an event bus for triggering animations without coupling them to game logic.

### Example: Confetti on Win

```javascript
// In your animation code
import { eventBus, EVENTS } from './ui/events.js';

eventBus.on(EVENTS.WINNER_DETERMINED, (data) => {
    // Trigger your confetti animation
    createConfetti();
});

// In game code
eventBus.emit(EVENTS.WINNER_DETERMINED, { player: address });
```

### Available Events

See `js/infrastructure/events/event-bus.js` for all available events:
- `WALLET_CONNECTED`, `WALLET_DISCONNECTED`
- `PLAY_SUBMITTED`, `PLAY_CONFIRMED`, `PLAY_FAILED`
- `WINNER_DETERMINED`
- `CONFETTI`, `SPLASH`

## 🎯 Design Philosophy

### Mobile-First
- Touch-friendly interface
- Responsive layout (600px, 768px, 1024px breakpoints)
- Optimized for portrait mode
- Progressive disclosure of complex data

### Event-Driven Architecture
- Games emit events for state changes
- Animations listen to events independently
- Clean separation of concerns
- Easy to add effects without modifying game logic

### Minimal Dependencies
- **ethers.js** - Only external dependency for Web3 interactions
- Served via CDN (can be bundled if needed)
- No build tools, no bundlers, no transpilers

## 🔐 Security Considerations

- Always validate user input before submitting transactions
- Display transaction details clearly before confirmation
- Handle failed transactions gracefully
- Never expose private keys or sensitive data
- Use HTTPS in production

## 📝 TODO Items

- [ ] Add transaction history persistence
- [ ] Add sound effects
- [ ] Implement proper error handling for different networks
- [ ] Add unit tests for game logic
- [ ] Create animation library for physics effects

## 🔗 Live Site

Visit [blockulator.com](https://blockulator.com) to try it out on Sepolia testnet.

## 📄 License

MIT

---

**Project**: Blockulator - Blockchain-powered scientific computing and game theory experiments.
