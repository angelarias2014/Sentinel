import { expect } from "chai";
import hre from "hardhat";

describe("SentinelVaultERC4626", function () {
  let VaultFactory;
  let AaveAdapterFactory;
  let ERC20MockFactory;

  let vault;
  let adapter;
  let asset;
  let admin;
  let user;
  let treasury;

  before(async function () {
    [admin, user, treasury] = await hre.ethers.getSigners();

    ERC20MockFactory = await hre.ethers.getContractFactory("ERC20Mock");
    VaultFactory = await hre.ethers.getContractFactory("SentinelVaultERC4626");
    AaveAdapterFactory = await hre.ethers.getContractFactory("AaveV3Adapter");
    
    // Deploy Asset Mock
    asset = await ERC20MockFactory.deploy("Mock Token", "MOCK", admin.address, hre.ethers.parseEther("1000000"));
    await asset.waitForDeployment();
    
    // Deploy fake Aave Pool wrapper/mock? Just use an empty contract or a mock
  });

  it("should deploy properly and allow deposits", async function () {
    // We will deploy a basic mock for Aave
    const MockAave = await hre.ethers.getContractFactory("MockAavePool");
    const mockAave = await MockAave.deploy();
    await mockAave.waitForDeployment();

    adapter = await AaveAdapterFactory.deploy(await mockAave.getAddress(), admin.address);
    await adapter.waitForDeployment();

    vault = await VaultFactory.deploy(
      await asset.getAddress(),
      "Sentinel Vault",
      "sVAULT",
      await adapter.getAddress(),
      treasury.address,
      hre.ethers.ZeroAddress, // Oracle
      admin.address
    );
    await vault.waitForDeployment();

    // Grant vault role to vault
    const VAULT_ROLE = await adapter.VAULT_ROLE();
    await adapter.grantRole(VAULT_ROLE, await vault.getAddress());

    // Mint some assets to user
    await asset.mint(user.address, hre.ethers.parseEther("10"));

    // Approve the vault
    await asset.connect(user).approve(await vault.getAddress(), hre.ethers.parseEther("10"));
    
    // Check initial balance
    expect(await vault.balanceOf(user.address)).to.equal(0);
    
    // Deposit
    await vault.connect(user).deposit(hre.ethers.parseEther("10"), user.address);
    
    // User should have shares (minus 0.1% fee)
    const expectedShares = hre.ethers.parseEther("10") * 999n / 1000n;
    expect(await vault.balanceOf(user.address)).to.equal(expectedShares);
  });
});
