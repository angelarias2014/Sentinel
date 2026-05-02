const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No signer found. Check your DEPLOYER_PRIVATE_KEY in .env");
  }

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Current Chain ID:", chainId.toString());

  const isMainnet = chainId === 8453n;
  const isBaseSepolia = chainId === 84532n;
  if (!isMainnet && !isBaseSepolia) {
    throw new Error(`Unsupported network chainId=${chainId.toString()}. Use Base (8453) or Base Sepolia (84532).`);
  }
  
  // Aave V3 Pool addresses
  // Base Mainnet: 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
  // Base Sepolia: from env if available, else mock
  let aavePoolAddress = isMainnet 
    ? "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" 
    : (process.env.AAVE_POOL_ADDRESS || "");

  // Chainlink Sequencer Uptime Feeds
  // Base networks: disabled by default unless explicitly provided
  const sequencerFeed = isMainnet
    ? (process.env.BASE_SEQUENCER_FEED || "0x0000000000000000000000000000000000000000")
    : "0x0000000000000000000000000000000000000000";

  // Optional external protocol addresses for additional adapters
  const uniswapPositionManager = process.env.UNISWAP_V3_POSITION_MANAGER || "0x0000000000000000000000000000000000000000";
  const balancerVaultAddress = process.env.BALANCER_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000";

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
          aavePoolAddress = "0x0000000000000000000000000000000000000000";
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

  // 6. UniswapV3Adapter
  console.log("Deploying UniswapV3Adapter...");
  const UniswapV3Adapter = await hre.ethers.getContractFactory("UniswapV3Adapter");
  const uniswapAdapter = await UniswapV3Adapter.deploy(uniswapPositionManager, deployer.address);
  await uniswapAdapter.waitForDeployment();
  const uniswapAdapterAddress = await uniswapAdapter.getAddress();
  console.log("UniswapV3Adapter deployed to:", uniswapAdapterAddress);

  // 7. QuickswapV3Adapter
  console.log("Deploying QuickswapV3Adapter...");
  const QuickswapV3Adapter = await hre.ethers.getContractFactory("QuickswapV3Adapter");
  const quickswapAdapter = await QuickswapV3Adapter.deploy(deployer.address);
  await quickswapAdapter.waitForDeployment();
  const quickswapAdapterAddress = await quickswapAdapter.getAddress();
  console.log("QuickswapV3Adapter deployed to:", quickswapAdapterAddress);

  // 8. BalancerV2Adapter
  console.log("Deploying BalancerV2Adapter...");
  const BalancerV2Adapter = await hre.ethers.getContractFactory("BalancerV2Adapter");
  const balancerAdapter = await BalancerV2Adapter.deploy(balancerVaultAddress, deployer.address);
  await balancerAdapter.waitForDeployment();
  const balancerAdapterAddress = await balancerAdapter.getAddress();
  console.log("BalancerV2Adapter deployed to:", balancerAdapterAddress);

  // 9. SentinelVaultFactory
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
  const prefix = isMainnet ? "VITE_BASE_" : "VITE_BASE_SEPOLIA_";
  console.log(`${prefix}TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`${prefix}ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`${prefix}FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`${prefix}ADAPTER_ADDRESS=${aaveAdapterAddress}`);
  console.log(`${prefix}AAVE_ADAPTER_ADDRESS=${aaveAdapterAddress}`);
  console.log(`${prefix}UNISWAP_ADAPTER_ADDRESS=${uniswapAdapterAddress}`);
  console.log(`${prefix}QUICKSWAP_ADAPTER_ADDRESS=${quickswapAdapterAddress}`);
  console.log(`${prefix}BALANCER_ADAPTER_ADDRESS=${balancerAdapterAddress}`);
  
  // Try to setup initial vault on Testnet
  if (!isMainnet) {
    console.log("\nSetting up initial vault on Base Sepolia...");
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
