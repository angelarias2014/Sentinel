// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IVault {
    function deposit(uint256 assets, address receiver) external returns (uint256);
}

contract MaliciousToken is ERC20 {
    IVault public vault;
    bool public isAttacking;

    constructor() payable ERC20("Malicious Token", "MAL") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function setVault(address _vault) external {
        vault = IVault(_vault);
    }

    function startAttack() external {
        isAttacking = true;
    }

    function stopAttack() external {
        isAttacking = false;
    }

    // Override transferFrom to attempt re-entrancy
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        bool result = super.transferFrom(from, to, amount);
        
        if (isAttacking && address(vault) != address(0)) {
            isAttacking = false; // Prevent infinite loop
            // Attempt re-entrancy
            vault.deposit(amount, msg.sender);
        }
        
        return result;
    }
    
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
