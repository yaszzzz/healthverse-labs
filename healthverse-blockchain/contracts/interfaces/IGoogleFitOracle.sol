// contracts/interfaces/IGoogleFitOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGoogleFitOracle {
    function verifyHealthData(
        address _user,
        uint64 _steps,
        uint64 _calories,
        uint64 _heartRate,
        uint64 _timestamp,
        bytes memory _signature
    ) external returns (bool);
    
    function isDataVerified(address _user, uint64 _date) external view returns (bool);
}