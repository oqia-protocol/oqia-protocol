const { ethers, upgrades, run } = require("hardhat");
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting OqiaModuleRegistry deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const OqiaModuleRegistry = await ethers.getContractFactory("OqiaModuleRegistry");
  const registryProxy = await upgrades.deployProxy(
    OqiaModuleRegistry,
    [ "Oqia Module License", "OML" ],
    { initializer: "initialize", kind: "uups" }
  );
  await registryProxy.waitForDeployment();
  const proxyAddress = registryProxy.target;
  const implementationAddress = await getImplementationAddress(registryProxy.runner.provider, proxyAddress);
  
  console.log(`✅ OqiaModuleRegistry Proxy deployed to: ${proxyAddress}`);
  console.log(`✅ OqiaModuleRegistry Implementation deployed to: ${implementationAddress}`);

  console.log("\nWaiting 30s for Etherscan indexing...");
  await sleep(30000);

  try {
    console.log("Verifying OqiaModuleRegistry implementation...");
    await run("verify:verify", { address: implementationAddress, constructorArguments: [] });
    console.log("✅ OqiaModuleRegistry Verification successful.");
  } catch (error) {
    console.error(`🔥 OqiaModuleRegistry Verification failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});