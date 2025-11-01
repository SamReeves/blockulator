# 🐋 WhaleGames.net

A mobile-first web application for playing blockchain-based games. Built with vanilla JavaScript for simplicity and deployed as a single Docker image.

## 🎮 Games

- **💦 Pissing Contest** - Compete to make the biggest splash
- **🐋 Median Whale** - Play the middle ground
- **🐳 Mean Whale** - Calculate the average

## 🛠️ Mathematical Tools

- **📈 e^x Estimator** - On-chain exponential calculation
- **🔢 Factorial Lookup** - On-chain factorial computation

## 🏗️ Architecture

### Pure Vanilla JavaScript
- **No frameworks** - Direct DOM manipulation for maximum control
- **Zero build step** - What you write is what runs
- **Event-driven** - Loose coupling between game logic and animations
- **Modular** - Each game/tool is an independent module

### Project Structure

```
whalegames/
├── index.html              # Single page application
├── styles.css              # Mobile-first responsive styles
├── js/
│   ├── main.js            # App initialization & routing
│   ├── web3-provider.js   # Web3/wallet connection manager
│   ├── games/             # Game modules
│   │   ├── pissing-contest.js
│   │   ├── median-whale.js
│   │   └── mean-whale.js
│   ├── tools/             # Tool modules
│   │   ├── exp-estimator.js
│   │   └── factorial.js
│   └── ui/                # UI utilities
│       ├── events.js      # Central event bus
│       └── game-renderer.js  # Reusable UI patterns
├── contracts/
│   ├── abis/              # Contract ABI JSON files
│   └── addresses.js       # Contract addresses
├── Dockerfile             # Docker build configuration
├── docker-compose.yml     # Docker Compose setup
└── nginx.conf             # Nginx configuration
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
   - Add your contract ABIs to `contracts/abis/`
   - Update contract addresses in `contracts/addresses.js`

### Docker Deployment

Build and run as a single Docker image:

```bash
# Build the image
docker build -t whalegames .

# Run the container
docker run -d -p 80:80 whalegames

# Or use docker-compose
docker-compose up -d
```

Access the app at `http://localhost`

### Production Deployment

```bash
# Build for production
docker build -t whalegames:latest .

# Tag for your registry
docker tag whalegames:latest your-registry/whalegames:latest

# Push to registry
docker push your-registry/whalegames:latest

# Deploy to your server
docker pull your-registry/whalegames:latest
docker run -d -p 80:80 --restart unless-stopped whalegames:latest
```

## 🔧 Integrating Your Contracts

### 1. Add Contract ABIs

Create JSON files in `contracts/abis/`:
- `pissing-contest.json`
- `median-whale.json`
- `mean-whale.json`
- `exp-estimator.json`
- `factorial.json`

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

Edit `contracts/addresses.js` with your deployed addresses:
```javascript
export const CONTRACT_ADDRESSES = {
    PISSING_CONTEST: '0xYourContractAddress...',
    MEDIAN_WHALE: '0xYourContractAddress...',
    // ...
};
```

### 3. Update Game Modules

In each game file (e.g., `js/games/pissing-contest.js`), update the contract initialization:

```javascript
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

// Load ABI
const response = await fetch('/contracts/abis/pissing-contest.json');
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

See `js/ui/events.js` for all available events:
- `WALLET_CONNECTED`, `WALLET_DISCONNECTED`
- `PLAY_SUBMITTED`, `PLAY_CONFIRMED`, `PLAY_FAILED`
- `WINNER_DETERMINED`
- `WHALE_APPEARS`, `CONFETTI`, `SPLASH`

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

- [ ] Add actual contract ABIs and addresses
- [ ] Implement real blockchain state reading
- [ ] Add transaction history persistence
- [ ] Create custom whale animations
- [ ] Add sound effects
- [ ] Implement proper error handling for different networks
- [ ] Add unit tests for game logic
- [ ] Create animation library for physics effects

## 🤝 Contributing

This is a boilerplate structure. Customize it for your specific games and contracts!

## 📄 License

MIT - Do whatever you want with this code!

---

Built with ❤️ and vanilla JavaScript - no framework bloat, just pure code.
