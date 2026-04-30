// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IYieldAdapter} from "../IYieldAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IAToken is IERC20 {}

/**
 * @title AaveV3Adapter
 * @notice Yield adapter for Aave V3.
 */
contract AaveV3Adapter is IYieldAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    IAavePool public immutable AAVE_POOL;

    // Mapping asset to its aToken equivalent
    mapping(address => address) public aTokens;

    constructor(address _aavePool, address _admin) {
        AAVE_POOL = IAavePool(_aavePool);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function setAToken(address asset, address aToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        aTokens[asset] = aToken;
    }

    function deposit(address, address asset, uint256 amount) external onlyRole(VAULT_ROLE) returns (uint256) {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).safeIncreaseAllowance(address(AAVE_POOL), amount);
        
        AAVE_POOL.supply(asset, amount, address(this), 0); // Adapter holds the aTokens
        return amount;
    }

    function withdraw(address vault, address asset, uint256 amount, address to) external onlyRole(VAULT_ROLE) returns (uint256) {
        return AAVE_POOL.withdraw(asset, amount, to);
    }

    function getBalance(address vault, address asset) external view returns (uint256) {
        address aToken = aTokens[asset];
        if (aToken == address(0)) return 0;
        return IERC20(aToken).balanceOf(address(this));
    }

    function emergencyWithdraw(address, address asset, address to) external onlyRole(VAULT_ROLE) {
        uint256 withdrawn = AAVE_POOL.withdraw(asset, type(uint256).max, to);
        require(withdrawn > 0 || IERC20(asset).balanceOf(address(this)) == 0, "Aave: Emergency withdraw failed");
    }
}
