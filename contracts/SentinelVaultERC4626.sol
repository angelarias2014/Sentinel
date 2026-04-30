// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IYieldAdapter} from "./IYieldAdapter.sol";
import {ISentinelOracle} from "./ISentinelOracle.sol";

/**
 * @title SentinelVaultERC4626
 * @author Sentinel Protocol
 * @notice A high-integrity, AI-protected vault following the ERC4626 standard.
 * @dev Integrates with diverse yield protocols via adapters and incorporates an AI risk oracle.
 */
contract SentinelVaultERC4626 is ERC4626, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public depositFeeBps = 10; // 0.1%
    uint256 public withdrawFeeBps = 10; // 0.1%
    uint256 public riskThreshold = 75; // 0-100 scale

    address public immutable treasury;
    IYieldAdapter public yieldAdapter;
    ISentinelOracle public riskOracle;
    
    bool public isEmergencyShieldActive;
    uint256 public lastRiskScore;

    event RiskScoreUpdated(uint256 indexed score, bool indexed emergencyTriggered);
    event EmergencyShieldToggled(bool indexed active);
    event FeesUpdated(uint256 indexed depositFee, uint256 indexed withdrawFee);
    event AdapterChanged(address indexed oldAdapter, address indexed newAdapter);
    event OracleUpdated(address indexed newOracle);

    error Sentinel__RiskTooHigh();
    error Sentinel__ShieldActive();
    error Sentinel__Unauthorized();
    error Sentinel__InvalidConfiguration();

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address _yieldAdapter,
        address _treasury,
        address _oracle,
        address _admin
    ) ERC4626(asset_) ERC20(name_, symbol_) {
        if (_yieldAdapter == address(0) || _treasury == address(0) || _admin == address(0)) revert Sentinel__InvalidConfiguration();
        
        yieldAdapter = IYieldAdapter(_yieldAdapter);
        treasury = _treasury;
        riskOracle = ISentinelOracle(_oracle);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        
        // Grant allowance to Yield Adapter
        asset_.safeIncreaseAllowance(_yieldAdapter, type(uint256).max);
    }

    /**
     * @dev Overridden deposit to include security checks and fees.
     */
    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256) {
        if (isEmergencyShieldActive) revert Sentinel__ShieldActive();
        
        // Dynamic Risk Check from Oracle if set
        if (address(riskOracle) != address(0)) {
            lastRiskScore = riskOracle.getRiskScore(asset());
        }
        
        if (lastRiskScore > riskThreshold) revert Sentinel__RiskTooHigh();

        uint256 fee = (assets * depositFeeBps) / FEE_DENOMINATOR;
        uint256 assetsAfterFee = assets - fee;

        if (fee > 0) {
            IERC20(asset()).safeTransferFrom(msg.sender, treasury, fee);
        }

        uint256 shares = super.deposit(assetsAfterFee, receiver);
        
        // Deploy to Yield Protocol via Adapter
        uint256 deposited = yieldAdapter.deposit(address(this), asset(), assetsAfterFee);
        require(deposited >= assetsAfterFee, "Sentinel: Deposit failure");
        
        return shares;
    }

    /**
     * @dev Overridden withdraw to include security checks and fees.
     */
    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant returns (uint256) {
        if (isEmergencyShieldActive && msg.sender != owner) revert Sentinel__ShieldActive();

        // Withdraw from Yield Protocol if needed
        uint256 rawBalance = IERC20(asset()).balanceOf(address(this));
        if (rawBalance < assets) {
            uint256 withdrawn = yieldAdapter.withdraw(address(this), asset(), assets - rawBalance, address(this));
            require(withdrawn >= (assets - rawBalance), "Sentinel: Withdraw insufficient");
        }

        uint256 fee = (assets * withdrawFeeBps) / FEE_DENOMINATOR;
        uint256 assetsAfterFee = assets - fee;

        if (fee > 0) {
            IERC20(asset()).safeTransfer(treasury, fee);
        }

        return super.withdraw(assetsAfterFee, receiver, owner);
    }

    /**
     * @notice Updates the risk score from the AI Oracle.
     * @param _score The new risk score (0-100).
     */
    function updateRiskScore(uint256 _score) external onlyRole(ORACLE_ROLE) {
        lastRiskScore = _score;
        bool triggered = false;
        if (_score > riskThreshold && !isEmergencyShieldActive) {
            isEmergencyShieldActive = true;
            triggered = true;
            // Emergency pull from Yield Protocol to stay in liquid cash during high risk
            uint256 totalUnderlying = totalAssets();
            if (totalUnderlying > 0) {
                try yieldAdapter.emergencyWithdraw(address(this), asset(), address(this)) {} catch {}
            }
        }
        emit RiskScoreUpdated(_score, triggered);
    }

    function setRiskThreshold(uint256 _newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        riskThreshold = _newThreshold;
    }

    function toggleShield(bool _active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isEmergencyShieldActive = _active;
        emit EmergencyShieldToggled(_active);
    }

    function setFees(uint256 _depositFee, uint256 _withdrawFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_depositFee > 500 || _withdrawFee > 500) revert Sentinel__InvalidConfiguration(); // Max 5%
        depositFeeBps = _depositFee;
        withdrawFeeBps = _withdrawFee;
        emit FeesUpdated(_depositFee, _withdrawFee);
    }

    function setRiskOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        riskOracle = ISentinelOracle(_oracle);
        emit OracleUpdated(_oracle);
    }
    
    function setYieldAdapter(address _newAdapter) external onlyRole(STRATEGIST_ROLE) nonReentrant {
        if (_newAdapter == address(0)) revert Sentinel__InvalidConfiguration();
        IYieldAdapter oldAdapter = yieldAdapter;
        
        // Move funds from old adapter to new adapter
        uint256 balanceInOldAdapter = oldAdapter.getBalance(address(this), asset());
        if(balanceInOldAdapter > 0) {
             oldAdapter.withdraw(address(this), asset(), balanceInOldAdapter, address(this));
        }
        
        // Remove allowance from old adapter
        IERC20(asset()).safeDecreaseAllowance(address(oldAdapter), IERC20(asset()).allowance(address(this), address(oldAdapter)));
        
        // Update state
        yieldAdapter = IYieldAdapter(_newAdapter);
        
        // Set new allowance
        IERC20(asset()).safeIncreaseAllowance(_newAdapter, type(uint256).max);
        
        uint256 balanceInContract = IERC20(asset()).balanceOf(address(this));
        if (balanceInContract > 0) {
             yieldAdapter.deposit(address(this), asset(), balanceInContract);
        }

        emit AdapterChanged(address(oldAdapter), _newAdapter);
    }

    /**
     * @dev Required for ERC4626 to account for assets in external protocols.
     */
    function totalAssets() public view override returns (uint256) {
        uint256 rawBalance = IERC20(asset()).balanceOf(address(this));
        uint256 deployedBalance = yieldAdapter.getBalance(address(this), asset());
        return rawBalance + deployedBalance;
    }
}
