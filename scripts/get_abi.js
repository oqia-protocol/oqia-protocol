const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    const abi = OqiaBotFactory.interface.format('json');
    fs.writeFileSync("OqiaBotFactory.abi", JSON.stringify(abi, null, 2));
    console.log("ABI for OqiaBotFactory written to OqiaBotFactory.abi");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});