const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaBotFactory (Hardhat Tests)", function () {
  let OqiaBotFactory, factoryProxy, owner, addr1;
  const SAFE_SINGLETON_ADDR = "0x41675a0494595B422421fF325434152A62627264";
  const SAFE_PROXY_FACTORY_ADDR = "0x42f84744A4753591238852f51859c28855d02741";
  const ENTRY_POINT_ADDR = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    factoryProxy = await upgrades.deployProxy(
      OqiaBotFactory,
      [ "Oqia Bot NFT", "OQIA", SAFE_SINGLETON_ADDR, SAFE_PROXY_FACTORY_ADDR, ENTRY_POINT_ADDR ],
      { initializer: "initialize", kind: "uups" }
    );
    await factoryProxy.deployed();
  });

  it("Should initialize with the correct name and symbol", async function () {
    expect(await factoryProxy.name()).to.equal("Oqia Bot NFT");
    expect(await factoryProxy.symbol()).to.equal("OQIA");
  });
});
