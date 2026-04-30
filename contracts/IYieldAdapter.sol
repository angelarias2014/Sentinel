// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IYieldAdapter
 * @notice Standard interface for yield protocol adapters (Aave, Curve, Uniswap, etc.)
 */
interface IYieldAdapter {
    function deposit(address vault, address asset, uint256 amount) external returns (uint256);
    function withdraw(address vault, address asset, uint256 amount, address to) external returns (uint256);
    function getBalance(address vault, address asset) external view returns (uint256);
    function emergencyWithdraw(address vault, address asset, address to) external;
}
