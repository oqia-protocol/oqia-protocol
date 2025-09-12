const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("OqiaSessionKeyManager", function () {
   let factory, sessionKeyManager, agentWallet, owner, other;
   let agentWalletImplementation; // To deploy clones from

   beforeEach(async function () {
     [owner, other] = await ethers.getSigners();

     // deploy factory (ERC721)
     const Factory = await ethers.getContractFactory("OqiaBotFactory");
     const OqiaAgentWallet = await ethers.getContractFactory("OqiaAgentWallet");
     agentWalletImplementation = await OqiaAgentWallet.deploy();
     await agentWalletImplementation.waitForDeployment();
     factory = await upgrades.deployProxy(Factory, [agentWalletImplementation.target]);
     await factory.waitForDeployment();

     // deploy session manager, linking it to the factory
     const S = await ethers.getContractFactory("OqiaSessionKeyManager");
     sessionKeyManager = await S.deploy(factory.target);
     await sessionKeyManager.waitForDeployment();
   });

   it("accepts setupSessionKey when caller is the NFT owner (factory.ownerOf)", async function () {
     // mint an agent NFT to 'owner' using factory
     const tx = await factory.createBot(owner.address);
     const receipt = await tx.wait();
     const event = receipt.logs.find(e => factory.interface.parseLog(e)?.name === 'BotCreated');
     const tokenId = event.args.tokenId;
     const walletAddress = event.args.wallet;

     // confirm ownerOf
     const nftOwner = await factory.ownerOf(tokenId);
     expect(nftOwner).to.equal(owner.address);

     const agentWalletInstance = await ethers.getContractAt("OqiaAgentWallet", walletAddress);
     const nativeOwner = await agentWalletInstance.owner();
     expect(nativeOwner).to.equal(owner.address);

     // The user's patch had a function called setupSessionKey, my contract uses authorizeSessionKey
     // I will adapt the test to use my function name and arguments.
     const sessionKey = ethers.Wallet.createRandom();
     const validUntil = Math.floor(Date.now() / 1000) + 3600;
     const permissions = [];

     // call authorizeSessionKey as owner (should pass fallback factory check)
     await expect(
       sessionKeyManager.connect(owner).authorizeSessionKey(
           walletAddress,
           tokenId,
           sessionKey.address,
           validUntil,
           0,
           permissions,
           0,
           0
        )
     ).to.not.be.reverted;
   });

   it("accepts setupSessionKey when caller is the native wallet owner", async function () {
    // This test ensures the primary check works.
    // We will mint a bot to `other`, so `other` is the native owner.
    const tx = await factory.createBot(other.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find(e => factory.interface.parseLog(e)?.name === 'BotCreated');
    const tokenId = event.args.tokenId;
    const walletAddress = event.args.wallet;

    const sessionKey = ethers.Wallet.createRandom();
    const validUntil = Math.floor(Date.now() / 1000) + 3600;
    const permissions = [];

    // Call authorizeSessionKey as `other` (the native owner)
    await expect(
      sessionKeyManager.connect(other).authorizeSessionKey(
          walletAddress,
          tokenId,
          sessionKey.address,
          validUntil,
          0,
          permissions,
          0,
          0
       )
    ).to.not.be.reverted;
  });
});
