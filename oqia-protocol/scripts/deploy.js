const { ethers, upgrades, run } = require("hardhat");
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting deployment...");
  const SAFE_SINGLETON_ADDR = "0xd9db270c1b5e3213241c04185c22d2afd56a333a";
  const SAFE_PROXY_FACTORY_ADDR = "0xa6b71e26c5e0845f74c812102ca7114b6a896ab2";
  const ENTRY_POINT_ADDR = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
  const factoryProxy = await upgrades.deployProxy(
    OqiaBotFactory,
    [ "Oqia Bot NFT", "OQIA", SAFE_SINGLETON_ADDR, SAFE_PROXY_FACTORY_ADDR, ENTRY_POINT_ADDR ],
    { initializer: "initialize", kind: "uups" }
  );
  await factoryProxy.waitForDeployment();
  const proxyAddress = factoryProxy.target;
  const implementationAddress = await getImplementationAddress(factoryProxy.runner.provider, proxyAddress);
  
  console.log(`✅ Proxy deployed to: ${proxyAddress}`);
  console.log(`✅ Implementation deployed to: ${implementationAddress}`);;

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
