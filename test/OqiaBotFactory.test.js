const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaBotFactory (Hardhat Tests)", function () {
  let OqiaBotFactory, factoryProxy, owner, addr1;
  const SAFE_SINGLETON_ADDR = "0x41675a0494595b422421ff325434152a62627264";
  const SAFE_PROXY_FACTORY_ADDR = "0x42f84744a4753591238852f51859c28855d02741";
  const ENTRY_POINT_ADDR = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    OqiaBotFactory = await ethers.getContractFactory("OqiaBotFactory");
    factoryProxy = await upgrades.deployProxy(
      OqiaBotFactory,
      [ "Oqia Bot NFT", "OQIA", SAFE_SINGLETON_ADDR, SAFE_PROXY_FACTORY_ADDR, ENTRY_POINT_ADDR ],
      { initializer: "initialize", kind: "uups" }
    );
  });

  it("Should initialize with the correct name and symbol", async function () {
    expect(await factoryProxy.name()).to.equal("Oqia Bot NFT");
    expect(await factoryProxy.symbol()).to.equal("OQIA");
  });
});
