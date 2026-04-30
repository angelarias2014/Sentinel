import { expect } from "chai";
import hre from "hardhat";

describe("SentinelVaultERC4626 - Security Vectors", function () {
  let VaultFactory;
  let MaliciousTokenFactory;
  let AaveAdapterFactory;
  let ERC20MockFactory;

  let maliciousToken;
  let normalToken;
  let vault;
  let adapter;
  let admin;
  let attacker;
  let victim;
  let treasury;

  beforeEach(async function () {
    [admin, attacker, victim, treasury] = await hre.ethers.getSigners();

    MaliciousTokenFactory = await hre.ethers.getContractFactory("MaliciousToken");
    ERC20MockFactory = await hre.ethers.getContractFactory("ERC20Mock");
    VaultFactory = await hre.ethers.getContractFactory("SentinelVaultERC4626");
    AaveAdapterFactory = await hre.ethers.getContractFactory("AaveV3Adapter");

    // Deploy Mock Aave
    const MockAave = await hre.ethers.getContractFactory("MockAavePool");
    const mockAave = await MockAave.deploy();

    // 1. RE-ENTRANCY SETUP
    maliciousToken = await MaliciousTokenFactory.deploy();
    
    adapter = await AaveAdapterFactory.deploy(await mockAave.getAddress(), admin.address);
    vault = await VaultFactory.deploy(
      await maliciousToken.getAddress(),
      "Malicious Vault",
      "mVAULT",
      await adapter.getAddress(),
      treasury.address,
      hre.ethers.ZeroAddress, // Oracle
      admin.address
    );

    await maliciousToken.setVault(await vault.getAddress());
    
    const VAULT_ROLE = await adapter.VAULT_ROLE();
    await adapter.grantRole(VAULT_ROLE, await vault.getAddress());

      // 2. INFLATION ATTACK SETUP
      normalToken = await ERC20MockFactory.deploy("Normal Token", "NORM", admin.address, hre.ethers.parseEther("1000000"));
      
      const UniAdapterFactory = await hre.ethers.getContractFactory("UniswapV3Adapter");
      const normalAdapter = await UniAdapterFactory.deploy(admin.address, admin.address);
      this.normalVault = await VaultFactory.deploy(
        await normalToken.getAddress(),
        "Normal Vault",
        "nVAULT",
        await normalAdapter.getAddress(),
        treasury.address,
        hre.ethers.ZeroAddress, // Oracle
        admin.address
      );
      const VAULT_ROLE_UNI = await normalAdapter.VAULT_ROLE();
      await normalAdapter.grantRole(VAULT_ROLE_UNI, await this.normalVault.getAddress());

  });

  describe("Re-entrancy Attack Vector", function () {
    it("should revert if attacker tries to re-enter during deposit", async function () {
      const depositAmount = hre.ethers.parseEther("10");
      
      await maliciousToken.mint(attacker.address, depositAmount * 2n);
      await maliciousToken.connect(attacker).approve(await vault.getAddress(), hre.ethers.MaxUint256);

      await maliciousToken.startAttack();

      // The vault calls `transferFrom`, which will call our malicious `transferFrom`
      // Since it's protected by `nonReentrant`, the inner call to `deposit` will revert.
      // Therefore, the entire transaction will revert.
      await expect(
        vault.connect(attacker).deposit(depositAmount, attacker.address)
      ).to.be.revertedWithCustomError(vault, "ReentrancyGuardReentrantCall");
    });
  });

  describe("Inflation/Donation Attack Vector (Exchange Rate Manipulation)", function () {
    it("should resist inflation attack causing zero shares for victim", async function () {
      // Attacker gets some normal token
      await normalToken.mint(attacker.address, hre.ethers.parseEther("100"));
      await normalToken.connect(attacker).approve(await this.normalVault.getAddress(), hre.ethers.MaxUint256);

      // 1. Attacker deposits minimal amount to get 1 share.
      // Vault deposit fee is default 0.1% (10 bps). Wait, 1 wei deposit?
      // If attacker deposits 1000 wei, fee is 1 wei, assetsAfterFee = 999.
      const initialDeposit = 1000n;
      await this.normalVault.connect(attacker).deposit(initialDeposit, attacker.address);
      const attackerShares = await this.normalVault.balanceOf(attacker.address);
      expect(attackerShares).to.equal(999n);

      // 2. Attacker donates a large amount of assets directly to the vault 
      // (Bypasses deposit function / creates false balance)
      const donationAmount = hre.ethers.parseEther("10");
      // Transfer to vault directly (this is how the inflation attack works)
      await normalToken.connect(attacker).transfer(await this.normalVault.getAddress(), donationAmount);

      // Now totalAssets() is 999 + donationAmount.
      // Total shares is 999.
      const totalAssets = await this.normalVault.totalAssets();
      expect(totalAssets >= donationAmount).to.be.true;

      // 3. Victim tries to deposit 10 ether
      const victimDeposit = hre.ethers.parseEther("10");
      await normalToken.mint(victim.address, victimDeposit);
      await normalToken.connect(victim).approve(await this.normalVault.getAddress(), hre.ethers.MaxUint256);

      const victimSharesBefore = await this.normalVault.balanceOf(victim.address);
      
      await this.normalVault.connect(victim).deposit(victimDeposit, victim.address);
      
      const victimSharesAfter = await this.normalVault.balanceOf(victim.address);
      const mintedShares = victimSharesAfter - victimSharesBefore;

      // In a completely vulnerable ERC4626 implementation, if the inflation causes precision loss rounding to zero,
      // the victim gets 0 shares and their funds are absorbed.
      // Let's verify that the victim ACTUALLY receives shares > 0.
      expect(mintedShares).to.be.greaterThan(0n);
      
      // OpenZeppelin ERC4626 mitigates this via virtual offsets (depending on OZ version).
      // If victim gets > 0 shares, the protocol is resistant.
    });
  });
});
