import hre from "hardhat";

const DEPLOYMENT_CONFIG = {
  baseSepolia: {
    label: "Base Sepolia",
    aaveV3Pool: process.env.BASE_SEPOLIA_AAVE_V3_POOL ?? "0x0000000000000000000000000000000000000000",
  },
  base: {
    label: "Base Mainnet",
    aaveV3Pool: process.env.BASE_AAVE_V3_POOL ?? "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  },
} as const;

async function main() {
  const networkName = hre.network.name as keyof typeof DEPLOYMENT_CONFIG;
  const networkConfig = DEPLOYMENT_CONFIG[networkName];
  if (!networkConfig) {
    throw new Error(`Unsupported network '${hre.network.name}'. Use 'baseSepolia' or 'base'.`);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Network: ${networkConfig.label} (${hre.network.name})`);
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Oracle (Sequencer Feed disabled for Testnet)
  const Oracle = await hre.ethers.getContractFactory("SentinelChainlinkOracle");
  const oracle = await Oracle.deploy(deployer.address, hre.ethers.ZeroAddress);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("SentinelChainlinkOracle deployed to:", oracleAddress);

  // 2. Deploy Treasury
  const Treasury = await hre.ethers.getContractFactory("SentinelTreasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("SentinelTreasury deployed to:", treasuryAddress);

  // 3. Deploy Aave V3 Adapter
  const AaveAdapter = await hre.ethers.getContractFactory("AaveV3Adapter");
  const aaveAdapter = await AaveAdapter.deploy(networkConfig.aaveV3Pool.toLowerCase(), deployer.address);
  await aaveAdapter.waitForDeployment();
  const aaveAdapterAddress = await aaveAdapter.getAddress();
  console.log("AaveV3Adapter deployed to:", aaveAdapterAddress);

  // 4. Deploy Vault Factory
  const Factory = await hre.ethers.getContractFactory("SentinelVaultFactory");
  const factory = await Factory.deploy(
    aaveAdapterAddress,
    treasuryAddress,
    oracleAddress,
    deployer.address
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("SentinelVaultFactory deployed to:", factoryAddress);

  // Output summary for configuration
  console.log("\n--- DEPLOYMENT SUMMARY ---");
  console.log(`NETWORK=${networkConfig.label}`);
  console.log(`ORACLE=${oracleAddress}`);
  console.log(`TREASURY=${treasuryAddress}`);
  console.log(`FACTORY=${factoryAddress}`);
  console.log(`DEFAULT_ADAPTER=${aaveAdapterAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
