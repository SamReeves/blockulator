# Blockulator Architecture

This document describes the layered architecture of the Blockulator frontend application.

## Overview

Blockulator is a modular single-page application (SPA) built with vanilla JavaScript and ES modules. It follows a layered architecture pattern to separate concerns and improve maintainability.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  (master-app, games-app, calculator-app, futures-app, etc.)     │
├─────────────────────────────────────────────────────────────────┤
│                       Presentation Layer                         │
│  (components, renderers, DOM helpers, router)                   │
├───────────────────────┬─────────────────────────────────────────┤
│     Domain Layer      │            Core Layer                   │
│  (games, calculators, │  (GameRegistry, BaseApp, Router)        │
│   futures, models)    │                                         │
├───────────────────────┴─────────────────────────────────────────┤
│                      Infrastructure Layer                        │
│  (blockchain, events, config, network)                          │
├─────────────────────────────────────────────────────────────────┤
│                         Shared Layer                             │
│  (constants, utilities)                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
js/
├── application/           # App controllers and sub-apps
│   ├── master-app.js      # Main application controller
│   ├── master-router.js   # URL routing
│   ├── games-app.js       # Games sub-app
│   ├── futures-app.js     # Futures marketplace sub-app
│   ├── calculator-app.js  # Scientific calculator sub-app
│   └── ...
├── core/                  # Framework utilities
│   ├── BaseApp.js         # Base class for sub-apps
│   └── GameRegistry.js    # Game class discovery
├── shared/                # Cross-cutting utilities
│   └── constants.js       # ADDRESS_ZERO, NETWORKS, etc.
├── domain/                # Business logic
│   ├── games/             # Game implementations
│   │   ├── templates/     # HTML templates for games
│   │   ├── shared/        # Shared game utilities
│   │   └── *.js           # Individual game classes
│   ├── calculators/       # Calculator configurations
│   ├── futures/           # Futures domain models
│   └── models/            # Base classes (Game, Contract)
├── infrastructure/        # External integrations
│   ├── blockchain/        # Web3, contract loading
│   ├── config/            # Contract registry, network
│   └── events/            # Event bus
└── presentation/          # UI layer
    ├── components/        # Reusable UI components
    ├── dom/               # DOM manipulation helpers
    ├── renderers/         # HTML rendering utilities
    └── router/            # View routing
```

## Layer Responsibilities

### Application Layer (`js/application/`)

The application layer orchestrates the overall application flow:

- **MasterApp**: Initializes shared components (wallet, toast), sets up routing
- **Sub-apps** (GamesApp, FuturesApp, etc.): Manage specific views
- Extends `BaseApp` for consistent lifecycle management

### Presentation Layer (`js/presentation/`)

Handles all UI rendering and user interaction:

- **Components**: Reusable UI widgets (WalletConnect, Toast, ValueInput)
- **Renderers**: HTML generation utilities (StatusCardRenderer)
- **DOM Helpers**: Formatting and DOM manipulation
- **Router**: View state management

### Domain Layer (`js/domain/`)

Contains business logic and domain models:

- **Games**: Each game extends the `Game` base class
- **Calculators**: Calculator configuration and UI schemas
- **Futures**: Future contract models
- **Models**: Abstract base classes

### Core Layer (`js/core/`)

Framework-level utilities:

- **BaseApp**: Base class for sub-apps with lifecycle hooks
- **GameRegistry**: Auto-discovers game classes

### Infrastructure Layer (`js/infrastructure/`)

External integrations and configuration:

- **Blockchain**: Web3 provider, contract loading
- **Events**: Application-wide event bus
- **Config**: Contract addresses, network settings

### Shared Layer (`js/shared/`)

Cross-cutting constants and utilities:

- `ADDRESS_ZERO`: Zero address constant
- `NETWORKS`: Network IDs

## Adding a New Game

1. Create the game class in `js/domain/games/`:

```javascript
import { Game } from '../models/game.js';
import { getTemplate } from './templates/my-game.tpl.js';

export class MyGame extends Game {
    static metadata = {
        id: 'my-game',
        title: 'My Game',
        emoji: '🎮',
        description: 'A new game',
        color: '#3b82f6',
        contract: {
            source: 'contracts/src/games/my_game.vy',
            abi: 'contracts/build/abis/my-game.json',
            addresses: {
                sepolia: '0x...',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        // Return status data for the status card
        return { ... };
    }

    getGameHTML() {
        return getTemplate({ panelColor: this.metadata.color });
    }

    initComponents() {
        // Initialize UI components
    }

    getListeners() {
        return {
            'play-button': () => this.play()
        };
    }

    async fetchAndRenderState() {
        // Fetch contract state and update UI
    }

    setupContractEvents() {
        // Listen to contract events
    }
}
```

2. Create the HTML template in `js/domain/games/templates/my-game.tpl.js`

3. Export the game in `js/domain/games/index.js`

4. The game will be auto-discovered by `GameRegistry`

## Adding a New Calculator

1. Add configuration to `js/domain/calculators/calculator-registry.js`:

```javascript
{
    id: 'my-calc',
    name: 'My Calculator',
    symbol: 'f(x)',
    // ... UI configuration
}
```

2. Add contract metadata to `js/infrastructure/config/contract-registry.js`:

```javascript
'my-calc': {
    type: 'calculator',
    addresses: { sepolia: '0x...', mainnet: '0x...' },
    abi: 'contracts/build/abis/my-calc.json',
    source: 'contracts/src/tools/math/my_calc.vy'
}
```

## Routing

The app uses hash-based routing (`#/games`, `#/futures`, etc.):

- `MasterRouter` handles top-level view switching
- Sub-apps handle their own sub-routes (e.g., `#/games/pissing-contest`)

## Event System

Use the event bus for cross-component communication:

```javascript
import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';

// Emit events
eventBus.emit(EVENTS.TOAST, { message: 'Success!', type: 'success' });

// Listen to events
eventBus.on(EVENTS.WALLET_CONNECTED, () => { ... });
```

## Best Practices

1. **Use shared constants**: Import from `js/shared/constants.js`
2. **Extract templates**: Keep HTML in `templates/*.tpl.js` files
3. **Use helper functions**: Leverage `js/domain/games/shared/` utilities
4. **Extend BaseApp**: For consistent lifecycle in sub-apps
5. **Register events**: Use `registerEvent()` in BaseApp for cleanup
