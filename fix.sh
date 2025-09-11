#!/bin/bash

echo "🚀 Applying the universal fix..."

# Step 1: Deep clean all caches to ensure a fresh start
echo "🧹 Performing a deep clean of all caches..."
rm -rf artifacts cache typechain-types
npx hardhat clean

# Step 2: Correctly update test files using a portable method
echo "✍️  Correcting contract paths in all test files..."

# Use a temp file for editing to ensure compatibility
TEMP_FILE="test_file.tmp"

# Fix OqiaBotFactory.test.js
awk '{gsub("\"OqiaBotFactory\"", "\"contracts/OqiaBotFactory.sol:OqiaBotFactory\"")}1' test/OqiaBotFactory.test.js > $TEMP_FILE && mv $TEMP_FILE test/OqiaBotFactory.test.js

# Fix OqiaModuleRegistry.test.js
awk '{gsub("\"OqiaModuleRegistry\"", "\"contracts/OqiaModuleRegistry.sol:OqiaModuleRegistry\"")}1' test/OqiaModuleRegistry.test.js > $TEMP_FILE && mv $TEMP_FILE test/OqiaModuleRegistry.test.js

# Fix SimpleArbitrageModule.test.js
awk '{gsub("\"SimpleArbitrageModule\"", "\"contracts/SimpleArbitrageModule.sol:SimpleArbitrageModule\"")}1' test/SimpleArbitrageModule.test.js > $TEMP_FILE && mv $TEMP_FILE test/SimpleArbitrageModule.test.js


echo "✅ All files updated."

# Step 3: Compile and run tests
echo "⚙️  Compiling and running tests..."
npx hardhat test


