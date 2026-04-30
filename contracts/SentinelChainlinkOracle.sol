// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ISentinelOracle} from "./ISentinelOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SentinelChainlinkOracle
 * @notice Implements ISentinelOracle using Chainlink Price Feeds.
 * @dev Returns a risk score based on price staleness and sequencer health.
 */
contract SentinelChainlinkOracle is ISentinelOracle, Ownable {
    mapping(address => address) public priceFeeds;
    mapping(address => uint256) public heartbeat; // Expected update frequency in seconds
    
    address public immutable sequencerUptimeFeed;
    uint256 public constant GRACE_PERIOD_TIME = 3600; // 1 hour

    event PriceFeedUpdated(address indexed asset, address indexed feed, uint256 indexed heartbeat);

    error Sentinel__SequencerDown();
    error Sentinel__InvalidPriceFeed();
    error Sentinel__InvalidAddress();

    constructor(address _admin, address _sequencerUptimeFeed) Ownable(_admin) {
        if (_admin == address(0)) revert Sentinel__InvalidAddress();
        sequencerUptimeFeed = _sequencerUptimeFeed;
    }

    function setPriceFeed(address asset, address feed, uint256 _heartbeat) external onlyOwner {
        priceFeeds[asset] = feed;
        heartbeat[asset] = _heartbeat;
        emit PriceFeedUpdated(asset, feed, _heartbeat);
    }

    /**
     * @notice Returns a risk score (0-100) for an asset.
     * @param asset The address of the token to check.
     * @return score 0 = Low Risk, 100 = critical risk / emergency.
     */
    function getRiskScore(address asset) external view override returns (uint256) {
        address feed = priceFeeds[asset];
        if (feed == address(0)) return 100; // Unknown asset = high risk

        if (isEmergencyActive()) {
             return 100; // Emergency active (Sequencer down etc)
        }

        (uint80 roundId, int256 price, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) = AggregatorV3Interface(feed).latestRoundData();
        // Use all values to satisfy Slither and ensure integrity
        if (price < 1 || roundId == 0 || updatedAt == 0 || answeredInRound < roundId) return 90; // Invalid price
        
        uint256 delta = block.timestamp - updatedAt;
        if (heartbeat[asset] > 0 && delta > heartbeat[asset]) {
            return 80; // Stale price = high risk
        }
        
        return 10; // Normal health (baseline risk)
    }

    /**
     * @notice Checks if the network or sequencer is in an emergency state.
     * @dev Uses Chainlink Sequencer Uptime Feed if configured.
     */
    function isEmergencyActive() public view override returns (bool) {
        if (sequencerUptimeFeed != address(0)) {
            (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) = AggregatorV3Interface(sequencerUptimeFeed).latestRoundData();
            // Use values to ensure feed validity
            if (roundId == 0 || updatedAt == 0 || answeredInRound < roundId) return true; 

            // answer == 0: Sequencer is up
            // answer == 1: Sequencer is down
            bool isSequencerDown = (answer == 1);
            if (isSequencerDown) {
                return true;
            }

            // Check grace period after sequencer comes back online
            if (block.timestamp - startedAt < GRACE_PERIOD_TIME + 1) {
                return true;
            }
        }
        return false;
    }
}
