#!/usr/bin/env bash
set -euo pipefail

# Quick project health check (safe): installs deps, compiles, lints, runs tests
# This script sets SKIP_DEPLOY to avoid any deploy scripts from executing network deployments.

export SKIP_DEPLOY=1

echo "Installing dependencies (npm ci)..."
npm ci --silent

echo "Cleaning build artifacts..."
npx hardhat clean || true

echo "Compiling contracts..."
npx hardhat compile

echo "Running ESLint (JS/TS)..."
npx eslint . || true

echo "Running unit tests (Hardhat)..."
npx hardhat test --no-compile

if command -v forge >/dev/null 2>&1; then
  echo "Found forge — running Foundry tests..."
  forge test || true
fi

echo "All checks completed."
