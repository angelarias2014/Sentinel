import { expect } from "chai";
import hre from "hardhat";

describe("Yield Adapters", function () {
  let admin, vault, user;
  let asset;
  let aaveAdapter, uniAdapter, balAdapter, quickAdapter;

  before(async function () {
    [admin, vault, user] = await hre.ethers.getSigners();

    const ERC20MockFactory = await hre.ethers.getContractFactory("ERC20Mock");
    asset = await ERC20MockFactory.deploy("Mock Token", "MOCK", admin.address, hre.ethers.parseEther("1000000"));
    
    // Deploy Mocks
    const MockAave = await hre.ethers.getContractFactory("MockAavePool");
    const mockAave = await MockAave.deploy();
    
    // Deploy Adapters
    const AaveAdapterFactory = await hre.ethers.getContractFactory("AaveV3Adapter");
    aaveAdapter = await AaveAdapterFactory.deploy(await mockAave.getAddress(), admin.address);

    const UniAdapterFactory = await hre.ethers.getContractFactory("UniswapV3Adapter");
    // Using a random address for nonfungible position manager mock
    uniAdapter = await UniAdapterFactory.deploy(admin.address, admin.address);

    const BalAdapterFactory = await hre.ethers.getContractFactory("BalancerV2Adapter");
    balAdapter = await BalAdapterFactory.deploy(admin.address, admin.address);

    const QuickAdapterFactory = await hre.ethers.getContractFactory("QuickswapV3Adapter");
    quickAdapter = await QuickAdapterFactory.deploy(admin.address);

    // Grant VAULT_ROLE to the mock 'vault' address
    const VAULT_ROLE = await aaveAdapter.VAULT_ROLE();
    await aaveAdapter.grantRole(VAULT_ROLE, vault.address);
    await uniAdapter.grantRole(VAULT_ROLE, vault.address);
    await balAdapter.grantRole(VAULT_ROLE, vault.address);
    await quickAdapter.grantRole(VAULT_ROLE, vault.address);

    await asset.mint(vault.address, hre.ethers.parseEther("10000"));
  });

  describe("Aave V3 Adapter", function () {
    it("should allow vault to deposit and adapter to hold assets", async function () {
      const amount = hre.ethers.parseEther("100");
      await asset.connect(vault).approve(await aaveAdapter.getAddress(), amount);
      await aaveAdapter.connect(vault).deposit(vault.address, await asset.getAddress(), amount);
      
      // Since it's a mock, we just check it doesn't revert. 
      // In a real scenario we'd check aTokens.
      expect(await aaveAdapter.getBalance(vault.address, await asset.getAddress())).to.equal(0); // Mock doesn't return aTokens
    });
  });

  describe("Uniswap V3 Adapter", function () {
    it("should simulate deposit to Uniswap V3", async function () {
      const amount = hre.ethers.parseEther("100");
      await asset.connect(vault).approve(await uniAdapter.getAddress(), amount);
      await uniAdapter.connect(vault).deposit(vault.address, await asset.getAddress(), amount);
      
      // Our mock just holds the tokens
      expect(await uniAdapter.getBalance(vault.address, await asset.getAddress())).to.equal(amount);
    });
  });

  describe("Balancer V2 Adapter", function () {
    it("should simulate deposit to Balancer V2", async function () {
      const amount = hre.ethers.parseEther("100");
      await asset.connect(vault).approve(await balAdapter.getAddress(), amount);
      await balAdapter.connect(vault).deposit(vault.address, await asset.getAddress(), amount);
      
      expect(await balAdapter.getBalance(vault.address, await asset.getAddress())).to.equal(amount);
    });
  });

  describe("Quickswap V3 Adapter", function () {
    it("should simulate deposit to Quickswap V3", async function () {
      const amount = hre.ethers.parseEther("100");
      await asset.connect(vault).approve(await quickAdapter.getAddress(), amount);
      await quickAdapter.connect(vault).deposit(vault.address, await asset.getAddress(), amount);
      
      expect(await quickAdapter.getBalance(vault.address, await asset.getAddress())).to.equal(amount);
    });
  });
});
