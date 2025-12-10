// contracts/oracles/GoogleFitOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GoogleFitOracle is Ownable {
    struct VerifiedData {
        uint64 steps;
        uint64 calories;
        uint64 heartRate;
        uint64 timestamp;
        bool verified;
        address verifier;
    }
    
    mapping(address => mapping(uint64 => VerifiedData)) public userVerifiedData;
    mapping(address => bool) public authorizedVerifiers;
    
    event DataVerified(
        address indexed user,
        uint64 steps,
        uint64 calories,
        uint64 heartRate,
        uint64 date,
        address verifier
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        authorizedVerifiers[msg.sender] = true;
    }
    
    function addVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }
    
    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }
    
    function verifyHealthData(
        address _user,
        uint64 _steps,
        uint64 _calories,
        uint64 _heartRate,
        uint64 _timestamp,
        bytes memory _signature
    ) external onlyVerifier returns (bool) {
        uint64 date = _timestamp / 1 days;
        
        require(_steps <= 50000, "Invalid steps");
        require(_calories <= 20000, "Invalid calories");
        require(_heartRate >= 40 && _heartRate <= 220, "Invalid heart rate");
        
        // Simple signature check (dalam production butuh real verification)
        require(_signature.length > 0, "Signature required");
        
        userVerifiedData[_user][date] = VerifiedData({
            steps: _steps,
            calories: _calories,
            heartRate: _heartRate,
            timestamp: _timestamp,
            verified: true,
            verifier: msg.sender
        });
        
        emit DataVerified(_user, _steps, _calories, _heartRate, date, msg.sender);
        return true;
    }
    
    function isDataVerified(address _user, uint64 _date) external view returns (bool) {
        return userVerifiedData[_user][_date].verified;
    }
}