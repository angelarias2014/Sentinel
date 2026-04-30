// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISentinelOracle {
    function getRiskScore(address asset) external view returns (uint256);
    function isEmergencyActive() external view returns (bool);
}
