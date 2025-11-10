# WhaleGames Tests

This directory contains various test files for the WhaleGames platform.

## Test Files

### JavaScript Tests (Node.js)

- **test-board.js** - Tests for discussion board functionality
- **test-discussion.js** - Tests for individual discussion contracts
- **test-factory-deployment.js** - Tests for factory contract deployment

Run these with:
```bash
node tests/test-board.js
node tests/test-discussion.js
node tests/test-factory-deployment.js
```

### HTML Tests (Browser)

- **test-browser-integration.html** - General browser integration tests
- **test-dice-3d.html** - 3D dice rendering tests
- **test-games-routing.html** - Game routing functionality tests
- **test-single-discussion.html** - Single discussion view tests

Open these in a browser to run.

### Server

- **test-server.sh** - Simple HTTP server for testing
  - Run with: `./tests/test-server.sh`
  - Serves the app on http://localhost:8000

## Running Tests

1. **Start the test server:**
   ```bash
   cd /home/s/whalegames
   ./tests/test-server.sh
   ```

2. **Open browser tests:**
   Navigate to the test HTML files in your browser.

3. **Run Node.js tests:**
   ```bash
   node tests/test-board.js
   ```

## Notes

- Most tests interact with the Sepolia testnet
- Ensure you have a valid `.env` file with test credentials for automated tests
- Browser tests may require MetaMask or another Web3 wallet

