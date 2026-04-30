// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IYieldAdapter} from "../IYieldAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IBalancerVault {
    enum JoinKind { INIT, EXACT_TOKENS_IN_FOR_BPT_OUT, TOKEN_IN_FOR_EXACT_BPT_OUT, ALL_TOKENS_IN_FOR_EXACT_BPT_OUT }

    struct JoinPoolRequest {
        address[] assets;
        uint256[] maxAmountsIn;
        bytes userData;
        bool fromInternalBalance;
    }

    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory request
    ) external payable;

    struct ExitPoolRequest {
        address[] assets;
        uint256[] minAmountsOut;
        bytes userData;
        bool toInternalBalance;
    }

    function exitPool(
        bytes32 poolId,
        address sender,
        address payable recipient,
        ExitPoolRequest memory request
    ) external;
}

/**
 * @title BalancerV2Adapter
 * @notice Yield adapter for Balancer V2.
 */
contract BalancerV2Adapter is IYieldAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    IBalancerVault public immutable BALANCER_VAULT;
    
    // Mapping single asset to a specific BPT poolId
    mapping(address => bytes32) public assetToPoolId;

    constructor(address _balancerVault, address _admin) {
        BALANCER_VAULT = IBalancerVault(_balancerVault);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function setPoolId(address asset, bytes32 poolId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assetToPoolId[asset] = poolId;
    }

    function deposit(address, address asset, uint256 amount) external onlyRole(VAULT_ROLE) returns (uint256) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        // Mocking logic to keep it simple for single-asset vaults in this prototype.
        // A real adapter would wrap the asset or supply it as single sided liquidity using `joinPool`
        
        return amount; // Placeholder
    }

    function withdraw(address vault, address asset, uint256 amount, address to) external onlyRole(VAULT_ROLE) returns (uint256) {
        // Mocking withdrawal
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    function getBalance(address vault, address asset) external view returns (uint256) {
        // Mocking balance
        return IERC20(asset).balanceOf(address(this));
    }

    function emergencyWithdraw(address vault, address asset, address to) external onlyRole(VAULT_ROLE) {
        uint256 bal = IERC20(asset).balanceOf(address(this));
        if(bal > 0) {
           IERC20(asset).safeTransfer(to, bal);
        }
    }
}
