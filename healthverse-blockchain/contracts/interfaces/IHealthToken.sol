// contracts/interfaces/IHealthToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHealthToken {
    function mintRewards(address _to, uint256 _amount) external;
    function transfer(address to, uint256 amount) external returns (bool); // Tambahkan ini
    function balanceOf(address account) external view returns (uint256); // Tambahkan ini jika perlu
}