// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAavePool {
    using SafeERC20 for IERC20;

    function supply(address asset, uint256 amount, address /* onBehalfOf */, uint16 /* referralCode */) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        uint256 amountToWithdraw = amount > balance ? balance : amount;
        IERC20(asset).safeTransfer(to, amountToWithdraw);
        return amountToWithdraw;
    }
}
