// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/**
 * @title SentinelVault
 * @dev Multi-asset high-integrity yield distribution engine with real-time AI security audits.
 */
contract SentinelVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    uint256 public constant FEE_DENOMINATOR = 1000000;
    uint256 public constant DEPOSIT_FEE_BPS = 100; // 0.01%
    uint256 public constant EMERGENCY_WITHDRAW_FEE_BPS = 50; // 0.005%

    address public treasury;
    uint256 public riskScore;
    uint256 public riskThreshold;
    bool public isEmergencyShieldActive;

    // asset => isSupported
    mapping(address => bool) public supportedAssets;
    // user => asset => amount
    mapping(address => mapping(address => uint256)) public userBalances;
    // asset => totalDeposits
    mapping(address => uint256) public totalDeposits;

    IAavePool public immutable AAVE_POOL;

    event RiskScoreUpdated(uint256 indexed newScore, bool indexed shieldActivated);
    event Deposited(address indexed user, address indexed asset, uint256 indexed amount, uint256 fee);
    event Withdrawn(address indexed user, address indexed asset, uint256 indexed amount, uint256 fee);
    event EmergencyShieldToggled(bool indexed active);
    event AssetSupportToggled(address indexed asset, bool indexed supported);

    error Vault__RiskTooHigh();
    error Vault__ShieldActive();
    error Vault__InsufficientBalance();
    error Vault__AssetNotSupported();
    error Vault__Unauthorized();

    constructor(
        address _aavePool,
        address _treasury,
        uint256 _initialThreshold,
        address _admin,
        address _oracle
    ) {
        if (_aavePool == address(0) || _treasury == address(0) || _admin == address(0) || _oracle == address(0)) {
            revert Vault__Unauthorized(); // Using existing error or I could add InvalidAddress
        }
        AAVE_POOL = IAavePool(_aavePool);
        treasury = _treasury;
        riskThreshold = _initialThreshold;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ORACLE_ROLE, _oracle);
    }

    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = _newTreasury;
    }

    function toggleAssetSupport(address asset, bool supported) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedAssets[asset] = supported;
        if (supported) {
            IERC20(asset).safeIncreaseAllowance(address(AAVE_POOL), type(uint256).max);
        }
        emit AssetSupportToggled(asset, supported);
    }

    function deposit(address asset, uint256 amount) external nonReentrant {
        if (!supportedAssets[asset]) revert Vault__AssetNotSupported();
        if (isEmergencyShieldActive) revert Vault__ShieldActive();
        if (amount == 0) return;

        uint256 fee = (amount * DEPOSIT_FEE_BPS) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        if (fee > 0) {
            IERC20(asset).safeTransfer(treasury, fee);
        }

        userBalances[msg.sender][asset] += netAmount;
        totalDeposits[asset] += netAmount;
        
        AAVE_POOL.supply(asset, netAmount, address(this), 0);

        emit Deposited(msg.sender, asset, netAmount, fee);
    }

    function withdraw(address asset, uint256 amount) external nonReentrant {
        if (userBalances[msg.sender][asset] < amount) revert Vault__InsufficientBalance();

        uint256 fee = 0;
        if (isEmergencyShieldActive) {
            fee = (amount * EMERGENCY_WITHDRAW_FEE_BPS) / FEE_DENOMINATOR;
        }

        uint256 amountToUser = amount - fee;

        userBalances[msg.sender][asset] -= amount;
        totalDeposits[asset] -= amount;

        if (!isEmergencyShieldActive) {
            uint256 withdrawn = AAVE_POOL.withdraw(asset, amount, address(this));
            require(withdrawn >= amount, "Vault: Aave withdraw failed");
        }

        if (fee > 0) {
            IERC20(asset).safeTransfer(treasury, fee);
        }
        
        IERC20(asset).safeTransfer(msg.sender, amountToUser);

        emit Withdrawn(msg.sender, asset, amountToUser, fee);
    }

    function updateRiskScore(uint256 newScore) external onlyRole(ORACLE_ROLE) nonReentrant {
        riskScore = newScore;
        
        bool shieldActivated = false;
        if (newScore > riskThreshold && !isEmergencyShieldActive) {
            isEmergencyShieldActive = true;
            // In a real scenario, we would loop through supported assets or withdraw selectively
            // For this implementation, we assume the Oracle informs which assets to pull if needed
            shieldActivated = true;
        }

        emit RiskScoreUpdated(newScore, shieldActivated);
    }

    function setRiskThreshold(uint256 _newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        riskThreshold = _newThreshold;
    }
    
    function deactivateShield() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        isEmergencyShieldActive = false;
        emit EmergencyShieldToggled(false);
    }

    function activateShield() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        isEmergencyShieldActive = true;
        emit EmergencyShieldToggled(true);
    }

    // Emergency function to pull funds from Aave if needed manually by admin
    function emergencyPull(address asset) external onlyRole(DEFAULT_ADMIN_ROLE) {
        AAVE_POOL.withdraw(asset, type(uint256).max, address(this));
    }
}
