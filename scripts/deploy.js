const { ethers, upgrades, run } = require("hardhat");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting deployment...");
  const SAFE_SINGLETON_ADDR = "0x41675a0494595B422421fF325434152A62627264";
  const SAFE_PROXY_FACTORY_ADDR = "0x42f84744A4753591238852f51859c28855d02741";
  const ENTRY_POINT_ADDR = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
  const factoryProxy = await upgrades.deployProxy(
    OqiaBotFactory,
    [ "Oqia Bot NFT", "OQIA", SAFE_SINGLETON_ADDR, SAFE_PROXY_FACTORY_ADDR, ENTRY_POINT_ADDR ],
    { initializer: "initialize", kind: "uups" }
  );
  await factoryProxy.deployed();
  const proxyAddress = factoryProxy.address;
  const implementationAddress = await upgrades.getImplementationAddress(proxyAddress);
  
  console.log(`✅ Proxy deployed to: ${proxyAddress}`);
  console.log(`✅ Implementation deployed to: ${implementationAddress}`);

  console.log("\nWaiting 30s for Etherscan indexing...");
  await sleep(30000);

  try {
    console.log("Verifying implementation...");
    await run("verify:verify", { address: implementationAddress, constructorArguments: [] });
    console.log("✅ Verification successful.");
  } catch (error) {
    console.error(`🔥 Verification failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
