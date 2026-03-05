# Blockulator Tests

This directory contains various test files for the Blockulator platform.

## Quick Start

From the project root:

```bash
# Run Node.js tests
npm test

# Start test server (for browser tests)
npm run test:server
```

## Test Files

### JavaScript Tests (Node.js)

- **test-module-imports.js** - Validates module import paths
- **test-all-contracts.js** - Tests contract configuration
- **test-board.js** - Tests for discussion board functionality
- **test-discussion.js** - Tests for individual discussion contracts
- **test-factory-deployment.js** - Tests for factory contract deployment

Run individually:
```bash
node tests/test-board.js
node tests/test-discussion.js
```

### HTML Tests (Browser)

- **test-browser-integration.html** - General browser integration tests
- **test-dice-3d.html** - 3D dice rendering tests
- **test-games-routing.html** - Game routing functionality tests
- **test-single-discussion.html** - Single discussion view tests

Open these in a browser after starting the test server.

### Python Tests (Contract testing)

- **test_fp128_*.py** - Huff FP128 arithmetic tests
- **test_fp.py** - Fixed-point math tests

Run with:
```bash
pytest tests/
```

### Server

- **test-server.sh** - Simple HTTP server for testing
  - Serves the app on http://localhost:8000

## Running Tests

1. **Run automated Node.js tests:**
   ```bash
   npm test
   ```

2. **Start the test server (for browser tests):**
   ```bash
   npm run test:server
   # Or directly: ./tests/test-server.sh
   ```

3. **Open browser tests:**
   Navigate to the test HTML files in your browser (after starting the server).

4. **Run Python/contract tests:**
   ```bash
   pytest tests/
   ```

## Notes

- Most tests interact with the Sepolia testnet
- Ensure you have a valid `.env` file with test credentials for automated tests
- Browser tests may require MetaMask or another Web3 wallet

