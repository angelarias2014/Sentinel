import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
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

  // 3. Deploy Aave V3 Adapter (Polygon Amoy Aave V3 Pool)
  const AaveAdapter = await hre.ethers.getContractFactory("AaveV3Adapter");
  const amoyAavePool = "0xcC61144463Eca27d091176507A588147d34193Bc".toLowerCase();
  const aaveAdapter = await AaveAdapter.deploy(amoyAavePool, deployer.address);
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
  console.log(`ORACLE=${oracleAddress}`);
  console.log(`TREASURY=${treasuryAddress}`);
  console.log(`FACTORY=${factoryAddress}`);
  console.log(`DEFAULT_ADAPTER=${aaveAdapterAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
