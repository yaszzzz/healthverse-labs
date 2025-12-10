// contracts/tokens/HealthToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HealthToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 juta tokens
    address public healthVerseContract;
    
    event HealthVerseContractUpdated(address indexed newContract);
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("HealthVerse Token", "HEALTH") Ownable(msg.sender) {
        _mint(msg.sender, 2_000_000 * 10**18); // 2 juta initial
    }
    
    function setHealthVerseContract(address _healthVerse) external onlyOwner {
        require(healthVerseContract == address(0), "Already set");
        healthVerseContract = _healthVerse;
        emit HealthVerseContractUpdated(_healthVerse);
    }
    
    function mintRewards(address _to, uint256 _amount) external {
        require(msg.sender == healthVerseContract, "Only HealthVerse can mint");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }
    
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }
}