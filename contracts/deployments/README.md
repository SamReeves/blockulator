# Deployment records

Everything in this directory is served at blockulator.com/contracts/deployments/.

- `FP127.md`, `FP127.json`: the FP127 object on Sepolia, CREATE2 through the
  deterministic proxy with salt "FP127 v1", the verification recipe and the
  smoke test. Deploy a new version with `make deploy-sepolia`,
  `make verify-sepolia`, `make smoke-sepolia`.
- `Ladder.md`, `Ladder.json`: the five ladder adapters and `LadderRunner`,
  salt "FP127 ladder v1". `make deploy-ladder-sepolia`,
  `make verify-ladder-sepolia`.
- `FP127.sepolia.receipt.json`: the raw receipt of the FP127 deployment.

The badge, game, calculator and market contracts were deployed by hand in
the Huff era; their addresses live in
`static/js/legacy/infrastructure/config/contract-registry.js`, the game
modules, and `/.well-known/agent.json`.
