// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SentinelVaultERC4626} from "./SentinelVaultERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SentinelVaultFactory
 * @notice Factory to deploy and track Sentinel Vaults for different assets.
 */
contract SentinelVaultFactory is AccessControl {
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    address[] public allVaults;
    mapping(address => address) public getVault; // asset => vault

    address public defaultYieldAdapter;
    address public immutable treasury;
    address public oracle;

    error VaultAlreadyExists();
    error Sentinel__InvalidAddress();

    event VaultCreated(address indexed asset, address indexed vault, uint256 indexed index);
    event DefaultYieldAdapterUpdated(address indexed newAdapter);
    event OracleUpdated(address indexed newOracle);

    constructor(address _defaultYieldAdapter, address _treasury, address _oracle, address _admin) {
        if (_defaultYieldAdapter == address(0) || _treasury == address(0) || _oracle == address(0) || _admin == address(0)) {
            revert Sentinel__InvalidAddress();
        }
        defaultYieldAdapter = _defaultYieldAdapter;
        treasury = _treasury;
        oracle = _oracle;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function createVault(
        address asset,
        string calldata name,
        string calldata symbol
    ) external onlyRole(DEPLOYER_ROLE) returns (address) {
        if (getVault[asset] != address(0)) revert VaultAlreadyExists();

        SentinelVaultERC4626 vault = new SentinelVaultERC4626(
            IERC20(asset),
            name,
            symbol,
            defaultYieldAdapter,
            treasury,
            oracle,
            msg.sender
        );

        address vaultAddress = address(vault);
        getVault[asset] = vaultAddress;
        allVaults.push(vaultAddress);

        emit VaultCreated(asset, vaultAddress, allVaults.length - 1);
        return vaultAddress;
    }

    function setDefaultYieldAdapter(address _newAdapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newAdapter == address(0)) revert Sentinel__InvalidAddress();
        defaultYieldAdapter = _newAdapter;
        emit DefaultYieldAdapterUpdated(_newAdapter);
    }

    function setOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_oracle == address(0)) revert Sentinel__InvalidAddress();
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function getVaultsCount() external view returns (uint256) {
        return allVaults.length;
    }
}
