// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IYieldAdapter} from "../IYieldAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title QuickswapV3Adapter
 * @notice Yield adapter for Quickswap V3 (Algebra).
 */
contract QuickswapV3Adapter is IYieldAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function deposit(address, address asset, uint256 amount) external onlyRole(VAULT_ROLE) returns (uint256) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        // Mocking: single asset deposit to Quickswap V3
        return amount;
    }

    function withdraw(address vault, address asset, uint256 amount, address to) external onlyRole(VAULT_ROLE) returns (uint256) {
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    function getBalance(address vault, address asset) external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }

    function emergencyWithdraw(address vault, address asset, address to) external onlyRole(VAULT_ROLE) {
        uint256 bal = IERC20(asset).balanceOf(address(this));
        if(bal > 0) {
           IERC20(asset).safeTransfer(to, bal);
        }
    }
}
