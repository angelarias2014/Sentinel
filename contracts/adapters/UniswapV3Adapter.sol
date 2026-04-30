// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IYieldAdapter} from "../IYieldAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

// Interfaces for Uniswap V3 interaction
interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);

    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );
}

/**
 * @title UniswapV3Adapter
 * @notice Yield adapter for Uniswap V3.
 * @dev Simplified version: assumes adapter uses a predefined pair and fee tier for yielding.
 */
contract UniswapV3Adapter is IYieldAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    INonfungiblePositionManager public immutable POSITION_MANAGER;
    
    // vault => asset => tokenId (simplified mapping for 1 position per asset per vault)
    mapping(address => mapping(address => uint256)) public vaultPositions;

    constructor(address _positionManager, address _admin) {
        POSITION_MANAGER = INonfungiblePositionManager(_positionManager);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function deposit(address, address asset, uint256 amount) external onlyRole(VAULT_ROLE) returns (uint256) {
        // Warning: this is a highly simplified prototype mock logic. 
        // Real logic requires passing 2 tokens to Uniswap V3 `mint` or `increaseLiquidity`.
        // This accepts a single asset and would theoretically zap or use it. We'll simulate deposit.
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        // Mocking: just keep the tokens and simulate it's deployed.
        // In a real V3 integration we would wrap it, pair it, and `positionManager.mint(...)`
        return amount;
    }

    function withdraw(address vault, address asset, uint256 amount, address to) external onlyRole(VAULT_ROLE) returns (uint256) {
        // Mocking withdrawal
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    function getBalance(address vault, address asset) external view returns (uint256) {
        // Return physical balance for now as we mocked deposit
        return IERC20(asset).balanceOf(address(this));
    }

    function emergencyWithdraw(address vault, address asset, address to) external onlyRole(VAULT_ROLE) {
        // Pull out all mocked balance
        uint256 bal = IERC20(asset).balanceOf(address(this));
        if(bal > 0) {
           IERC20(asset).safeTransfer(to, bal);
        }
    }
}
