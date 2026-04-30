const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No signer found. Check your DEPLOYER_PRIVATE_KEY in .env");
  }

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "POL");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Current Chain ID:", chainId.toString());

  const isMainnet = chainId === 137n;
  
  // Aave V3 Pool addresses
  // Polygon Mainnet: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
  // Amoy: Using Mock if not specified
  let aavePoolAddress = isMainnet 
    ? "0x794a61358D6845594F94dc1DB02A252b5b4814aD" 
    : (process.env.AAVE_POOL_ADDRESS || "");

  // Chainlink Sequencer Uptime Feeds
  // Polygon Mainnet: 0x491B1dCdB7f4339e3Aa2C6909403B550798C5d71
  const sequencerFeed = isMainnet
    ? "0x491B1dCdB7f4339e3Aa2C6909403B550798C5d71"
    : "0x0000000000000000000000000000000000000000";

  // 1. SentinelTreasury
  console.log("Deploying SentinelTreasury...");
  const Treasury = await hre.ethers.getContractFactory("SentinelTreasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("SentinelTreasury deployed to:", treasuryAddress);

  // 2. MockPriceFeed (Only for Testnet)
  let mockPriceFeedAddr = "";
  if (!isMainnet) {
    console.log("Deploying MockPriceFeed...");
    const MockPriceFeed = await hre.ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy(hre.ethers.parseUnits("1.0", 8));
    await mockPriceFeed.waitForDeployment();
    mockPriceFeedAddr = await mockPriceFeed.getAddress();
    console.log("MockPriceFeed deployed to:", mockPriceFeedAddr);
  }

  // 3. SentinelChainlinkOracle
  console.log("Deploying SentinelChainlinkOracle...");
  const Oracle = await hre.ethers.getContractFactory("SentinelChainlinkOracle");
  const oracle = await Oracle.deploy(deployer.address, sequencerFeed);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("SentinelChainlinkOracle deployed to:", oracleAddress);

  // 4. Mock Aave Pool (Only if no address provided and not mainnet)
  if (!isMainnet && !aavePoolAddress) {
      try {
          console.log("Deploying MockAavePool...");
          const MockAavePool = await hre.ethers.getContractFactory("MockAavePool");
          const mockPool = await MockAavePool.deploy();
          await mockPool.waitForDeployment();
          aavePoolAddress = await mockPool.getAddress();
          console.log("MockAavePool deployed to:", aavePoolAddress);
      } catch (e) {
          aavePoolAddress = "0x6Ae43d534924A6D5c4a796644C4476082c5f102B";
          console.log("Using fallback Aave Pool address:", aavePoolAddress);
      }
  }

  // 5. AaveV3Adapter
  console.log("Deploying AaveV3Adapter...");
  const AaveV3Adapter = await hre.ethers.getContractFactory("AaveV3Adapter");
  const aaveAdapter = await AaveV3Adapter.deploy(aavePoolAddress, deployer.address);
  await aaveAdapter.waitForDeployment();
  const aaveAdapterAddress = await aaveAdapter.getAddress();
  console.log("AaveV3Adapter deployed to:", aaveAdapterAddress);

  // 6. SentinelVaultFactory
  console.log("Deploying SentinelVaultFactory...");
  const Factory = await hre.ethers.getContractFactory("SentinelVaultFactory");
  const factory = await Factory.deploy(aaveAdapterAddress, treasuryAddress, oracleAddress, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("SentinelVaultFactory deployed to:", factoryAddress);

  const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
  await (await factory.grantRole(DEPLOYER_ROLE, deployer.address)).wait();
  console.log("Granted DEPLOYER_ROLE");

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  const prefix = isMainnet ? "VITE_POLYGON_" : "VITE_AMOY_";
  console.log(`${prefix}TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`${prefix}ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`${prefix}FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`${prefix}ADAPTER_ADDRESS=${aaveAdapterAddress}`);
  
  // Try to setup initial vault on Testnet
  if (!isMainnet) {
    console.log("\nSetting up initial vault on Amoy...");
    try {
        const MockToken = await hre.ethers.getContractFactory("ERC20Mock");
        const mockToken = await MockToken.deploy("USD Coin", "USDC", deployer.address, hre.ethers.parseUnits("1000000", 6));
        await mockToken.waitForDeployment();
        const mockTokenAddr = await mockToken.getAddress();
        console.log("Mock USDC deployed to:", mockTokenAddr);

        // Link Mock Token to Mock Price Feed In Sentinel Oracle
        if (mockPriceFeedAddr) {
          await (await oracle.setPriceFeed(mockTokenAddr, mockPriceFeedAddr, 3600)).wait();
          console.log("Oracle configured for Mock USDC");
        }

        const tx = await factory.createVault(mockTokenAddr, "Sentinel USDC Vault", "sUSDC");
        const receipt = await tx.wait();
        const vaultCreatedLog = receipt.logs.find(x => x.fragment && x.fragment.name === "VaultCreated");
        if (vaultCreatedLog) {
            console.log(`${prefix}VAULT_ADDRESS=${vaultCreatedLog.args[1]}`);
        }
    } catch(e) {
        console.log("Could not complete test vault setup:", e.message);
    }
  } else {
    // On mainnet, we don't automatically create vaults as we need real assets
    console.log("\nReady for mainnet operation. Configure your asset addresses in the Oracle.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
