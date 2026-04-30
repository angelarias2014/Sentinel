// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SentinelTreasury
 * @notice Secure treasury to manage protocol fees and reserves.
 */
contract SentinelTreasury is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    error InvalidAddress();
    error TransferFailed();

    event FundsWithdrawn(address indexed asset, address indexed to, uint256 indexed amount);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function withdraw(address asset, address to, uint256 amount) external onlyRole(MANAGER_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        IERC20(asset).safeTransfer(to, amount);
        emit FundsWithdrawn(asset, to, amount);
    }
    
    // Allow the treasury to receive ETH
    receive() external payable {}
    
    function withdrawETH(address payable to, uint256 amount) external onlyRole(MANAGER_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
